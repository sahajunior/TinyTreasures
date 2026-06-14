import api from '@/api/client'
import type { ApiResponse, Review } from '@/types'

export interface ReviewInput {
  productId: string
  orderId: string
  orderItemIndex: number
  rating: number
  comment?: string
}

export const createReview = async (input: ReviewInput): Promise<Review> => {
  const { data } = await api.post<ApiResponse<Review>>('/reviews', input)
  return data.data
}
