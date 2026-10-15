import Link from 'next/link'
import { getCurrentUser } from '@/lib/dal'
import { getProducts } from '@/lib/products'
import { hasPermission, NAV_ITEMS, ROLE_LABELS } from '@/lib/roles'
import StockTable from '@/components/StockTable'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const products = await getProducts()

  const totalSku = products.length
  const totalStok = products.reduce((sum, p) => sum + (p.ready_stock ?? 0), 0)
  const totalPo = products.reduce((sum, p) => sum + (p.po_reserved ?? 0), 0)
  const sisaKuota = products.reduce(
    (sum, p) => sum + Math.max(0, (p.max_po ?? 0) - (p.po_reserved ?? 0)),
    0,
  )

  const quickActions = NAV_ITEMS.filter(
    (item) => item.href !== '/' && hasPermission(user?.role, item.permission),
  )

  const cards = [
    { label: 'Total Varian SKU', value: totalSku.toLocaleString('id-ID'), suffix: 'SKU', tone: 'blue' },
    { label: 'Stok Ready', value: totalStok.toLocaleString('id-ID'), suffix: 'pcs', tone: 'blue' },
    { label: 'Pesanan PO', value: totalPo.toLocaleString('id-ID'), suffix: 'pcs', tone: 'amber' },
    { label: 'Sisa Kuota PO', value: sisaKuota.toLocaleString('id-ID'), suffix: 'pcs', tone: 'emerald' },
  ]

  return (
    <div className="space-y-6">
      {/* BANNER KEAMANAN AKSES (REVISI POIN 1) */}
      {!user ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold text-lg">
              🔒
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Mode Viewer (Tampilan Terproteksi)
              </p>
              <p className="text-xs text-amber-700">
                Akses input & ubah stok gudang dikunci. Silakan login password untuk membuka hak akses.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full sm:w-auto text-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            🔑 Login Password Gudang
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              🔓
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Akses Terverifikasi — {ROLE_LABELS[user.role]}
              </p>
              <p className="text-xs text-emerald-700">
                Anda memiliki hak akses penuh untuk mengelola & memotong stok.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER UTAMA */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Halo, {user?.name.split(' ')[0] ?? 'Pengguna'} 👋
        </h2>
        <p className="text-sm text-slate-500">
          Dashboard {user ? ROLE_LABELS[user.role] : ''} — monitoring stok real-time
          semua varian Lavie Pants.
        </p>
      </div>

      {/* KARTU RINGKASAN */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase text-slate-400">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {card.value}
              <span className="ml-1 text-sm font-normal text-slate-400">{card.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* AKSI CEPAT SESUAI ROLE */}
      {quickActions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
            Aksi Cepat
          </h3>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {item.icon} {item.label}
                {item.phase > 1 && (
                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    Fase {item.phase}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TABEL STOK (REVISI POIN 2: TAMBAH PADDING BOTTOM AGAR TIDAK TERPOTONG) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 pb-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            📦 Stok Real-time (All Size)
          </h3>
          <span className="text-xs text-slate-400">
            {user ? 'Mode Edit Aktif' : 'Mode baca — perubahan via modul Gudang'}
          </span>
        </div>
        <StockTable products={products} />
      </div>
    </div>
  )
}