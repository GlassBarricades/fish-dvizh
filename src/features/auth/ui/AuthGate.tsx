import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../model/hooks'
import { hasRole, type Role } from '../model/roles'

type Props = { children: React.ReactNode; roles?: Role[] }

export function AuthGate({ children, roles }: Props) {
  const { user, isInitializing, role } = useAuth()
  const location = useLocation()
  if (isInitializing) return null
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />
  if (roles && !hasRole(role, roles)) return <Navigate to="/" replace />
  return children
}


