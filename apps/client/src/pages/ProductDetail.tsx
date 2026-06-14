import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import {
  getProduct,
  getProductReviews,
} from '@/api/products'
import ConditionBadge from '@/components/product/ConditionBadge'
import ImageGallery from '@/components/product/ImageGallery'
import ReviewList from '@/components/review/ReviewList'
import ReviewForm from '@/components/review/ReviewForm'
import StarRating from '@/components/review/StarRating'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'

export default function ProductDetail() {
  const { id = '' } = useParams()
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  })
  const reviewsQuery = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getProductReviews(id),
    enabled: Boolean(id),
  })

  if (productQuery.isLoading) {
    return <div className="loading-state page-state">Opening object record…</div>
  }
  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="error-state page-state">
        Product unavailable. <Link to="/products">Return to archive.</Link>
      </div>
    )
  }

  const product = productQuery.data
  const sellerName =
    typeof product.seller === 'string'
      ? 'Independent seller'
      : product.seller.name

  const addToCart = () => {
    addItem(
      {
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0] ?? '',
        category: product.category,
        condition: product.condition,
        stock: product.stock,
      },
      quantity,
    )
    toast.success('Added to cart')
  }

  return (
    <article className="product-detail-page">
      <div className="product-detail-grid">
        <ImageGallery product={product} />
        <div className="product-detail-panel">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.title}</h1>
          <div className="rating-line">
            <StarRating value={product.averageRating} />
            <span>{product.reviewCount} reviews</span>
          </div>
          <p className="product-description">{product.description}</p>
          <div className="product-meta">
            <ConditionBadge condition={product.condition} />
            {product.scale && <span>{product.scale}</span>}
            {product.series && <span>{product.series}</span>}
          </div>
          <strong className="detail-price">{formatCurrency(product.price)}</strong>
          <p className="stock-line">
            {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
          </p>

          <div className="purchase-row">
            <div className="quantity-control">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              >
                <Minus aria-hidden="true" />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() =>
                  setQuantity((current) => Math.min(product.stock, current + 1))
                }
              >
                <Plus aria-hidden="true" />
              </button>
            </div>
            <button
              className="button button-primary add-cart-button"
              type="button"
              onClick={addToCart}
              disabled={product.stock === 0}
            >
              <ShoppingBag aria-hidden="true" /> Add to cart
            </button>
          </div>

          <aside className="seller-card">
            <span>Offered by</span>
            <h2>{sellerName}</h2>
            <p>Independent specialist · Verified marketplace seller</p>
          </aside>
        </div>
      </div>
      <ReviewForm productId={product._id} />
      <ReviewList reviews={reviewsQuery.data ?? []} />
    </article>
  )
}
