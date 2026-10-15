import type { Product } from '@/lib/supabase/types'

export default function StockTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="p-4 text-sm text-slate-500">Belum ada data produk di database.</p>
  }

  return (
    <div className="max-h-[500px] overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white shadow-sm">
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <th className="py-2.5">Varian SKU</th>
            <th className="py-2.5">Stok Ready</th>
            <th className="py-2.5">Pesanan PO</th>
            <th className="py-2.5">Sisa Kuota PO</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((item) => {
            const sisaKuota = Math.max(0, (item.max_po ?? 0) - (item.po_reserved ?? 0))
            return (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="py-3 font-medium text-slate-900">
                  {item.nama ?? item.sku}
                  <span className="block text-xs text-slate-400">
                    {item.sku} — {item.color} / {item.size}
                  </span>
                </td>
                <td className="py-3 font-semibold text-blue-600">
                  {(item.ready_stock ?? 0).toLocaleString('id-ID')} pcs
                </td>
                <td className="py-3 font-semibold text-amber-600">
                  {(item.po_reserved ?? 0).toLocaleString('id-ID')} pcs
                </td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      sisaKuota > 500
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {sisaKuota.toLocaleString('id-ID')} pcs
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
