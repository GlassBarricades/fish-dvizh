export type Role = 'admin' | 'organizer' | 'user'

export function normalizeRole(value: unknown): Role {
  const v = String(value || '').toLowerCase()
  if (v === 'admin' || v === 'organizer') return v
  return 'user'
}

export function hasRole(userRole: Role | undefined, allowed: Role[]): boolean {
  const role = userRole ?? 'user'
  return allowed.includes(role)
}


