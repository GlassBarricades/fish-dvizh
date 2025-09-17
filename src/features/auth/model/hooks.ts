import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import { normalizeRole, type Role } from '../roles'

export function useAuth() {
  const state = useSelector((state: RootState) => state.auth)
  const role: Role = normalizeRole((state.user as any)?.user_metadata?.role)
  return { ...state, role }
}


