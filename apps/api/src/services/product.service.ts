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
  if (product.images.length + files.length > 4) {
    throw new ApiError(400, "A listing can have at most 4 images");
  }

  const urls = await Promise.all(files.map(uploadImage));
  product.images.push(...urls);
  await product.save();
  await cacheInvalidate("products:*");
  await cacheInvalidate(`product:${productId}`);
  return product;
};
