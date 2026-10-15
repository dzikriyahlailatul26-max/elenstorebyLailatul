import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessJwt } from '@/lib/access'

/**
 * Proxy (pengganti `middleware` yang deprecated di Next.js 16).
 *
 * Memverifikasi JWT Cloudflare Access lalu meneruskan identitas user ke
 * aplikasi lewat header internal (`x-user-email`, dll). Pengecekan role &
 * izin wajib juga dilakukan di Server Action / Server Component —
 * jangan andalkan proxy saja (lihat docs: Data Security).
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'
  const devBypass = isDev && process.env.DEV_BYPASS_ACCESS === 'true'

  // --- Local development bypass (JANGAN aktifkan di produksi) ---
  if (devBypass) {
    const email = process.env.DEV_EMAIL ?? 'dev@elen-store.local'
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-email', email)
    requestHeaders.set('x-user-name', 'Developer (bypass)')
    requestHeaders.set('x-access-mode', 'dev-bypass')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // --- Produksi: verifikasi Cloudflare Access JWT ---
  const token = request.headers.get('cf-access-jwt-assertion')
  if (!token) {
    return new NextResponse(
      'Akses ditolak: Access JWT tidak ditemukan. Pastikan aplikasi diakses lewat Cloudflare Access.',
      { status: 401 },
    )
  }

  const user = await verifyAccessJwt(token, process.env.CLOUDFLARE_ACCESS_AUDIENCE || undefined)
  if (!user) {
    return new NextResponse(
      'Akses ditolak: Access JWT tidak valid atau sudah kedaluwarsa.',
      { status: 401 },
    )
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-email', user.email)
  requestHeaders.set('x-user-name', user.name)
  requestHeaders.set('x-access-mode', 'cloudflare-access')
  return NextResponse.next({ request: { headers: requestHeaders } })
}
