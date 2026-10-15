import 'server-only'
import { createServerClient } from '@/lib/supabase/server'
import type { Product, TransactionRow } from '@/lib/supabase/types'

export async function getProducts(): Promise<Product[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('products').select('*').order('sku')
  if (error) {
    console.error('[products] gagal mengambil data:', error.message)
    return []
  }
  return data ?? []
}

export async function getRecentTransactions(limit = 15): Promise<TransactionRow[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(
      'id, product_id, type, qty, user_email, catatan, created_at, products(sku)',
    )
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[transactions] gagal mengambil data:', error.message)
    return []
  }
  return data ?? []
}
