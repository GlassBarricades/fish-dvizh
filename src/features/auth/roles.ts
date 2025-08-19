export type Role = 'admin' | 'organizer' | 'chief_judge' | 'secretary' | 'zone_judge' | 'user'

export function normalizeRole(value: unknown): Role {
  const v = String(value || '').toLowerCase()
  if (v === 'admin' || v === 'organizer' || v === 'chief_judge' || v === 'secretary' || v === 'zone_judge') return v as Role
  return 'user'
}

export function hasRole(userRole: Role | undefined, allowed: Role[]): boolean {
  const role = userRole ?? 'user'
  return allowed.includes(role)
}


