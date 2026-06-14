import { formatDate } from '@/lib/format'
import type { Review } from '@/types'
import StarRating from './StarRating'

interface ReviewListProps {
  reviews: Review[]
}

export default function ReviewList({ reviews }: ReviewListProps) {
  return (
    <section className="review-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Collector notes</p>
          <h2>Reviews</h2>
        </div>
        <span>{reviews.length} entries</span>
      </div>
      {reviews.length === 0 ? (
        <p className="empty-copy">No reviews yet. This object awaits its first collector note.</p>
      ) : (
        <div className="review-list">
          {reviews.map((review) => (
            <article key={review._id}>
              <div>
                <strong>
                  {typeof review.buyer === 'string'
                    ? 'Verified buyer'
                    : review.buyer.name}
                </strong>
                <time dateTime={review.createdAt}>
                  {formatDate(review.createdAt)}
                </time>
              </div>
              <StarRating value={review.rating} />
              {review.comment && <p>{review.comment}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
