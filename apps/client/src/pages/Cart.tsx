import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { checkout } from '@/api/orders'
import CartItemRow from '@/components/cart/CartItemRow'
import { formatCurrency, getErrorMessage } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import type { ShippingAddress } from '@/types'

const initialAddress: ShippingAddress = {
  line1: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
}

export default function Cart() {
  const items = useCartStore((state) => state.items)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const location = useLocation()
  const [shippingAddress, setShippingAddress] = useState(initialAddress)
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )
  const checkoutMutation = useMutation({
    mutationFn: () => checkout(items, shippingAddress),
    onSuccess: (url) => {
      window.location.assign(url)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Checkout failed')),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    checkoutMutation.mutate()
  }

  if (items.length === 0) {
    return (
      <section className="empty-cart">
        <p className="eyebrow">Your selection</p>
        <h1>Cart is empty.</h1>
        <p>Return to the archive and choose an object worth keeping.</p>
        <Link className="button button-primary" to="/products">
          Browse collection
        </Link>
      </section>
    )
  }

  return (
    <section className="cart-page">
      <header className="page-header compact">
        <p className="eyebrow">Your selection</p>
        <h1>Shopping cart</h1>
      </header>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}
        </div>
        <form className="checkout-panel" onSubmit={submit}>
          <p className="eyebrow">Delivery details</p>
          <h2>Shipping address</h2>
          {Object.entries(shippingAddress).map(([key, value]) => (
            <label key={key}>
              <span>
                {key === 'line1'
                  ? 'Street address'
                  : key === 'zip'
                    ? 'ZIP / postal code'
                    : key[0].toUpperCase() + key.slice(1)}
              </span>
              <input
                required
                value={value}
                onChange={(event) =>
                  setShippingAddress((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <p className="checkout-note">
            Taxes and shipping are calculated by the seller. Payment opens in
            Stripe Checkout.
          </p>
          <button
            className="button button-primary"
            type="submit"
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending
              ? 'Opening checkout…'
              : user
                ? 'Continue to Stripe'
                : 'Sign in to checkout'}
          </button>
        </form>
      </div>
    </section>
  )
}
