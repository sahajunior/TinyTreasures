import ConditionBadge from '@/components/product/ConditionBadge'
import ProductImage from '@/components/product/ProductImage'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Order } from '@/types'

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="order-card">
      <header>
        <div>
          <span>Order</span>
          <strong>#{order._id.slice(-8).toUpperCase()}</strong>
        </div>
        <div>
          <span>Placed</span>
          <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
        </div>
        <div>
          <span>Total</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>
        <span className={`payment-status status-${order.paymentStatus}`}>
          {order.paymentStatus}
        </span>
      </header>
      <div className="order-items">
        {order.items.map((item, index) => (
          <div className="order-item" key={`${item.product}-${index}`}>
            <ProductImage
              src={item.image}
              alt={item.title}
              category={item.category}
            />
            <div>
              <span>{item.category}</span>
              <h3>{item.title}</h3>
              <ConditionBadge condition={item.condition} />
            </div>
            <div className="order-item-meta">
              <span>Qty {item.quantity}</span>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
              <span className={`item-status status-${item.status}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <footer>
        <span>Ship to</span>
        <p>
          {order.shippingAddress.line1}, {order.shippingAddress.city},{' '}
          {order.shippingAddress.state} {order.shippingAddress.zip}
        </p>
      </footer>
    </article>
  )
}
