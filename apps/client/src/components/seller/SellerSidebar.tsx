import {
  BarChart3,
  Boxes,
  ExternalLink,
  LogOut,
  PackageCheck,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const links = [
  { to: '/seller', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/seller/products', label: 'Products', icon: Boxes },
  { to: '/seller/orders', label: 'Orders', icon: PackageCheck },
]

export default function SellerSidebar() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const signOut = async () => {
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <aside className="seller-sidebar">
      <Link className="seller-brand" to="/seller">
        <strong>TinyTreasures</strong>
        <span>Seller office</span>
      </Link>
      <div className="seller-identity">
        <span>Signed in as</span>
        <strong>{user?.name}</strong>
      </div>
      <nav aria-label="Seller navigation">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="seller-sidebar-footer">
        <Link to="/">
          <ExternalLink aria-hidden="true" />
          View marketplace
        </Link>
        <button type="button" onClick={signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
