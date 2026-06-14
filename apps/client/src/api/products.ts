import api from '@/api/client'
import type {
  ApiResponse,
  Product,
  ProductListResult,
  Review,
} from '@/types'

export interface ProductQuery {
  search?: string
  category?: string
  subcategory?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  limit?: number
}

export const getProducts = async (
  query: ProductQuery = {},
): Promise<ProductListResult> => {
  const { data } = await api.get<ApiResponse<ProductListResult>>('/products', {
    params: query,
  })
  return data.data
}

export const getProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`)
  return data.data
}

export const getProductReviews = async (id: string): Promise<Review[]> => {
  const { data } = await api.get<ApiResponse<Review[]>>(
    `/reviews/product/${id}`,
  )
  return data.data
}
