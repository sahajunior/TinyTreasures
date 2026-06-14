import { Minus, Plus, Trash2 } from 'lucide-react'
import ConditionBadge from '@/components/product/ConditionBadge'
import ProductImage from '@/components/product/ProductImage'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'
import type { CartItem } from '@/types'

interface CartItemRowProps {
  item: CartItem
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const removeItem = useCartStore((state) => state.removeItem)
  const setQuantity = useCartStore((state) => state.setQuantity)

  return (
    <article className="cart-item">
      <ProductImage
        src={item.image}
        alt={item.title}
        category={item.category}
      />
      <div className="cart-item-copy">
        <span>{item.category}</span>
        <h2>{item.title}</h2>
        <ConditionBadge condition={item.condition} />
      </div>
      <div className="quantity-control">
        <button
          type="button"
          aria-label={`Decrease ${item.title} quantity`}
          onClick={() => setQuantity(item.productId, item.quantity - 1)}
        >
          <Minus aria-hidden="true" />
        </button>
        <span>{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase ${item.title} quantity`}
          onClick={() => setQuantity(item.productId, item.quantity + 1)}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
      <strong>{formatCurrency(item.price * item.quantity)}</strong>
      <button
        className="remove-button"
        type="button"
        aria-label={`Remove ${item.title}`}
        onClick={() => removeItem(item.productId)}
      >
        <Trash2 aria-hidden="true" />
      </button>
    </article>
  )
}
