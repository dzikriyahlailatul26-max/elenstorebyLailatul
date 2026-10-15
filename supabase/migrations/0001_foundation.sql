-- ============================================================
-- Elen Store — Fase 1: Fondasi (TOGAF Phase C: Data Architecture)
-- Jalankan sekali di SQL Editor Supabase, atau via Supabase CLI:
--   supabase db push
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. profiles (identitas & role user, dipetakan dari email Cloudflare Access)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  email      text primary key,
  nama       text,
  role       text not null default 'host_live'
             check (role in ('owner', 'admin_gudang', 'admin_penjualan', 'host_live')),
  aktif      boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. products: tambah kolom untuk modul berikutnya (Fase 3+)
-- ------------------------------------------------------------
alter table public.products
  add column if not exists nama        text,
  add column if not exists harga_jual  numeric(12,2) not null default 0,
  add column if not exists harga_modal numeric(12,2) not null default 0,
  add column if not exists min_stock   integer not null default 0,
  add column if not exists kategori    text,
  add column if not exists gambar      text;

-- ------------------------------------------------------------
-- 3. transactions (riwayat mutasi stok — audit trail)
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type       text not null check (type in ('IN', 'OUT', 'ADJUST', 'RETURN', 'DAMAGED')),
  qty        integer not null check (qty > 0),
  user_email text not null,
  catatan    text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_product_id_idx on public.transactions(product_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);

-- ------------------------------------------------------------
-- 4. orders + order_items (penjualan manual & capture live) — Fase 4/5
-- ------------------------------------------------------------
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  kode_order text not null unique,
  customer   text not null,
  sumber     text not null default 'MANUAL' check (sumber in ('LIVE', 'MANUAL')),
  host_email text,
  total      numeric(14,2) not null default 0,
  status     text not null default 'BELUM_LUNAS' check (status in ('BELUM_LUNAS', 'BAYAR', 'BATAL')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty        integer not null check (qty > 0),
  harga      numeric(12,2) not null default 0
);

-- ------------------------------------------------------------
-- 5. po_orders + po_items (pre-order) — Fase 3
-- ------------------------------------------------------------
create table if not exists public.po_orders (
  id          uuid primary key default gen_random_uuid(),
  kode_po     text not null unique,
  customer    text not null,
  dp          numeric(12,2) not null default 0,
  status      text not null default 'MENUNGGU'
              check (status in ('MENUNGGU', 'DIPROSES', 'SELESAI', 'BATAL')),
  deadline    date,
  dibuat_oleh text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.po_items (
  id         uuid primary key default gen_random_uuid(),
  po_id      uuid not null references public.po_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty        integer not null check (qty > 0)
);

-- ------------------------------------------------------------
-- 6. live_sessions (sesi live selling) — Fase 5
-- ------------------------------------------------------------
create table if not exists public.live_sessions (
  id              uuid primary key default gen_random_uuid(),
  judul           text not null,
  host_email      text not null,
  mulai           timestamptz not null default now(),
  selesai         timestamptz,
  total_penjualan numeric(14,2) not null default 0
);

-- ------------------------------------------------------------
-- 7. audit_logs (Fase 6 — disiapkan lebih dahulu)
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  aktivitas  text not null,
  tabel      text,
  user_email text not null,
  detail     jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. RPC atomic: stok_masuk & stok_keluar (anti-oversell)
--    security definer: jalan sebagai owner fungsi (bypass RLS sementara).
--    Pengecekan otorisasi tetap dilakukan di lapisan aplikasi (Server Action).
-- ------------------------------------------------------------
create or replace function public.stok_masuk(p_sku text, p_qty integer, p_user_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.products
     set ready_stock = ready_stock + p_qty
   where lower(sku) = lower(p_sku)
  returning id into v_id;

  if v_id is null then
    raise exception 'SKU tidak ditemukan: %', p_sku;
  end if;

  insert into public.transactions (product_id, type, qty, user_email, catatan)
  values (v_id, 'IN', p_qty, p_user_email, 'Barang masuk');
end;
$$;

create or replace function public.stok_keluar(p_sku text, p_qty integer, p_user_email text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_sisa integer;
begin
  update public.products
     set ready_stock = ready_stock - p_qty
   where lower(sku) = lower(p_sku)
     and ready_stock >= p_qty
  returning id, ready_stock into v_id, v_sisa;

  if v_id is null then
    return 0;
  end if;

  insert into public.transactions (product_id, type, qty, user_email, catatan)
  values (v_id, 'OUT', p_qty, p_user_email, 'Barang keluar');

  return v_sisa;
end;
$$;

-- ------------------------------------------------------------
-- 9. RLS: aktif, default-deny untuk anon/public.
--    Fase 1 memakai service role server-side; kebijakan per role
--    di-hardening pada Fase 6 (sesuai blueprint TOGAF §7).
-- ------------------------------------------------------------
alter table public.products      enable row level security;
alter table public.profiles      enable row level security;
alter table public.transactions  enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.po_orders     enable row level security;
alter table public.po_items      enable row level security;
alter table public.live_sessions enable row level security;
alter table public.audit_logs    enable row level security;

comment on table public.profiles is 'Identitas & role user (dipetakan dari email Cloudflare Access)';
comment on function public.stok_keluar(text, integer, text) is 'Potong stok atomic: return 0 bila SKU tidak ada atau stok < qty';

commit;
