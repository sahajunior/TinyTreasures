import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { deleteSellerProduct, getSellerProducts } from '@/api/seller'
import ConditionBadge from '@/components/product/ConditionBadge'
import ProductImage from '@/components/product/ProductImage'
import { formatCurrency, getErrorMessage } from '@/lib/format'

export default function SellerProducts() {
  const queryClient = useQueryClient()
  const products = useQuery({
    queryKey: ['seller', 'products'],
    queryFn: getSellerProducts,
  })
  const remove = useMutation({
    mutationFn: deleteSellerProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller'] })
      toast.success('Listing removed')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Delete failed')),
  })

  const deleteProduct = (id: string, title: string) => {
    if (window.confirm(`Remove "${title}" from marketplace?`)) {
      remove.mutate(id)
    }
  }

  return (
    <section>
      <header className="seller-page-header seller-page-header-action">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Products</h1>
        </div>
        <Link className="button button-primary" to="/seller/products/new">
          <Plus aria-hidden="true" /> Add new listing
        </Link>
      </header>

      {products.isLoading && <div className="loading-state">Opening inventory…</div>}
      {products.isError && <div className="error-state">Inventory unavailable.</div>}
      {products.data?.length === 0 && (
        <div className="empty-state">
          <h2>No active listings.</h2>
          <p>Create first catalogue entry.</p>
        </div>
      )}
      {products.data && products.data.length > 0 && (
        <div className="seller-table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Object</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Stock</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="seller-product-cell">
                      <ProductImage
                        src={product.images[0]}
                        alt={product.title}
                        category={product.category}
                      />
                      <div>
                        <strong>{product.title}</strong>
                        <span>{product.category} · {product.subcategory ?? 'General'}</span>
                      </div>
                    </div>
                  </td>
                  <td><ConditionBadge condition={product.condition} /></td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <div className="seller-row-actions">
                      <Link
                        to={`/seller/products/${product._id}/edit`}
                        aria-label={`Edit ${product.title}`}
                      >
                        <Pencil aria-hidden="true" /> Edit
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${product.title}`}
                        disabled={remove.isPending}
                        onClick={() => deleteProduct(product._id, product.title)}
                      >
                        <Trash2 aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
