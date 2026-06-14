import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getOrders } from '@/api/orders'
import OrderCard from '@/components/order/OrderCard'

export default function Orders() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  })

  return (
    <section className="orders-page">
      <header className="page-header compact">
        <p className="eyebrow">Purchase archive</p>
        <h1>Your orders</h1>
        <p>Track every object from confirmed payment through delivery.</p>
      </header>
      {isLoading && <div className="loading-state">Opening order archive…</div>}
      {isError && (
        <div className="error-state">
          Orders unavailable. Confirm the API is running and try again.
        </div>
      )}
      {data?.length === 0 && (
        <div className="empty-state">
          <h2>No purchases yet.</h2>
          <p>Your confirmed orders will appear here.</p>
          <Link className="button button-primary" to="/products">
            Browse collection
          </Link>
        </div>
      )}
      <div className="orders-list">
        {data?.map((order) => <OrderCard key={order._id} order={order} />)}
      </div>
    </section>
  )
}
