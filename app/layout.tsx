import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { getCurrentUser } from '@/lib/dal'
import { hasPermission, NAV_ITEMS, ROLE_LABELS } from '@/lib/roles'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Elen Store — Management Stok',
  description: 'Sistem inventori Elen Store — Lavie Pants',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser()

  // Akun belum terdaftar di tabel profiles → tampilkan halaman info pendaftaran
  if (!user) {
    return (
      <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
          <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="mb-2 text-lg font-semibold text-amber-800">
              🔒 Akun belum terdaftar
            </h1>
            <p className="text-sm text-amber-700">
              Email Anda belum ada di tabel <code>profiles</code> Supabase. Hubungi{' '}
              <strong>Owner</strong> untuk mendaftarkan akun beserta role-nya (Owner /
              Admin Gudang / Admin Pendataan / Host Live).
            </p>
          </div>
        </body>
      </html>
    )
  }

  const nav = NAV_ITEMS.filter((item) => hasPermission(user.role, item.permission))

  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Elen Store</h1>
              <p className="text-xs text-slate-500">Management Stok Lavie Pants</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
          <nav className="hidden w-56 shrink-0 md:block">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <span>
                      {item.icon} {item.label}
                    </span>
                    {item.phase > 1 && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Fase {item.phase}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-400">
              Akses via Cloudflare Access
              {user.accessMode === 'dev-bypass' && (
                <span className="mt-1 block font-semibold text-amber-600">
                  ⚠️ Mode dev-bypass (lokal)
                </span>
              )}
            </p>
          </nav>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
