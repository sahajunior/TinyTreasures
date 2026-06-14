import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrders } from '@/api/orders'
import OrderCard from '@/components/order/OrderCard'
import { useCartStore } from '@/store/cartStore'

export default function OrderSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id') ?? ''
  const clearCart = useCartStore((state) => state.clearCart)
  const { data, isError } = useQuery({
    queryKey: ['order-success', sessionId],
    queryFn: () => getOrders(sessionId),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const orders = query.state.data
      return orders && orders.length > 0 ? false : 2_000
    },
    retry: false,
  })
  const order = data?.[0]

  useEffect(() => {
    if (order) clearCart()
  }, [clearCart, order])

  return (
    <section className="order-success-page">
      <div className="success-mark">
        <Check aria-hidden="true" />
      </div>
      <p className="eyebrow">Payment received</p>
      <h1>{order ? 'Order confirmed.' : 'Confirming your order…'}</h1>
      <p>
        {order
          ? 'Stripe confirmed payment and your purchase is now in the archive.'
          : 'Payment succeeded. We are waiting for the secure Stripe webhook to create your order.'}
      </p>
      {order && <OrderCard order={order} />}
      {!order && !isError && <div className="polling-line" />}
      {isError && (
        <div className="error-state">
          Confirmation is taking longer than expected. Your payment may still
          be processing.
        </div>
      )}
      <Link className="button" to="/orders">
        View all orders
      </Link>
    </section>
  )
}
