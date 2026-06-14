import api from '@/api/client'
import type {
  ApiResponse,
  CartItem,
  Order,
  ShippingAddress,
} from '@/types'

export const checkout = async (
  items: CartItem[],
  shippingAddress: ShippingAddress,
): Promise<string> => {
  const { data } = await api.post<ApiResponse<{ checkoutUrl: string }>>(
    '/orders/checkout',
    {
      cart: items.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
      shippingAddress,
    },
  )
  return data.data.checkoutUrl
}

export const getOrders = async (sessionId?: string): Promise<Order[]> => {
  const { data } = await api.get<ApiResponse<Order[]>>('/orders', {
    params: sessionId ? { sessionId } : undefined,
  })
  return data.data
}
