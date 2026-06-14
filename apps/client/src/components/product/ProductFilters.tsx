import type { Dispatch, SetStateAction } from 'react'
import type { ProductCondition } from '@/types'

interface ProductFiltersProps {
  params: URLSearchParams
  setParams: Dispatch<SetStateAction<URLSearchParams>>
}

const categories = ['Cars', 'Sports', 'Action Figures']
const conditions: ProductCondition[] = [
  'Mint in Box',
  'Near Mint',
  'Good',
  'Used',
]

export default function ProductFilters({
  params,
  setParams,
}: ProductFiltersProps) {
  const update = (key: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })
  }

  return (
    <aside className="product-filters" aria-label="Product filters">
      <div className="filter-heading">
        <span>Refine archive</span>
        <button type="button" onClick={() => setParams(new URLSearchParams())}>
          Clear
        </button>
      </div>

      <label className="filter-field">
        <span>Search</span>
        <input
          type="search"
          value={params.get('search') ?? ''}
          onChange={(event) => update('search', event.target.value)}
          placeholder="Title or description"
        />
      </label>

      <fieldset>
        <legend>Category</legend>
        {categories.map((category) => (
          <label className="radio-row" key={category}>
            <input
              type="radio"
              name="category"
              checked={params.get('category') === category}
              onChange={() => update('category', category)}
            />
            <span>{category}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Condition</legend>
        {conditions.map((condition) => (
          <label className="radio-row" key={condition}>
            <input
              type="radio"
              name="condition"
              checked={params.get('condition') === condition}
              onChange={() => update('condition', condition)}
            />
            <span>{condition}</span>
          </label>
        ))}
      </fieldset>

      <div className="price-filter">
        <label>
          <span>Min price</span>
          <input
            type="number"
            min="0"
            step="1"
            value={
              params.get('minPrice')
                ? Number(params.get('minPrice')) / 100
                : ''
            }
            onChange={(event) =>
              update(
                'minPrice',
                event.target.value
                  ? String(Math.round(Number(event.target.value) * 100))
                  : '',
              )
            }
          />
        </label>
        <label>
          <span>Max price</span>
          <input
            type="number"
            min="0"
            step="1"
            value={
              params.get('maxPrice')
                ? Number(params.get('maxPrice')) / 100
                : ''
            }
            onChange={(event) =>
              update(
                'maxPrice',
                event.target.value
                  ? String(Math.round(Number(event.target.value) * 100))
                  : '',
              )
            }
          />
        </label>
      </div>
    </aside>
  )
}
