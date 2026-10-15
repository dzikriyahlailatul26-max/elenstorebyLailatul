import { getCurrentUser } from '@/lib/dal'
import { hasPermission, ROLE_LABELS, type Permission } from '@/lib/roles'

interface ModulePlaceholderProps {
  title: string
  icon: string
  /** Fase implementasi modul sesuai blueprint TOGAF §7 */
  phase: number
  permission: Permission
  description: string
  features: string[]
}

/**
 * Halaman placeholder untuk modul yang dijadwalkan pada fase berikutnya.
 * Pengecekan izin dilakukan di server — role tanpa akses melihat pesan 403.
 */
export default async function ModulePlaceholder({
  title,
  icon,
  phase,
  permission,
  description,
  features,
}: ModulePlaceholderProps) {
  const user = await getCurrentUser()
  const allowed = !!user && hasPermission(user.role, permission)

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-rose-700">⛔ Akses Ditolak</h2>
        <p className="text-sm text-rose-600">
          Modul <strong>{title}</strong> tidak tersedia untuk role{' '}
          {user ? ROLE_LABELS[user.role] : 'Anda'}. Hubungi Owner bila menurut Anda
          ini keliru.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">
          {icon} {title}
        </h2>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Fase {phase} — Segera Hadir
        </span>
      </div>
      <p className="mb-6 text-sm text-slate-500">{description}</p>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Fitur yang akan diimplementasikan:
      </h3>
      <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  )
}
