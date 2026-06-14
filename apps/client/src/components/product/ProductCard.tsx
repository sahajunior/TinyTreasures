import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/types'
import ConditionBadge from './ConditionBadge'
import ProductImage from './ProductImage'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-card-image">
        <ProductImage
          src={product.images[0]}
          alt={product.title}
          category={product.category}
        />
      </Link>
      <div className="product-card-body">
        <p className="card-category">{product.category}</p>
        <Link to={`/products/${product._id}`}>
          <h3>{product.title}</h3>
        </Link>
        <p className="card-subcategory">
          {product.subcategory ?? product.scale ?? 'Collector edition'}
        </p>
        <div className="product-card-footer">
          <strong>{formatCurrency(product.price)}</strong>
          <ConditionBadge condition={product.condition} />
        </div>
      </div>
    </article>
  )
}
