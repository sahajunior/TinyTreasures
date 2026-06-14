import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/types'
import ProductImage from './ProductImage'

interface HeroGridProps {
  products: Product[]
}

export default function HeroGrid({ products }: HeroGridProps) {
  if (products.length < 3) return null

  const [hero, ...side] = products
  return (
    <div className="hero-grid">
      <Link className="hero-product" to={`/products/${hero._id}`}>
        <ProductImage
          src={hero.images[0]}
          alt={hero.title}
          category={hero.category}
        />
        <div className="hero-product-copy">
          <span>{hero.category}</span>
          <h3>{hero.title}</h3>
          <strong>{formatCurrency(hero.price)}</strong>
        </div>
      </Link>
      <div className="hero-side-products">
        {side.slice(0, 2).map((product) => (
          <Link
            className="hero-side-product"
            to={`/products/${product._id}`}
            key={product._id}
          >
            <ProductImage
              src={product.images[0]}
              alt={product.title}
              category={product.category}
            />
            <div>
              <span>{product.category}</span>
              <h3>{product.title}</h3>
              <strong>{formatCurrency(product.price)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
