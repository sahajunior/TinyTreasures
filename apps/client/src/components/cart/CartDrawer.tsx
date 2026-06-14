import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'
import CartItemRow from './CartItemRow'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCartStore((state) => state.items)
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  return (
    <>
      {open && (
        <button
          className="drawer-backdrop"
          type="button"
          aria-label="Close cart"
          onClick={onClose}
        />
      )}
      <aside className={`cart-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <header>
          <div>
            <p className="eyebrow">Your selection</p>
            <h2>Cart</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X aria-hidden="true" />
            <span className="sr-only">Close cart</span>
          </button>
        </header>
        <div className="drawer-items">
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}
        </div>
        <footer>
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <Link className="button button-primary" to="/cart" onClick={onClose}>
            Review and checkout
          </Link>
        </footer>
      </aside>
    </>
  )
}
