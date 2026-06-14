import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, PackageCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getSellerOrders,
  markSellerItemShipped,
} from '@/api/seller'
import ConditionBadge from '@/components/product/ConditionBadge'
import ProductImage from '@/components/product/ProductImage'
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/format'

export default function SellerOrders() {
  const queryClient = useQueryClient()
  const orders = useQuery({
    queryKey: ['seller', 'orders'],
    queryFn: getSellerOrders,
  })
  const ship = useMutation({
    mutationFn: ({
      orderId,
      orderItemIndex,
    }: {
      orderId: string
      orderItemIndex: number
    }) => markSellerItemShipped(orderId, orderItemIndex),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller'] })
      toast.success('Item marked as shipped')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Shipment update failed')),
  })

  return (
    <section>
      <header className="seller-page-header">
        <div>
          <p className="eyebrow">Fulfilment ledger</p>
          <h1>Orders</h1>
        </div>
        <span>Paid orders containing your catalogue items</span>
      </header>
      {orders.isLoading && <div className="loading-state">Opening order ledger…</div>}
      {orders.isError && <div className="error-state">Seller orders unavailable.</div>}
      {orders.data?.length === 0 && (
        <div className="empty-state">
          <h2>No paid orders yet.</h2>
          <p>Seller fulfilment records will appear here.</p>
        </div>
      )}
      <div className="seller-orders-list">
        {orders.data?.map((order) => (
          <article className="seller-order" key={order._id}>
            <header>
              <div>
                <span>Order date</span>
                <h2>{formatDate(order.createdAt)}</h2>
              </div>
              <code>#{order._id.slice(-8).toUpperCase()}</code>
            </header>
            <div className="seller-order-address">
              <MapPin aria-hidden="true" />
              <span>
                {order.shippingAddress.line1}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} {order.shippingAddress.zip}
              </span>
            </div>
            {order.items.map((item) => (
              <div className="seller-order-item" key={`${order._id}-${item.orderItemIndex}`}>
                <ProductImage
                  src={item.image}
                  alt={item.title}
                  category={item.category}
                />
                <div className="seller-order-copy">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <div>
                    <ConditionBadge condition={item.condition} />
                    <span>{item.quantity} × {formatCurrency(item.price)}</span>
                  </div>
                </div>
                <div className="seller-order-status">
                  <span className={`status-badge status-${item.status}`}>{item.status}</span>
                  {item.status === 'pending' && (
                    <button
                      className="button button-primary"
                      type="button"
                      disabled={ship.isPending}
                      onClick={() =>
                        ship.mutate({
                          orderId: order._id,
                          orderItemIndex: item.orderItemIndex,
                        })
                      }
                    >
                      <PackageCheck aria-hidden="true" /> Mark as shipped
                    </button>
                  )}
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}
