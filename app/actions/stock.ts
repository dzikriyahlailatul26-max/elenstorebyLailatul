'use server'

import { getCurrentUser } from '@/lib/dal'
import { hasPermission } from '@/lib/roles'
import { createServerClient } from '@/lib/supabase/server'

export interface StockResult {
  ok: boolean
  message: string
}

/**
 * Server Action: Barang Masuk / Potong Stok.
 *
 * Pengecekan role wajib di sini (defense in depth) — UI yang menyembunyikan
 * tombol bukan pengaman. Stok diubah lewat RPC atomic (anti-oversell),
 * sesuai prinsip arsitektur #2 (Atomic Stock).
 */
export async function updateStock(input: {
  sku: string
  qty: number
  type: 'IN' | 'OUT'
}): Promise<StockResult> {
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, message: '❌ Sesi tidak ditemukan. Silakan login ulang.' }
  }

  if (!hasPermission(user.role, 'stock.update')) {
    return {
      ok: false,
      message: '⛔ Akses ditolak: role Anda tidak berwenang mengubah stok.',
    }
  }

  const sku = input.sku?.trim() ?? ''
  if (!sku) {
    return { ok: false, message: '⚠️ Silakan masukkan SKU produk!' }
  }

  const qty = Math.floor(Number(input.qty))
  if (!Number.isFinite(qty) || qty < 1) {
    return { ok: false, message: '⚠️ Jumlah harus angka bulat ≥ 1.' }
  }

  const supabase = createServerClient()

  if (input.type === 'IN') {
    const { error } = await supabase.rpc('stok_masuk', {
      p_sku: sku,
      p_qty: qty,
      p_user_email: user.email,
    })
    if (error) {
      return { ok: false, message: `❌ Gagal mencatat barang masuk: ${error.message}` }
    }
    return { ok: true, message: `✅ Barang masuk ${qty} pcs untuk ${sku}.` }
  }

  const { data, error } = await supabase.rpc('stok_keluar', {
    p_sku: sku,
    p_qty: qty,
    p_user_email: user.email,
  })
  if (error) {
    return { ok: false, message: `❌ Gagal memotong stok: ${error.message}` }
  }
  if (!data) {
    return {
      ok: false,
      message: `❌ SKU ${sku} tidak ditemukan atau stok tidak mencukupi.`,
    }
  }
  return {
    ok: true,
    message: `✅ Stok dikurangi ${qty} pcs untuk ${sku}. Sisa stok: ${data} pcs.`,
  }
}
