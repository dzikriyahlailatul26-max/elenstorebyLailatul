import StockForm from './StockForm'
import StockTable from '@/components/StockTable'
import { getCurrentUser } from '@/lib/dal'
import { getProducts, getRecentTransactions } from '@/lib/products'
import { hasPermission } from '@/lib/roles'

export default async function GudangPage() {
  const user = await getCurrentUser()
  const allowed = !!user && hasPermission(user.role, 'stock.update')

  const [products, transactions] = await Promise.all([
    getProducts(),
    getRecentTransactions(),
  ])

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-rose-700">⛔ Akses Ditolak</h2>
        <p className="text-sm text-rose-600">
          Modul Gudang hanya untuk <strong>Admin Gudang</strong> dan{' '}
          <strong>Owner</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">📦 Gudang</h2>
        <p className="text-sm text-slate-500">
          Barang masuk / keluar + riwayat mutasi stok (fase 1–2).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Form mutasi stok */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-1">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">📥 / 📤 Mutasi Stok</h3>
          <StockForm />
        </div>

        {/* Riwayat mutasi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            🕒 Riwayat Mutasi (terbaru)
          </h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada mutasi stok tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                    <th className="py-2">Waktu</th>
                    <th className="py-2">SKU</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 text-xs whitespace-nowrap text-slate-500">
                        {new Date(t.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 font-medium">{t.products?.sku ?? '—'}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2">{t.qty} pcs</td>
                      <td className="py-2 max-w-[180px] truncate text-xs text-slate-500">
                        {t.user_email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tabel monitoring stok */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          📊 Monitoring Stok (All Size)
        </h3>
        <StockTable products={products} />
      </div>
    </div>
  )
}
