import { useQuery } from '@tanstack/react-query'
import { Boxes, DollarSign, PackageCheck } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getSellerDashboard, getSellerProducts } from '@/api/seller'
import { formatCurrency } from '@/lib/format'

export default function SellerDashboardPage() {
  const dashboard = useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: getSellerDashboard,
  })
  const products = useQuery({
    queryKey: ['seller', 'products'],
    queryFn: getSellerProducts,
  })

  if (dashboard.isLoading) {
    return <div className="loading-state">Opening seller ledger…</div>
  }
  if (dashboard.isError || !dashboard.data) {
    return <div className="error-state">Seller ledger unavailable.</div>
  }

  const data = dashboard.data
  const chartData = data.weeklyRevenue.map((entry) => ({
    label: `W${entry.week}`,
    revenue: entry.revenue / 100,
  }))

  return (
    <section>
      <header className="seller-page-header">
        <div>
          <p className="eyebrow">Seller office</p>
          <h1>Dashboard</h1>
        </div>
        <span>Live catalogue and paid-order totals</span>
      </header>

      <div className="seller-kpi-grid">
        <article>
          <DollarSign aria-hidden="true" />
          <span>Total revenue</span>
          <strong>{formatCurrency(data.totalRevenue)}</strong>
        </article>
        <article>
          <PackageCheck aria-hidden="true" />
          <span>Pending shipments</span>
          <strong>{data.pendingCount}</strong>
        </article>
        <article>
          <Boxes aria-hidden="true" />
          <span>Active listings</span>
          <strong>{products.data?.length ?? '—'}</strong>
        </article>
      </div>

      <div className="seller-dashboard-grid">
        <article className="seller-panel revenue-panel">
          <header>
            <div>
              <span>Revenue record</span>
              <h2>Last eight weeks</h2>
            </div>
          </header>
          {chartData.length ? (
            <div className="revenue-chart" aria-label="Weekly revenue chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="#d4c4a0" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value) * 100),
                      'Revenue',
                    ]}
                    contentStyle={{
                      borderRadius: 0,
                      border: '1px solid #c8b898',
                      background: '#faf7f2',
                      fontFamily: '"Roboto Slab", serif',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b6914"
                    fill="#d4c4a0"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="seller-empty-chart">
              Revenue history appears after first paid order.
            </div>
          )}
        </article>

        <article className="seller-panel top-products-panel">
          <header>
            <div>
              <span>Performance</span>
              <h2>Top products</h2>
            </div>
          </header>
          {data.topProducts.length ? (
            <ol>
              {data.topProducts.map((product) => (
                <li key={product._id}>
                  <div>
                    <strong>{product.title}</strong>
                    <span>{product.unitsSold} sold</span>
                  </div>
                  <b>{formatCurrency(product.revenue)}</b>
                </li>
              ))}
            </ol>
          ) : (
            <p className="seller-empty-copy">No paid sales recorded yet.</p>
          )}
        </article>
      </div>
    </section>
  )
}
