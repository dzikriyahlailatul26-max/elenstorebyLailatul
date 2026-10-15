import 'server-only'
import { createRemoteJWKSet, jwtVerify } from 'jose'

/** Kunci publik Cloudflare Access (JWKS) — kunci RS256 milik Cloudflare, di-cache otomatis oleh jose. */
const CLOUDFLARE_ACCESS_JWKS = 'https://www.cloudflare.com/access-jwt-keys'

const accessJwks = createRemoteJWKSet(new URL(CLOUDFLARE_ACCESS_JWKS))

export interface AccessUser {
  email: string
  name: string
}

/**
 * Verifikasi JWT Cloudflare Access (dari header `Cf-Access-Jwt-Assertion`).
 * Signature diverifikasi terhadap JWKS Cloudflare; audience diverifikasi bila dikonfigurasi.
 */
export async function verifyAccessJwt(
  token: string,
  audience?: string,
): Promise<AccessUser | null> {
  try {
    const { payload } = await jwtVerify(token, accessJwks, {
      ...(audience ? { audience } : {}),
    })
    if (typeof payload.email !== 'string' || !payload.email) return null
    return {
      email: payload.email.toLowerCase(),
      name: typeof payload.name === 'string' && payload.name ? payload.name : payload.email,
    }
  } catch (error) {
    console.error(
      '[access] verifikasi Access JWT gagal:',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}
