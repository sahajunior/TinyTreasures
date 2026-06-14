import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '@/api/products'
import ProductFilters from '@/components/product/ProductFilters'
import ProductGrid from '@/components/product/ProductGrid'

export default function ProductList() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = Object.fromEntries(params.entries())
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', query],
    queryFn: () =>
      getProducts({
        ...query,
        minPrice: query.minPrice ? Number(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
        page: query.page ? Number(query.page) : 1,
        limit: 12,
      }),
    placeholderData: keepPreviousData,
  })

  const updateParam = (key: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })
  }

  return (
    <section className="catalogue-page">
      <header className="page-header">
        <p className="eyebrow">Complete archive</p>
        <h1>Browse the collection</h1>
        <p>
          Search by maker, category, condition, or price. Every listing comes
          from an independent specialist.
        </p>
      </header>

      <div className="catalogue-toolbar">
        <button
          className="button mobile-filter-toggle"
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal aria-hidden="true" /> Filters
        </button>
        <span>{data?.total ?? 0} objects</span>
        <label>
          <span>Sort</span>
          <select
            value={params.get('sort') ?? 'newest'}
            onChange={(event) => updateParam('sort', event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
          </select>
        </label>
      </div>

      <div className="catalogue-layout">
        <div className={filtersOpen ? 'filters-mobile-open' : ''}>
          <ProductFilters params={params} setParams={setParams} />
        </div>
        <div className="catalogue-results">
          {isLoading && <div className="loading-state">Opening archive…</div>}
          {isError && (
            <div className="error-state">
              Archive unavailable. Start the API and refresh this page.
            </div>
          )}
          {data && <ProductGrid products={data.products} />}

          {data && data.pages > 1 && (
            <nav className="pagination" aria-label="Product pages">
              {Array.from({ length: data.pages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    type="button"
                    className={page === data.page ? 'active' : ''}
                    key={page}
                    onClick={() => updateParam('page', String(page))}
                  >
                    {page}
                  </button>
                ),
              )}
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}
