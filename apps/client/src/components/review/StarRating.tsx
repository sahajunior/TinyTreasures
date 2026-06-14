import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  label?: string
  onChange?: (value: number) => void
}

export default function StarRating({ value, label, onChange }: StarRatingProps) {
  if (onChange) {
    return (
      <span className="star-rating star-rating-input" aria-label={label ?? 'Choose rating'}>
        {Array.from({ length: 5 }, (_, index) => {
          const rating = index + 1
          return (
            <button
              type="button"
              key={rating}
              aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
              aria-pressed={rating === value}
              onClick={() => onChange(rating)}
            >
              <Star aria-hidden="true" className={rating <= value ? 'filled' : ''} />
            </button>
          )
        })}
      </span>
    )
  }

  return (
    <span
      className="star-rating"
      aria-label={label ?? `${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          key={index}
          className={index < Math.round(value) ? 'filled' : ''}
        />
      ))}
    </span>
  )
}
