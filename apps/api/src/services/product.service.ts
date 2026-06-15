import Product, { IProduct } from "../models/Product";
import { ApiError } from "../utils/ApiError";
import { cacheGet, cacheSet, cacheInvalidate } from "./cache.service";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";

interface ProductQuery {
  search?: string;
  category?: string;
  subcategory?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResult {
  products: IProduct[];
  total: number;
  page: number;
  pages: number;
}

type ProductInput = Pick<
  IProduct,
  | "title"
  | "description"
  | "price"
  | "category"
  | "condition"
  | "stock"
> &
  Partial<Pick<IProduct, "subcategory" | "scale" | "series">>;

const normalizeProductInput = (data: Partial<IProduct>): ProductInput => {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const category = data.category;
  const condition = data.condition;
  const price = Number(data.price);
  const stock = Number(data.stock);

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }
  if (!["Cars", "Sports", "Action Figures"].includes(category as string)) {
    throw new ApiError(400, "Invalid category");
  }
  if (!["Mint in Box", "Near Mint", "Good", "Used"].includes(condition as string)) {
    throw new ApiError(400, "Invalid condition");
  }
  if (!Number.isInteger(price) || price < 1) {
    throw new ApiError(400, "Price must be a positive integer in cents");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ApiError(400, "Stock must be a non-negative integer");
  }
  if (category === "Cars" && !data.scale?.trim()) {
    throw new ApiError(400, "Scale is required for Cars");
  }

  return {
    title,
    description,
    price,
    category: category!,
    condition: condition!,
    stock,
    subcategory: data.subcategory?.trim() || undefined,
    scale: category === "Cars" ? data.scale?.trim() : undefined,
    series: data.series?.trim() || undefined,
  };
};

const uploadImage = (file: Express.Multer.File): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "tinytreasures/products",
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Image upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });

const getCloudinaryPublicId = (imageUrl: string): string | null => {
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== "res.cloudinary.com") return null;

    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex === -1) return null;

    const versionIndex = segments.findIndex(
      (segment, index) => index > uploadIndex && /^v\d+$/.test(segment)
    );
    const publicIdSegments = segments.slice(
      versionIndex === -1 ? uploadIndex + 1 : versionIndex + 1
    );
    if (publicIdSegments.length === 0) return null;

    const finalSegment = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = finalSegment.replace(
      /\.[^.]+$/,
      ""
    );
    return decodeURIComponent(publicIdSegments.join("/"));
  } catch {
    return null;
  }
};

const destroyImage = async (imageUrl: string): Promise<void> => {
  const publicId = getCloudinaryPublicId(imageUrl);
  if (!publicId || !isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.error("Cloudinary image cleanup failed:", error);
  }
};

const invalidateProductCache = async (productId: string): Promise<void> => {
  await cacheInvalidate("products:*");
  await cacheInvalidate(`product:${productId}`);
};

export const getProducts = async (query: ProductQuery): Promise<PaginatedResult> => {
  const page = query.page || 1;
  const limit = query.limit || 12;
  const skip = (page - 1) * limit;

  const cacheKey = `products:${JSON.stringify(query)}`;
  const cached = await cacheGet<PaginatedResult>(cacheKey);
  if (cached) return cached;

  const filter: any = { isActive: true };

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.subcategory) {
    filter.subcategory = query.subcategory;
  }
  if (query.condition) {
    filter.condition = query.condition;
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }

  let sortObj: any = { createdAt: -1 };
  if (query.sort === "price_asc") sortObj = { price: 1 };
  else if (query.sort === "price_desc") sortObj = { price: -1 };
  else if (query.sort === "rating") sortObj = { averageRating: -1 };
  else if (query.sort === "newest") sortObj = { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("seller", "name"),
    Product.countDocuments(filter),
  ]);

  const result: PaginatedResult = {
    products,
    total,
    page,
    pages: Math.ceil(total / limit),
  };

  await cacheSet(cacheKey, result, 300); // 5min
  return result;
};

export const getProductById = async (id: string): Promise<IProduct> => {
  const cacheKey = `product:${id}`;
  const cached = await cacheGet<IProduct>(cacheKey);
  if (cached) return cached;

  const product = await Product.findById(id).populate("seller", "name email");
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  await cacheSet(cacheKey, product, 600); // 10min
  return product;
};

export const createProduct = async (
  sellerId: string,
  data: Partial<IProduct>
): Promise<IProduct> => {
  const product = await Product.create({
    ...normalizeProductInput(data),
    seller: sellerId,
  });
  await cacheInvalidate("products:*");
  return product;
};

export const updateProduct = async (
  productId: string,
  sellerId: string,
  data: Partial<IProduct>
): Promise<IProduct> => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
  if (product.seller.toString() !== sellerId) {
    throw new ApiError(403, "Forbidden");
  }

  Object.assign(product, normalizeProductInput(data));
  await product.save();
  await cacheInvalidate("products:*");
  await cacheInvalidate(`product:${productId}`);
  return product;
};

export const deleteProduct = async (
  productId: string,
  sellerId: string
): Promise<void> => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
  if (product.seller.toString() !== sellerId) {
    throw new ApiError(403, "Forbidden");
  }

  product.isActive = false;
  await product.save();
  await cacheInvalidate("products:*");
  await cacheInvalidate(`product:${productId}`);
};

export const getSellerProducts = async (sellerId: string): Promise<IProduct[]> =>
  Product.find({ seller: sellerId, isActive: true }).sort({ createdAt: -1 });

export const getSellerProduct = async (
  productId: string,
  sellerId: string
): Promise<IProduct> => {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }
  if (product.seller.toString() !== sellerId) {
    throw new ApiError(403, "Forbidden");
  }
  return product;
};

export const addProductImages = async (
  productId: string,
  sellerId: string,
  files: Express.Multer.File[]
): Promise<IProduct> => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Image uploads are not configured");
  }
  if (files.length === 0) {
    throw new ApiError(400, "Select at least one image");
  }

  const product = await getSellerProduct(productId, sellerId);
  if (product.images.length + files.length > 7) {
    throw new ApiError(
      400,
      "A listing can have 1 cover image and up to 6 additional images"
    );
  }

  const urls = await Promise.all(files.map(uploadImage));
  product.images.push(...urls);
  await product.save();
  await invalidateProductCache(productId);
  return product;
};

export const replaceProductImage = async (
  productId: string,
  sellerId: string,
  imageIndex: number,
  file?: Express.Multer.File
): Promise<IProduct> => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Image uploads are not configured");
  }
  if (!file) throw new ApiError(400, "Select an image");

  const product = await getSellerProduct(productId, sellerId);
  if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= product.images.length) {
    throw new ApiError(404, "Image not found");
  }

  const oldImageUrl = product.images[imageIndex];
  const newImageUrl = await uploadImage(file);
  product.images[imageIndex] = newImageUrl;

  try {
    await product.save();
  } catch (error) {
    await destroyImage(newImageUrl);
    throw error;
  }

  await destroyImage(oldImageUrl);
  await invalidateProductCache(productId);
  return product;
};

export const deleteProductImage = async (
  productId: string,
  sellerId: string,
  imageIndex: number
): Promise<IProduct> => {
  const product = await getSellerProduct(productId, sellerId);
  if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= product.images.length) {
    throw new ApiError(404, "Image not found");
  }

  const [removedImageUrl] = product.images.splice(imageIndex, 1);
  await product.save();
  await destroyImage(removedImageUrl);
  await invalidateProductCache(productId);
  return product;
};

export const reorderProductImages = async (
  productId: string,
  sellerId: string,
  images: unknown
): Promise<IProduct> => {
  const product = await getSellerProduct(productId, sellerId);
  if (
    !Array.isArray(images) ||
    images.some((image) => typeof image !== "string") ||
    images.length !== product.images.length
  ) {
    throw new ApiError(400, "Images must contain every current image exactly once");
  }

  const current = [...product.images].sort();
  const requested = [...images].sort();
  if (current.some((image, index) => image !== requested[index])) {
    throw new ApiError(400, "Images must contain every current image exactly once");
  }

  product.images = images;
  await product.save();
  await invalidateProductCache(productId);
  return product;
};
