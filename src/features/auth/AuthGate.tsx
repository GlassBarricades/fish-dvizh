import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks'

type Props = { children: React.ReactNode }

export function AuthGate({ children }: Props) {
  const { user, isInitializing } = useAuth()
  const location = useLocation()
  if (isInitializing) return null
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />
  return children
}


