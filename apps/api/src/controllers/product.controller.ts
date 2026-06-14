import { Request, Response, NextFunction } from "express";
import * as productService from "../services/product.service";

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      category,
      subcategory,
      condition,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
    } = req.query;

    const result = await productService.getProducts({
      search: search as string,
      category: category as string,
      subcategory: subcategory as string,
      condition: condition as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.getProductById(req.params.id as string);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.createProduct(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const getSellerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const products = await productService.getSellerProducts(req.user!.userId);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

export const getSellerProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.getSellerProduct(
      req.params.id as string,
      req.user!.userId
    );
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.updateProduct(
      req.params.id as string,
      req.user!.userId,
      req.body
    );
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await productService.deleteProduct(req.params.id as string, req.user!.userId);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

export const uploadImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.addProductImages(
      req.params.id as string,
      req.user!.userId,
      (req.files as Express.Multer.File[] | undefined) ?? []
    );
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
