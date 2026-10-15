'use client'

import { useState, useTransition } from 'react'
import { updateStock } from '@/app/actions/stock'

export default function StockForm() {
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = (type: 'IN' | 'OUT') => {
    setMessage('')
    startTransition(async () => {
      const result = await updateStock({ sku, qty, type })
      setMessage(result.message)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          SKU BARANG
        </label>
        <input
          type="text"
          placeholder="Contoh: LAVIE-HITAM-XL"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          JUMLAH (PCS)
        </label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit('IN')}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          ➕ Barang Masuk
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit('OUT')}
          className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
        >
          ➖ Potong Stok
        </button>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg border p-3 text-xs font-medium ${
            message.startsWith('✅')
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  )
}
