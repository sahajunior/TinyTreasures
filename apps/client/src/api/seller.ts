import api from '@/api/client'
import type {
  ApiResponse,
  Product,
  ProductInput,
  SellerDashboard,
  SellerOrder,
} from '@/types'

export const getSellerDashboard = async (): Promise<SellerDashboard> => {
  const { data } = await api.get<ApiResponse<SellerDashboard>>('/seller/dashboard')
  return data.data
}

export const getSellerProducts = async (): Promise<Product[]> => {
  const { data } = await api.get<ApiResponse<Product[]>>('/seller/products')
  return data.data
}

export const getSellerProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get<ApiResponse<Product>>(`/seller/products/${id}`)
  return data.data
}

export const createSellerProduct = async (
  input: ProductInput,
): Promise<Product> => {
  const { data } = await api.post<ApiResponse<Product>>('/seller/products', input)
  return data.data
}

export const updateSellerProduct = async (
  id: string,
  input: ProductInput,
): Promise<Product> => {
  const { data } = await api.put<ApiResponse<Product>>(
    `/seller/products/${id}`,
    input,
  )
  return data.data
}

export const deleteSellerProduct = async (id: string): Promise<void> => {
  await api.delete(`/seller/products/${id}`)
}

export const uploadSellerProductImages = async (
  id: string,
  files: File[],
): Promise<Product> => {
  const body = new FormData()
  files.forEach((file) => body.append('images', file))
  const { data } = await api.post<ApiResponse<Product>>(
    `/seller/products/${id}/images`,
    body,
  )
  return data.data
}

export const replaceSellerProductImage = async (
  id: string,
  imageIndex: number,
  file: File,
): Promise<Product> => {
  const body = new FormData()
  body.append('image', file)
  const { data } = await api.put<ApiResponse<Product>>(
    `/seller/products/${id}/images/${imageIndex}`,
    body,
  )
  return data.data
}

export const deleteSellerProductImage = async (
  id: string,
  imageIndex: number,
): Promise<Product> => {
  const { data } = await api.delete<ApiResponse<Product>>(
    `/seller/products/${id}/images/${imageIndex}`,
  )
  return data.data
}

export const reorderSellerProductImages = async (
  id: string,
  images: string[],
): Promise<Product> => {
  const { data } = await api.patch<ApiResponse<Product>>(
    `/seller/products/${id}/images/order`,
    { images },
  )
  return data.data
}

export const getSellerOrders = async (): Promise<SellerOrder[]> => {
  const { data } = await api.get<ApiResponse<SellerOrder[]>>('/seller/orders')
  return data.data
}

export const markSellerItemShipped = async (
  orderId: string,
  orderItemIndex: number,
): Promise<void> => {
  await api.put(`/seller/orders/${orderId}/items/${orderItemIndex}/ship`)
}
