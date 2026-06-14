import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  role?: UserRole
}

export default function ProtectedRoute({ role }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'seller' ? '/seller' : '/'} replace />
  }

  return <Outlet />
}
