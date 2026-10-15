import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { ROLES, type Role } from '@/lib/roles'

export interface SessionUser {
  email: string
  name: string
  role: Role
  /** 'cloudflare-access' = produksi via Cloudflare Access; 'dev-bypass' = lokal */
  accessMode: 'cloudflare-access' | 'dev-bypass'
}

/**
 * Data Access Layer — sumber kebenaran identitas & role per request.
 * Dipakai oleh layout, page, dan Server Action. React `cache()` menjamin
 * fungsi ini hanya dieksekusi sekali per render pass.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const headersList = await headers()
  const email = headersList.get('x-user-email')
  if (!email) return null

  const name = headersList.get('x-user-name') ?? email
  const accessMode: SessionUser['accessMode'] =
    headersList.get('x-access-mode') === 'dev-bypass' ? 'dev-bypass' : 'cloudflare-access'
  const emailNorm = email.toLowerCase()

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('email, nama, role')
    .eq('email', emailNorm)
    .maybeSingle()

  if (error) {
    console.error('[dal] gagal membaca tabel profiles:', error.message)
    return null
  }

  if (data && ROLES.includes(data.role as Role)) {
    return {
      email: data.email,
      name: data.nama ?? name,
      role: data.role as Role,
      accessMode,
    }
  }

  // Dev bypass: auto-provision akun lokal supaya pengembangan bisa langsung jalan
  if (accessMode === 'dev-bypass' && process.env.DEV_BYPASS_ACCESS === 'true') {
    const envRole = process.env.DEV_DEFAULT_ROLE
    const defaultRole: Role = ROLES.includes(envRole as Role) ? (envRole as Role) : 'owner'
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ email: emailNorm, nama: name, role: defaultRole })
    if (!insertError) {
      return { email: emailNorm, name, role: defaultRole, accessMode }
    }
  }

  return null
})
