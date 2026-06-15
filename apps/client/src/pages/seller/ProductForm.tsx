import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  RefreshCw,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import {
  createSellerProduct,
  deleteSellerProductImage,
  getSellerProduct,
  reorderSellerProductImages,
  replaceSellerProductImage,
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

const MAX_PRODUCT_IMAGES = 7

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

  const syncProduct = (updated: NonNullable<typeof product.data>) => {
    queryClient.setQueryData(['seller', 'product', id], updated)
    void queryClient.invalidateQueries({ queryKey: ['seller', 'products'] })
  }

  const uploadImages = useMutation({
    mutationFn: (selected: File[]) => uploadSellerProductImages(id!, selected),
    onSuccess: (updated) => {
      syncProduct(updated)
      toast.success('Photos added')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Photos could not be added')),
  })

  const replaceImage = useMutation({
    mutationFn: ({ imageIndex, file }: { imageIndex: number; file: File }) =>
      replaceSellerProductImage(id!, imageIndex, file),
    onSuccess: (updated) => {
      syncProduct(updated)
      toast.success('Photo updated')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Photo could not be updated')),
  })

  const removeImage = useMutation({
    mutationFn: (imageIndex: number) => deleteSellerProductImage(id!, imageIndex),
    onSuccess: (updated) => {
      syncProduct(updated)
      toast.success('Photo deleted')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Photo could not be deleted')),
  })

  const reorderImages = useMutation({
    mutationFn: (images: string[]) => reorderSellerProductImages(id!, images),
    onSuccess: (updated) => syncProduct(updated),
    onError: (error) => toast.error(getErrorMessage(error, 'Photos could not be reordered')),
  })

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
    const remaining = Math.max(
      0,
      MAX_PRODUCT_IMAGES - (product.data?.images.length ?? 0) - files.length,
    )
    const accepted = images.slice(0, remaining)
    if (editing && accepted.length > 0) {
      uploadImages.mutate(accepted)
    } else {
      setFiles((current) => [...current, ...accepted])
    }
    if (images.length > remaining) {
      toast.error('Maximum: 1 cover photo and 6 additional photos')
    }
  }

  const movePendingImage = (from: number, to: number) => {
    setFiles((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const moveExistingImage = (from: number, to: number) => {
    if (!product.data) return
    const images = [...product.data.images]
    const [moved] = images.splice(from, 1)
    images.splice(to, 0, moved)
    reorderImages.mutate(images)
  }

  const photoBusy =
    uploadImages.isPending ||
    replaceImage.isPending ||
    removeImage.isPending ||
    reorderImages.isPending

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
          <p>
            First image is the cover. Replace, delete, or reorder up to six
            additional photos. JPG, PNG, or WebP, 5 MB each.
          </p>
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
              disabled={photoBusy}
              onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
            />
          </label>
          <div className="image-preview-grid">
            {product.data?.images.map((src, index) => (
              <div className="photo-preview-item" key={src}>
                {index === 0 && <span className="cover-photo-label">Cover</span>}
                <ProductImage
                  src={src}
                  alt={product.data!.title}
                  category={product.data!.category}
                />
                <div className="photo-actions">
                  {index > 0 && (
                    <button
                      type="button"
                      aria-label={`Set photo ${index + 1} as cover`}
                      title="Set as cover"
                      disabled={photoBusy}
                      onClick={() => moveExistingImage(index, 0)}
                    >
                      <Star aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Move photo ${index + 1} left`}
                    title="Move left"
                    disabled={photoBusy || index === 0}
                    onClick={() => moveExistingImage(index, index - 1)}
                  >
                    <ArrowLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move photo ${index + 1} right`}
                    title="Move right"
                    disabled={photoBusy || index === product.data!.images.length - 1}
                    onClick={() => moveExistingImage(index, index + 1)}
                  >
                    <ArrowRight aria-hidden="true" />
                  </button>
                  <label title="Replace photo">
                    <RefreshCw aria-hidden="true" />
                    <span className="sr-only">Replace photo {index + 1}</span>
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/*"
                      disabled={photoBusy}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) replaceImage.mutate({ imageIndex: index, file })
                        event.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="photo-delete"
                    aria-label={`Delete photo ${index + 1}`}
                    title="Delete photo"
                    disabled={photoBusy}
                    onClick={() => {
                      if (window.confirm('Delete this photo permanently?')) {
                        removeImage.mutate(index)
                      }
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {previews.map(({ file, url }, index) => (
              <div
                className="image-preview photo-preview-item"
                key={`${file.name}-${file.lastModified}`}
              >
                {(product.data?.images.length ?? 0) === 0 && index === 0 && (
                  <span className="cover-photo-label">Cover</span>
                )}
                <img src={url} alt={`New upload ${index + 1}`} />
                <div className="photo-actions">
                  {index > 0 && (
                    <button
                      type="button"
                      aria-label={`Set ${file.name} as cover`}
                      title="Set as cover"
                      onClick={() => movePendingImage(index, 0)}
                    >
                      <Star aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Move ${file.name} left`}
                    title="Move left"
                    disabled={index === 0}
                    onClick={() => movePendingImage(index, index - 1)}
                  >
                    <ArrowLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${file.name} right`}
                    title="Move right"
                    disabled={index === files.length - 1}
                    onClick={() => movePendingImage(index, index + 1)}
                  >
                    <ArrowRight aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    title="Remove photo"
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
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
