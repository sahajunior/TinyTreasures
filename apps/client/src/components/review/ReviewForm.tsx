import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { getOrders } from '@/api/orders'
import { createReview } from '@/api/reviews'
import StarRating from '@/components/review/StarRating'
import { getErrorMessage } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'

interface ReviewFormProps {
  productId: string
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    enabled: user?.role === 'buyer',
  })

  const eligible = orders.data
    ?.flatMap((order) =>
      order.items.map((item, orderItemIndex) => ({
        order,
        item,
        orderItemIndex,
      })),
    )
    .find(({ item }) => item.product === productId && !item.reviewLeft)

  const mutation = useMutation({
    mutationFn: () =>
      createReview({
        productId,
        orderId: eligible!.order._id,
        orderItemIndex: eligible!.orderItemIndex,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      setRating(0)
      setComment('')
      void queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
      void queryClient.invalidateQueries({ queryKey: ['product', productId] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Review published')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Review failed')),
  })

  if (user?.role !== 'buyer' || !eligible) return null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!rating) {
      toast.error('Choose a star rating')
      return
    }
    mutation.mutate()
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <div>
        <p className="eyebrow">Verified purchase</p>
        <h2>Leave a review</h2>
      </div>
      <label>
        <span>Your rating</span>
        <StarRating value={rating} onChange={setRating} />
      </label>
      <label>
        <span>Collector notes</span>
        <textarea
          rows={4}
          maxLength={500}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Condition, packaging, seller care…"
        />
      </label>
      <button className="button button-primary" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Publishing…' : 'Publish review'}
      </button>
    </form>
  )
}
