# TOGAF Architecture Blueprint — Elen Store (Management Stok Lavie Pants)

**Status:** Fase 1 (Fondasi) terimplementasi — Fase 2–6 menunggu
**Framework:** TOGAF ADM (scaled, iteratif — 1 iterasi = 1 fase)
**Tanggal:** 2026-10-05
**Versi aplikasi:** 0.1.0

---

## 0. Keputusan Arsitektur Final (terrekam)

| # | Keputusan |
|---|---|
| 1 | Gudang tunggal (tanpa modul transfer antar-gudang) |
| 2 | Host Live capture order langsung saat live + **potong stok instan** |
| 3 | PO (pre-order): dikelola **Admin Gudang**, dimonitor **Owner** |
| 4 | Admin Pendataan: mencatat **penjualan & keuangan** |
| 5 | 4 role terpisah: Owner, Admin Gudang, Admin Pendataan, Host Live |
| 6 | Auth: **Cloudflare Access** (Zero Trust, email-based Access Groups) |
| 7 | Hosting: **Cloudflare Workers via OpenNext** (revisi: blueprint awal menyebut Cloudflare Pages — OpenNext v1 secara native men-deploy ke Workers; keduanya edge Cloudflare, Access didukung keduanya) |

---

## 1. Preliminary Phase — Governance & Prinsip

### 1.1 Prinsip Arsitektur
1. **Single Source of Truth** — satu database Supabase sebagai sumber data tunggal
2. **Atomic Stock** — stok hanya berubah via fungsi RPC atomic (anti-oversell)
3. **Least Privilege** — Cloudflare Access + Supabase RLS per role
4. **Real-time First** — Supabase Realtime untuk monitoring & mode live
5. **Auditability** — setiap mutasi stok tercatat di `transactions` + `audit_logs`
6. **Separation of Duties** — 4 role terpisah, satu user boleh multi-role
7. **Cloud-native Edge** — hosting di Cloudflare Workers (edge CDN)

### 1.2 Arsitektur Work Statement
Sistem inventori toko apparel (Lavie Pants) dengan 4 role, 1 gudang, mendukung stok ready, kuota pre-order (PO), penjualan manual, dan capture order via live streaming.

---

## 2. Phase A — Architecture Vision

### 2.1 Stakeholders & Concerns
| Stakeholder | Concerns | Viewpoint |
|---|---|---|
| Owner | Profit, akurasi stok, keamanan data, kontrol penuh | Dashboard & laporan |
| Admin Gudang | Kecepatan scan, akurasi opname, kelola PO | Form operasional gudang |
| Admin Pendataan | Kemudahan catat order/pembayaran, laporan keuangan | Form penjualan & keuangan |
| Host Live | Stok akurat real-time, input cepat, tanpa data sensitif (modal) | Mode live |

### 2.2 Scope
- **In scope:** auth/role, gudang (masuk/keluar/opname/scan), produk & PO, penjualan & keuangan, mode live, laporan & audit
- **Out of scope:** multi-gudang, transfer antar-gudang, custom auth, integrasi kurir/ekspedisi, pembuatan website publik

### 2.3 Baseline → Target
Baseline: prototipe single-page (~25%). Target: 6 modul role-based (~100%).

---

## 3. Phase B — Business Architecture

### 3.1 Capability Map (7)
Persediaan · Penjualan · Pre-order · Pemasaran Live · Keuangan · Pengguna & Akses · Pelaporan

### 3.2 Value Streams (6)
1. **Penerimaan stok** — supplier → gudang → `ready_stock` bertambah
2. **Penjualan live** — host capture order → potong stok instan → pembayaran
3. **Penjualan manual** — admin pendataan input order & pembayaran
4. **Pre-order** — customer PO → reserve kuota (`po_reserved`) → barang datang → stok masuk → fulfill
5. **Opname** — stock take → adjust → audit
6. **Monitoring & pelaporan** — owner lihat dashboard, keuangan, audit log

### 3.3 RACI (ringkas)
| Aktivitas | Owner | Admin Gudang | Admin Pendataan | Host Live |
|---|:---:|:---:|:---:|:---:|
| Barang masuk/keluar | I | R/A | – | – |
| Opname/adjust | I | R/A | – | – |
| CRUD produk & varian | A | R | I | – |
| Kelola PO | I | R/A | – | – |
| Order manual & pembayaran | I | – | R/A | – |
| Capture order live | I | – | I | R/A |
| Sesi live | I | – | I | R/A |
| Laporan & audit | R/A | I | I | – |

---

## 4. Phase C — Information Systems Architecture

### 4.1 Data Architecture — Entitas
| Entitas | Atribut utama |
|---|---|
| `profiles` | email (PK), nama, role[], aktif |
| `products` *(diperluas)* | id, sku, color, size, nama, ready_stock, po_reserved, max_po, harga_jual, harga_modal, gambar, kategori, min_stock |
| `transactions` | id, product_id (FK), type (IN/OUT/ADJUST/RETURN/DAMAGED), qty, user_email, catatan, created_at |
| `orders` | id, kode_order, customer, sumber (LIVE/MANUAL), host_email, total, status (BAYAR/BELUM_LUNAS), created_at |
| `order_items` | order_id (FK), product_id (FK), qty, harga |
| `po_orders` | id, kode_po, customer, dp, status (MENUNGGU/DIPROSES/SELESAI/BATAL), deadline, dibuat_oleh |
| `po_items` | po_id (FK), product_id (FK), qty |
| `live_sessions` | id, judul, mulai, selesai, host_email, total_penjualan |
| `audit_logs` | id, aktivitas, tabel, user_email, detail, created_at |

Migrasi: `supabase/migrations/0001_foundation.sql` (database-as-code).

### 4.2 CRUD Matrix
| Entitas | Owner | Admin Gudang | Admin Pendataan | Host Live |
|---|:---:|:---:|:---:|:---:|
| products | R | C·R·U·D | R | R (tanpa harga_modal) |
| transactions | R | C·R | R | R (milik sendiri) |
| orders | R | R | C·R·U·D | C·R (milik sendiri) |
| order_items | R | R | C·R·U·D | C·R (milik sendiri) |
| po_orders / po_items | R | C·R·U·D | R | R |
| profiles | C·R·U·D | R (diri) | R (diri) | R (diri) |
| audit_logs | R | – | – | – |
| live_sessions | R | – | R | C·R·U·D |

### 4.3 Application Architecture — Modul & Route
| Route | Modul | Status |
|---|---|---|
| `/` | Dashboard per role | ✅ Fase 1 |
| `/gudang` | Barang masuk/keluar, riwayat mutasi | ✅ Fase 1–2 (form + mutasi atomic + audit trail) |
| `/produk` | CRUD produk & varian | 🔜 Fase 3 (placeholder) |
| `/po` | Kelola PO & kuota | 🔜 Fase 3 (placeholder) |
| `/penjualan` | Order manual, pembayaran, keuangan | 🔜 Fase 4 (placeholder) |
| `/live` | Grid stok real-time + capture order cepat + sesi live | 🔜 Fase 5 (placeholder) |
| `/laporan` | Keuangan, penjualan per live, audit log | 🔜 Fase 6 (placeholder) |

### 4.4 Interface (kunci)
- **RPC `stok_masuk` / `stok_keluar`** (Supabase function, `security definer`): update atomic `ready_stock` dengan pengecekan `ready_stock >= qty` + insert `transactions` dalam satu transaksi → anti-oversell meski multi-user konkuren
- **Supabase Realtime** subscription ke `products` (dijadwalkan Fase 5 untuk grid stok host live)
- **Server Action `updateStock`** dengan pengecekan role di server (defense in depth — UI bukan pengaman)

---

## 5. Phase D — Technology Architecture

| Layer | Teknologi | Catatan |
|---|---|---|
| Edge / Hosting | Cloudflare Workers via `@opennextjs/cloudflare` 1.20.8 | Output `.open-next/worker.js` + `.open-next/assets`; `npm run build` = `next build` (dipanggil otomatis oleh `opennextjs-cloudflare build`) |
| Request gate | `proxy.ts` (pengganti middleware, deprecated di Next 16) | Node.js runtime default |
| Bindings | Tidak ada Cloudflare bindings (R2/KV/DO) | Supabase diakses via HTTP; karena itu `initOpenNextCloudflareForDev()` **sengaja tidak dipanggil** (fungsinya menjalankan Miniflare/workerd yang crash di Windows & hanya diperlukan untuk bindings) |
| Auth / Zero Trust | Cloudflare Access — 4 Access Groups (email-based) | JWT diverifikasi di proxy via `jose` + JWKS Cloudflare (`https://www.cloudflare.com/access-jwt-keys`) |
| Database | Supabase (Postgres) + RLS + Realtime | Service role server-side (Fase 1); RLS hardening Fase 6 |
| Frontend | Next.js 16.3.8 (App Router), React 19, Tailwind CSS 4 | Server Components + Server Actions |
| Env management | Wrangler/Workers secrets + GitHub Actions secrets | Tidak ada secret di-commit |
| CI/CD | GitHub Actions: CI (lint/typecheck/build) + deploy (cloudflare/wrangler-action) | Lihat `.github/workflows/` |

**Pola keamanan (sesuai Next.js 16 Data Security guide):**
- Proxy hanya memverifikasi JWT & meneruskan identitas via header internal (`x-user-email`, `x-user-name`, `x-access-mode`)
- Otorisasi role diperiksa di **Server Action** dan **Server Component** (DAL `lib/dal.ts`), bukan hanya di UI
- DAL memakai React `cache()` — satu kali query `profiles` per render pass

**Dev-only bypass:** `DEV_BYPASS_ACCESS=true` + `DEV_EMAIL` + `DEV_DEFAULT_ROLE` melewati Access saat `npm run dev` (auto-provision akun lokal). Dijamin tidak aktif di produksi karena guarded `NODE_ENV !== 'production'`.

---

## 6. Phase E — Opportunities & Solutions (Build vs Buy)

| Komponen | Build / Buy |
|---|---|
| Database, Realtime, RLS | Buy (Supabase) |
| Auth / Zero Trust | Buy (Cloudflare Access) |
| Hosting edge + runtime | Buy (Cloudflare Workers + OpenNext) |
| Modul Gudang, Produk, PO, Penjualan, Live, Laporan | Build (SBB custom) |

---

## 7. Phase F — Migration Plan

| Fase | Isi | Est. | Acceptance Criteria | Status |
|---|---|:---:|---|---|
| **F1 — Fondasi** | OpenNext/Workers, Access (proxy + JWKS verify), `profiles`, DAL, layout navigasi per role, dashboard, modul gudang (form + RPC atomic), migrasi SQL, CI/CD | → 40% | Login 4 role berhasil; nav sesuai role; mutasi stok tercatat & atomic; CI hijau | ✅ **Selesai** (kode) — menunggu: (a) SQL dijalankan di Supabase, (b) Access Groups dikonfigurasi, (c) repo GitHub + secrets |
| **F2 — Gudang** | Opname/adjust, scan SKU (PWA), penyempurnaan mutasi | → 55% | Opname bisa adjust; scan input <3 detik | 🔜 |
| **F3 — Produk & PO** | CRUD produk/varian, kelola PO & kuota | → 70% | CRUD jalan; kuota PO tidak bisa negatif | 🔜 |
| **F4 — Penjualan & Keuangan** | Order manual, pembayaran, pencatatan keuangan | → 80% | Order manual jalan; total keuangan akurat | 🔜 |
| **F5 — Live Host** | Grid stok real-time (Realtime), form capture cepat, sesi live | → 90% | Update realtime <1s; RPC gagal jika stok < qty; sesi terekam | 🔜 |
| **F6 — Owner & Deploy** | Laporan keuangan, penjualan per live, audit log, hardening RLS, UAT 4 role, go-live | → 100% | Laporan revenue per live valid; audit log lengkap; UAT 4 role sign-off | 🔜 |

**Dependencies:** F1 → F2 → F3/F4 paralel → F5 → F6.
**Rollback:** deploy Workers sebelumnya tetap aktif (Cloudflare menyimpan deployment history); migrasi DB via SQL ter-version.

---

## 8. Phase G — Implementation Governance

- **Architecture review gate** di akhir tiap fase (cek vs blueprint & prinsip arsitektur)
- **Code review** + lint (`npm run lint`) + typecheck sebelum merge
- **RLS test** per role (CRUD matrix diverifikasi di database)
- **UAT per role** dengan skenario value stream masing-masing
- **Sign-off owner** sebelum tiap fase dianggap selesai

---

## 9. Phase H — Architecture Change Management

- Perubahan schema → migrasi Supabase SQL ter-version (review di review gate)
- Perubahan modul/fitur → change request → backlog → iterasi ADM berikutnya
- **Risk register:**
  1. ~~Kompatibilitas OpenNext × Next 16.3.5~~ → **selesai**: diupgrade ke next 16.3.8 (peer dep OpenNext ≥16.3.8)
  2. Mis-konfigurasi Access policy → mitigasi: test 4 role sebelum go-live
  3. Eksposur anon key → mitigasi: anon key tidak lagi di client code; query via server-side service role; hardening RLS Fase 6
  4. Latensi Realtime → mitigasi: batasi subscription ke tabel `products` saja (Fase 5)
  5. **CVE-2026-93687 (braces ≤3.0.3, stack-exhaustion DoS)** — rantai devDependency (eslint-config-next → fast-glob → micromatch → braces). **Belum ada versi perbaikan upstream** (per 2026-10-05). Risiko rendah: hanya jalan saat `npm run lint` di dev/CI dengan pola glob tepercaya; EPS 0.74%. Diterima sementara (risk accepted); akan di-fix lewat `npm update` begitu braces >3.0.3 rilis. `npm audit fix --force` **tidak** dipakai karena akan mendowngrade eslint-config-next ke v14 (breaking).
  6. **workerd binary crash di Windows** (structured exception 0xc0000005, stack overflow pada Miniflare) → mitigasi: `initOpenNextCloudflareForDev()` tidak dipanggil (tidak ada Cloudflare bindings); `npm run dev` memakai Next.js dev server biasa (Node runtime, tanpa workerd); build OpenNext untuk deploy dijalankan di **GitHub Actions (ubuntu)** atau **WSL2** bila perlu build lokal
  7. OpenNext memperingatkan kompatibilitas Windows terbatas → build/deploy produksi jalan di GitHub Actions (ubuntu)
  8. **Node.js middleware (proxy.ts) experimental di Cloudflare** — OpenNext memberi peringatan: *"Node.js middleware support is experimental in cloudflare, and not officially maintained by OpenNext maintainers."* → mitigasi: proxy.ts hanya verifikasi JWT (jose + fetch JWKS, tanpa dependency Node-native berat); CI menjalankan build penuh setiap PR; bila bermasalah di produksi, proxy bisa dipindah ke edge runtime (`export const runtime = "edge"`) karena jose kompatibel edge

---

## 10. Requirements Management

### 10.1 Functional (6 value streams → lihat §3.2)
### 10.2 Non-Functional
| Kategori | Target |
|---|---|
| Availability | Edge CDN Cloudflare Workers |
| Security | Zero Trust (Access), RLS, TLS, tanpa harga_modal untuk Host Live |
| Performance | Realtime <1s (Fase 5); form capture <3 detik |
| Auditability | 100% mutasi stok tercatat di `transactions` |
| Scalability | Multi-user konkuren, 1 gudang |

---

## 11. Verdict

Blueprint memenuhi standar **TOGAF ADM** (level *Organization-Specific Architecture*, scaled untuk UMKM, iteratif) **dan ekosistem GitHub** (git workflow, CI/CD, database-as-code, project management). Fase 1 terimplementasi dalam kode; sisa pekerjaan Fase 1 bersifat operasional (jalankan SQL, konfigurasi Access Groups, buat repo GitHub + secrets).
