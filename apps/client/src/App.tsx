import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import SellerLayout from '@/components/seller/SellerLayout'
import Cart from '@/pages/Cart'
import Home from '@/pages/Home'
import OrderSuccess from '@/pages/OrderSuccess'
import Orders from '@/pages/Orders'
import PlaceholderPage from '@/pages/PlaceholderPage'
import ProductDetail from '@/pages/ProductDetail'
import ProductList from '@/pages/ProductList'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

const SellerDashboardPage = lazy(() => import('@/pages/seller/Dashboard'))
const SellerOrders = lazy(() => import('@/pages/seller/Orders'))
const SellerProductForm = lazy(() => import('@/pages/seller/ProductForm'))
const SellerProducts = lazy(() => import('@/pages/seller/Products'))

const page = (eyebrow: string, title: string, description: string) => (
  <PlaceholderPage eyebrow={eyebrow} title={title} description={description} />
)

const sellerPage = (component: ReactNode) => (
  <Suspense fallback={<div className="loading-state">Opening seller office…</div>}>
    {component}
  </Suspense>
)

export default function App() {
  const location = useLocation()
  const sellerArea = location.pathname.startsWith('/seller')
  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute role="buyer" />}>
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders" element={<Orders />} />
      </Route>

      <Route element={<ProtectedRoute role="seller" />}>
        <Route element={<SellerLayout />}>
          <Route path="/seller" element={sellerPage(<SellerDashboardPage />)} />
          <Route path="/seller/products" element={sellerPage(<SellerProducts />)} />
          <Route path="/seller/products/new" element={sellerPage(<SellerProductForm />)} />
          <Route path="/seller/products/:id/edit" element={sellerPage(<SellerProductForm />)} />
          <Route path="/seller/orders" element={sellerPage(<SellerOrders />)} />
        </Route>
      </Route>

      <Route path="*" element={page('Archive error', 'Page not found', 'This catalogue page does not exist.')} />
    </Routes>
  )

  return (
    <div className={`app-shell ${sellerArea ? 'seller-app-shell' : ''}`}>
      {!sellerArea && <Navbar />}
      {sellerArea ? routes : <main className="page-container">{routes}</main>}
      {!sellerArea && <Footer />}
    </div>
  )
}
