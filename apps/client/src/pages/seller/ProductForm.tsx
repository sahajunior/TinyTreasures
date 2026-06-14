import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, X } from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import {
  createSellerProduct,
  getSellerProduct,
  updateSellerProduct,
  uploadSellerProductImages,
} from '@/api/seller'
import ProductImage from '@/components/product/ProductImage'
import { getErrorMessage } from '@/lib/format'
import type { ProductCategory, ProductCondition, ProductInput } from '@/types'

interface FormValues {
  title: string
  description: string
  price: string
  category: ProductCategory
  subcategory: string
  condition: ProductCondition
  scale: string
  series: string
  stock: string
}

const schema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    price: z.string().refine((value) => Number(value) > 0, 'Enter a valid price'),
    category: z.enum(['Cars', 'Sports', 'Action Figures']),
    subcategory: z.string(),
    condition: z.enum(['Mint in Box', 'Near Mint', 'Good', 'Used']),
    scale: z.string(),
    series: z.string(),
    stock: z
      .string()
      .regex(/^\d+$/, 'Stock must be zero or a whole number'),
  })
  .superRefine((values, context) => {
    if (values.category === 'Cars' && !values.scale.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['scale'],
        message: 'Scale is required for Cars',
      })
    }
  })

const defaults: FormValues = {
  title: '',
  description: '',
  price: '',
  category: 'Cars',
  subcategory: '',
  condition: 'Mint in Box',
  scale: '',
  series: '',
  stock: '1',
}

export default function SellerProductForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const product = useQuery({
    queryKey: ['seller', 'product', id],
    queryFn: () => getSellerProduct(id!),
    enabled: editing,
  })
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaults })

  useEffect(() => {
    if (!product.data) return
    reset({
      title: product.data.title,
      description: product.data.description,
      price: (product.data.price / 100).toFixed(2),
      category: product.data.category,
      subcategory: product.data.subcategory ?? '',
      condition: product.data.condition,
      scale: product.data.scale ?? '',
      series: product.data.series ?? '',
      stock: String(product.data.stock),
    })
  }, [product.data, reset])

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  )
  useEffect(
    () => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)),
    [previews],
  )

  const save = useMutation({
    mutationFn: async (input: ProductInput) => {
      const saved = editing
        ? await updateSellerProduct(id!, input)
        : await createSellerProduct(input)
      if (files.length) {
        return uploadSellerProductImages(saved._id, files)
      }
      return saved
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller'] })
      toast.success(editing ? 'Listing updated' : 'Listing created')
      navigate('/seller/products')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Listing could not be saved')),
  })

  const addFiles = (selected: File[]) => {
    const images = selected.filter((file) => file.type.startsWith('image/'))
    const remaining = Math.max(0, 4 - (product.data?.images.length ?? 0) - files.length)
    setFiles((current) => [...current, ...images.slice(0, remaining)])
    if (images.length > remaining) toast.error('Maximum 4 images per listing')
  }

  const dropFiles = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    addFiles(Array.from(event.dataTransfer.files))
  }

  const submit = handleSubmit((values) => {
    const result = schema.safeParse(values)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormValues
        setError(field, { message: issue.message })
      })
      return
    }
    save.mutate({
      title: result.data.title.trim(),
      description: result.data.description.trim(),
      price: Math.round(Number(result.data.price) * 100),
      category: result.data.category,
      subcategory: result.data.subcategory.trim() || undefined,
      condition: result.data.condition,
      scale:
        result.data.category === 'Cars'
          ? result.data.scale.trim()
          : undefined,
      series: result.data.series.trim() || undefined,
      stock: Number(result.data.stock),
    })
  })

  const category = useWatch({ control, name: 'category' })

  if (editing && product.isLoading) {
    return <div className="loading-state">Opening listing record…</div>
  }
  if (editing && product.isError) {
    return <div className="error-state">Listing unavailable.</div>
  }

  return (
    <section>
      <header className="seller-page-header">
        <div>
          <p className="eyebrow">{editing ? 'Catalogue revision' : 'New catalogue object'}</p>
          <h1>{editing ? 'Edit listing' : 'Add listing'}</h1>
        </div>
      </header>
      <form className="seller-product-form" onSubmit={submit} noValidate>
        <div className="seller-form-main">
          <fieldset>
            <legend>Object record</legend>
            <label className="seller-field seller-field-wide">
              <span>Title</span>
              <input {...register('title')} />
              {errors.title && <small>{errors.title.message}</small>}
            </label>
            <label className="seller-field seller-field-wide">
              <span>Description</span>
              <textarea rows={6} {...register('description')} />
              {errors.description && <small>{errors.description.message}</small>}
            </label>
            <label className="seller-field">
              <span>Category</span>
              <select {...register('category')}>
                <option>Cars</option>
                <option>Sports</option>
                <option>Action Figures</option>
              </select>
            </label>
            <label className="seller-field">
              <span>Subcategory</span>
              <input {...register('subcategory')} />
            </label>
            <label className="seller-field">
              <span>Condition</span>
              <select {...register('condition')}>
                <option>Mint in Box</option>
                <option>Near Mint</option>
                <option>Good</option>
                <option>Used</option>
              </select>
            </label>
            {category === 'Cars' && (
              <label className="seller-field">
                <span>Scale</span>
                <input placeholder="1:64" {...register('scale')} />
                {errors.scale && <small>{errors.scale.message}</small>}
              </label>
            )}
            <label className="seller-field">
              <span>Series</span>
              <input {...register('series')} />
            </label>
            <label className="seller-field">
              <span>Price (USD)</span>
              <input inputMode="decimal" placeholder="24.00" {...register('price')} />
              {errors.price && <small>{errors.price.message}</small>}
            </label>
            <label className="seller-field">
              <span>Stock</span>
              <input inputMode="numeric" {...register('stock')} />
              {errors.stock && <small>{errors.stock.message}</small>}
            </label>
          </fieldset>
        </div>

        <aside className="seller-form-images">
          <h2>Photography</h2>
          <p>JPG, PNG, or WebP. Up to four images, 5 MB each.</p>
          <label
            className="image-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={dropFiles}
          >
            <ImagePlus aria-hidden="true" />
            <strong>Drop images here</strong>
            <span>or choose files</span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
            />
          </label>
          <div className="image-preview-grid">
            {product.data?.images.map((src) => (
              <ProductImage
                key={src}
                src={src}
                alt={product.data!.title}
                category={product.data!.category}
              />
            ))}
            {previews.map(({ file, url }, index) => (
              <div className="image-preview" key={`${file.name}-${file.lastModified}`}>
                <img src={url} alt={`New upload ${index + 1}`} />
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="seller-form-actions">
          <Link className="button" to="/seller/products">Cancel</Link>
          <button className="button button-primary" type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
          </button>
        </div>
      </form>
    </section>
  )
}
