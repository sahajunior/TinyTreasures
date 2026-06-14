export type UserRole = 'buyer' | 'seller'
export type ProductCategory = 'Cars' | 'Sports' | 'Action Figures'
export type ProductCondition = 'Mint in Box' | 'Near Mint' | 'Good' | 'Used'
export type OrderItemStatus = 'pending' | 'shipped' | 'delivered'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface CartItem {
  productId: string
  title: string
  price: number
  image: string
  category: ProductCategory
  condition: ProductCondition
  stock: number
  quantity: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface SellerSummary {
  _id?: string
  id?: string
  name: string
  email?: string
}

export interface Product {
  _id: string
  seller: SellerSummary | string
  title: string
  description: string
  price: number
  category: ProductCategory
  subcategory?: string
  condition: ProductCondition
  scale?: string
  series?: string
  images: string[]
  stock: number
  averageRating: number
  reviewCount: number
  isActive: boolean
  createdAt: string
}

export interface ProductListResult {
  products: Product[]
  total: number
  page: number
  pages: number
}

export type ProductInput = Pick<
  Product,
  | 'title'
  | 'description'
  | 'price'
  | 'category'
  | 'condition'
  | 'stock'
> &
  Partial<Pick<Product, 'subcategory' | 'scale' | 'series'>>

export interface SellerDashboard {
  totalRevenue: number
  pendingCount: number
  topProducts: Array<{
    _id: string
    title: string
    revenue: number
    unitsSold: number
  }>
  weeklyRevenue: Array<{
    year: number
    week: number
    revenue: number
  }>
}

export interface Review {
  _id: string
  product: string
  buyer: Pick<User, 'name'> | string
  order: string
  orderItemIndex: number
  rating: number
  comment?: string
  createdAt: string
}

export interface ShippingAddress {
  line1: string
  city: string
  state: string
  zip: string
  country: string
}

export interface OrderItem {
  product: string
  seller: string
  title: string
  price: number
  quantity: number
  image: string
  category: ProductCategory
  condition: ProductCondition
  status: OrderItemStatus
  reviewLeft: boolean
}

export interface Order {
  _id: string
  buyer: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  totalAmount: number
  stripeSessionId: string
  paymentStatus: 'pending' | 'paid' | 'failed'
  createdAt: string
}

export interface SellerOrderItem extends OrderItem {
  orderItemIndex: number
}

export interface SellerOrder {
  _id: string
  buyer: string
  items: SellerOrderItem[]
  shippingAddress: ShippingAddress
  createdAt: string
}
