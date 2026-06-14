import { CarFront, Medal, Shield } from 'lucide-react'
import type { ProductCategory } from '@/types'

interface ProductImageProps {
  src?: string
  alt: string
  category: ProductCategory
  className?: string
}

const categoryIcon = {
  Cars: CarFront,
  Sports: Medal,
  'Action Figures': Shield,
}

export default function ProductImage({
  src,
  alt,
  category,
  className = '',
}: ProductImageProps) {
  if (src) {
    return <img className={className} src={src} alt={alt} loading="lazy" />
  }

  const Icon = categoryIcon[category]
  return (
    <div
      className={`product-art product-art-${category
        .toLowerCase()
        .replaceAll(' ', '-')} ${className}`}
      role="img"
      aria-label={`${alt} placeholder artwork`}
    >
      <span>{category}</span>
      <Icon aria-hidden="true" />
      <small>Archive specimen</small>
    </div>
  )
}
