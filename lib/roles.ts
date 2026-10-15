// RBAC — 4 role sesuai blueprint TOGAF (§4.2 CRUD Matrix)
export const ROLES = ['owner', 'admin_gudang', 'admin_penjualan', 'host_live'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin_gudang: 'Admin Gudang',
  admin_penjualan: 'Admin Pendataan',
  host_live: 'Host Live',
}

export type Permission =
  | 'stock.view'
  | 'stock.update'
  | 'products.manage'
  | 'po.manage'
  | 'orders.manage'
  | 'orders.capture_live'
  | 'finance.view'
  | 'reports.view'
  | 'users.manage'

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: [
    'stock.view',
    'stock.update',
    'products.manage',
    'po.manage',
    'orders.manage',
    'orders.capture_live',
    'finance.view',
    'reports.view',
    'users.manage',
  ],
  admin_gudang: ['stock.view', 'stock.update', 'products.manage', 'po.manage'],
  admin_penjualan: ['stock.view', 'orders.manage', 'finance.view'],
  host_live: ['stock.view', 'orders.capture_live'],
}

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export interface NavItem {
  href: string
  label: string
  icon: string
  permission: Permission
  /** Fase implementasi modul (1 = sudah jalan, >1 = placeholder menunggu fase berikutnya) */
  phase: number
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Dashboard', icon: '🏠', permission: 'stock.view', phase: 1 },
  { href: '/gudang', label: 'Gudang', icon: '📦', permission: 'stock.update', phase: 1 },
  { href: '/produk', label: 'Produk', icon: '🏷️', permission: 'products.manage', phase: 3 },
  { href: '/po', label: 'Pre-Order', icon: '🛒', permission: 'po.manage', phase: 3 },
  { href: '/penjualan', label: 'Penjualan', icon: '💳', permission: 'orders.manage', phase: 4 },
  { href: '/live', label: 'Live Selling', icon: '📡', permission: 'orders.capture_live', phase: 5 },
  { href: '/laporan', label: 'Laporan', icon: '📊', permission: 'reports.view', phase: 6 },
]
