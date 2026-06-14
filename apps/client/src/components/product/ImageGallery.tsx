import { useState } from 'react'
import type { Product } from '@/types'
import ProductImage from './ProductImage'

interface ImageGalleryProps {
  product: Product
}

export default function ImageGallery({ product }: ImageGalleryProps) {
  const images = product.images.length > 0 ? product.images : ['']
  const [activeImage, setActiveImage] = useState(images[0])

  return (
    <div className="image-gallery">
      <ProductImage
        className="gallery-main"
        src={activeImage}
        alt={product.title}
        category={product.category}
      />
      <div className="thumbnail-strip" aria-label="Product images">
        {images.slice(0, 4).map((image, index) => (
          <button
            className={activeImage === image ? 'active' : ''}
            type="button"
            key={`${image}-${index}`}
            onClick={() => setActiveImage(image)}
            aria-label={`View image ${index + 1}`}
          >
            <ProductImage
              src={image}
              alt=""
              category={product.category}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
