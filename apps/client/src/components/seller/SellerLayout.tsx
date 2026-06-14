import { Outlet } from 'react-router-dom'
import SellerSidebar from '@/components/seller/SellerSidebar'

export default function SellerLayout() {
  return (
    <div className="seller-shell">
      <SellerSidebar />
      <main className="seller-content">
        <Outlet />
      </main>
    </div>
  )
}
