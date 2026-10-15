import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

type TypedClient = ReturnType<typeof createTypedClient>

function createTypedClient(url: string, key: string) {
  return createClient<Database>(url, key)
}

let cached: TypedClient | null = null

/**
 * Supabase client untuk Server Components / Server Actions.
 * Memakai SERVICE ROLE key (bypass RLS) — jangan pernah diekspos ke browser.
 * Hardening RLS per role dijadwalkan pada Fase 6 (sesuai blueprint TOGAF §7).
 */
export function createServerClient(): TypedClient {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('SUPABASE_URL belum dikonfigurasi (lihat .env.example)')
  }
  if (!serviceKey && !anonKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY belum dikonfigurasi (lihat .env.example)',
    )
  }

  const key = serviceKey ?? (anonKey as string)
  if (!cached) {
    cached = createTypedClient(url, key)
  }
  return cached
}
