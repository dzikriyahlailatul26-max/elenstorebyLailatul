# Elen Store — Management Stok Lavie Pants

Sistem inventori toko Elen Store (Lavie Pants): stok ready, kuota pre-order (PO),
penjualan manual, dan capture order live selling — dengan 4 role
(Owner, Admin Gudang, Admin Pendataan, Host Live).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Cloudflare Workers** via [OpenNext](https://opennext.js.org) — hosting edge
- **Cloudflare Access** — Zero Trust auth (4 Access Groups per role)
- **Supabase** — Postgres + RLS + Realtime
- **Tailwind CSS 4**

> **Catatan arsitektur:** blueprint awal merencanakan Cloudflare *Pages*, tapi
> OpenNext v1 secara native men-deploy ke Cloudflare **Workers** (didukung penuh,
> termasuk proxy & Cloudflare Access). Keduanya sama-sama edge Cloudflare;
> Workers dipakai sebagai pengganti Pages. Detail: `docs/ARCHITECTURE.md` §5.

## Setup lokal

1. `npm install`
2. Salin `.env.example` → `.env.local`, isi `SUPABASE_URL` & key Supabase
3. Jalankan migrasi DB: buka **SQL Editor** Supabase, paste
   `supabase/migrations/0001_foundation.sql`, lalu **Run**
4. `npm run dev` → http://localhost:3000

Mode dev: `DEV_BYPASS_ACCESS=true` di `.env.local` melewati Cloudflare Access
untuk pengembangan lokal (akun auto-provision dengan role `DEV_DEFAULT_ROLE`).
**Jangan** aktifkan di produksi.

> **Windows:** workerd (runtime Workers) crash di Windows, jadi `npm run dev`
> memakai Next.js dev server biasa (tanpa workerd). Build OpenNext untuk
> deploy dijalankan otomatis di GitHub Actions (Linux) — atau di WSL2 bila
> ingin build lokal. Detail: `docs/ARCHITECTURE.md` §9.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server Next.js (proxy jalan di Node runtime) |
| `npm run build` | Build Next.js (otomatis dipanggil oleh `opennextjs-cloudflare build`) |
| `npm run preview` | Build OpenNext + preview di Workers runtime (Wrangler) |
| `npm run deploy` | Build OpenNext + deploy ke Cloudflare Workers |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript check |

## Deploy

- Hosting: Cloudflare Workers — build `npm run build` (OpenNext)
- Auth: Cloudflare Access, 4 Access Groups (owner / admin-gudang / admin-penjualan / host-live)
- CI/CD: `.github/workflows/` — CI tiap PR, deploy otomatis dari `main`
- Secrets GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Struktur role

| Role | Akses |
|---|---|
| **Owner** | Monitoring, laporan, audit log (lihat semua) |
| **Admin Gudang** | Barang masuk/keluar, opname, PO, CRUD produk |
| **Admin Pendataan** | Penjualan manual, pembayaran, keuangan |
| **Host Live** | Capture order saat live, lihat stok real-time |

## Struktur proyek

```
app/                  # App Router (page, layout, server actions)
  actions/stock.ts    # Server Action mutasi stok (role-gated, atomic)
  gudang/             # Modul gudang (Fase 1–2)
  produk/ po/ penjualan/ live/ laporan/  # Placeholder modul (Fase 3–6)
components/           # StockTable, ModulePlaceholder
lib/
  access.ts           # Verifikasi JWT Cloudflare Access (jose + JWKS)
  dal.ts              # Data Access Layer — identitas & role per request
  roles.ts            # RBAC: 4 role × 9 permission
  supabase/           # Server client (service role) + types
proxy.ts              # Pengganti middleware (Next.js 16) — verifikasi Access JWT
supabase/migrations/  # Database-as-code (SQL, versi per migrasi)
docs/ARCHITECTURE.md  # Blueprint arsitektur (TOGAF ADM)
```

Dokumentasi arsitektur lengkap: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
