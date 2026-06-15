import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import CartDrawer from '@/components/cart/CartDrawer'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

const categories = [
  { label: 'Cars', value: 'Cars' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Figures', value: 'Action Figures' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  )
  const user = useAuthStore((state) => state.user)

  return (
    <>
    <header className="site-header">
      <div className="utility-strip">
        <span>Independent sellers · Authenticated collectibles</span>
        <span>Est. 2025</span>
      </div>
      <nav className="navbar" aria-label="Primary navigation">
        <Link className="brand" to="/" onClick={() => setMobileOpen(false)}>
          <span className="brand-name">TinyTreasures</span>
          <span className="brand-tagline">Small wonders, carefully collected</span>
        </Link>

        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <div className={`nav-content ${mobileOpen ? 'is-open' : ''}`}>
          <div className="category-links">
            {categories.map((category) => (
              <NavLink
                key={category.value}
                to={`/products?category=${encodeURIComponent(category.value)}`}
                onClick={() => setMobileOpen(false)}
              >
                {category.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-actions">
            <Link className="icon-link" to="/products" aria-label="Search products">
              <Search aria-hidden="true" />
              <span>Search</span>
            </Link>
            <button
              className="icon-link cart-link"
              type="button"
              aria-label={`Cart with ${itemCount} items`}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag aria-hidden="true" />
              <span>Cart</span>
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </button>
            <Link className="icon-link" to={user?.role === 'seller' ? '/seller' : user ? '/orders' : '/login'}>
              <UserRound aria-hidden="true" />
              <span>{user ? user.name : 'Account'}</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
