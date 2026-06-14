import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProducts } from '@/api/products'
import HeroGrid from '@/components/product/HeroGrid'
import ProductGrid from '@/components/product/ProductGrid'
import { editorialShowcase } from '@/data/editorialShowcase'

const sellers = [
  { initial: 'G', name: 'GearShift Collectibles', items: 8 },
  { initial: 'S', name: 'StadiumVault', items: 8 },
  { initial: 'F', name: 'FigureForge', items: 8 },
]

export default function Home() {
  const { data, isError } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: () => getProducts({ sort: 'newest', limit: 9 }),
  })
  const products =
    data?.products && data.products.length >= 6
      ? data.products
      : editorialShowcase

  return (
    <>
      <section className="home-intro">
        <div>
          <p className="eyebrow">The collector’s marketplace</p>
          <h1>Objects worth keeping.</h1>
        </div>
        <div className="home-intro-copy">
          <p>
            Discover miniature cars, sports memorabilia, and figures selected
            by independent sellers.
          </p>
          <Link className="button button-primary" to="/products">
            Browse collection <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      {isError && (
        <p className="demo-notice">
          Live archive unavailable — showing the curated catalogue preview.
        </p>
      )}

      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Editor’s selection</p>
            <h2>Featured objects</h2>
          </div>
          <Link to="/products">View complete archive</Link>
        </div>
        <HeroGrid products={products.slice(0, 3)} />
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recently catalogued</p>
            <h2>New arrivals</h2>
          </div>
          <span>{data?.total ?? 24} objects</span>
        </div>
        <ProductGrid products={products.slice(3, 6)} />
      </section>

      <section className="home-section sellers-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Independent specialists</p>
            <h2>Our sellers</h2>
          </div>
        </div>
        <div className="seller-grid">
          {sellers.map((seller) => (
            <article key={seller.name}>
              <span className="seller-initial">{seller.initial}</span>
              <div>
                <h3>{seller.name}</h3>
                <p>{seller.items} catalogued objects</p>
                <span className="seller-stars" aria-label="5 stars">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} aria-hidden="true" />
                  ))}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
