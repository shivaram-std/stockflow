import { Request, Response } from 'express';
import { Prisma, Product } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { CreateProductInput, UpdateProductInput, AdjustStockInput } from '../schemas/product.schema';

export async function getProducts(req: Request, res: Response): Promise<void> {
  const organizationId = req.user!.organizationId;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { defaultLowStockThreshold: true },
  });

  const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

  const whereClause: Prisma.ProductWhereInput = {
    organizationId,
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });

  const enrichedProducts = products.map((product: Product) => {
    const effectiveThreshold = product.lowStockThreshold ?? defaultThreshold;
    return {
      ...product,
      effectiveThreshold,
      isLowStock: product.quantityOnHand <= effectiveThreshold,
    };
  });

  res.json({
    products: enrichedProducts,
    total: enrichedProducts.length,
  });
}

export async function getProductById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { defaultLowStockThreshold: true },
  });

  const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

  const product = await prisma.product.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const effectiveThreshold = product.lowStockThreshold ?? defaultThreshold;

  res.json({
    product: {
      ...product,
      effectiveThreshold,
      isLowStock: product.quantityOnHand <= effectiveThreshold,
    },
  });
}

export async function createProduct(
  req: Request<{}, {}, CreateProductInput>,
  res: Response
): Promise<void> {
  const organizationId = req.user!.organizationId;
  const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } =
    req.body;

  const normalizedSku = sku.trim().toUpperCase();

  // Check unique SKU within organization
  const existingSku = await prisma.product.findFirst({
    where: {
      organizationId,
      sku: normalizedSku,
    },
  });

  if (existingSku) {
    res.status(409).json({ error: `A product with SKU '${normalizedSku}' already exists in your organization.` });
    return;
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { defaultLowStockThreshold: true },
  });

  const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

  const product = await prisma.product.create({
    data: {
      organizationId,
      name: name.trim(),
      sku: normalizedSku,
      description: description?.trim() || null,
      quantityOnHand,
      costPrice: costPrice !== undefined && costPrice !== null ? Number(costPrice) : null,
      sellingPrice: sellingPrice !== undefined && sellingPrice !== null ? Number(sellingPrice) : null,
      lowStockThreshold:
        lowStockThreshold !== undefined && lowStockThreshold !== null ? Number(lowStockThreshold) : null,
      lastUpdatedBy: req.user!.email,
    },
  });

  const effectiveThreshold = product.lowStockThreshold ?? defaultThreshold;

  res.status(201).json({
    message: 'Product created successfully',
    product: {
      ...product,
      effectiveThreshold,
      isLowStock: product.quantityOnHand <= effectiveThreshold,
    },
  });
}

export async function updateProduct(
  req: Request<{ id: string }, {}, UpdateProductInput>,
  res: Response
): Promise<void> {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!existingProduct) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } =
    req.body;

  let normalizedSku = existingProduct.sku;
  if (sku && sku.trim().toUpperCase() !== existingProduct.sku) {
    normalizedSku = sku.trim().toUpperCase();
    const duplicateSku = await prisma.product.findFirst({
      where: {
        organizationId,
        sku: normalizedSku,
        NOT: { id },
      },
    });

    if (duplicateSku) {
      res.status(409).json({ error: `A product with SKU '${normalizedSku}' already exists in your organization.` });
      return;
    }
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { defaultLowStockThreshold: true },
  });

  const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name: name ? name.trim() : existingProduct.name,
      sku: normalizedSku,
      description: description !== undefined ? (description?.trim() || null) : existingProduct.description,
      quantityOnHand: quantityOnHand !== undefined ? quantityOnHand : existingProduct.quantityOnHand,
      costPrice: costPrice !== undefined ? (costPrice !== null ? Number(costPrice) : null) : existingProduct.costPrice,
      sellingPrice: sellingPrice !== undefined ? (sellingPrice !== null ? Number(sellingPrice) : null) : existingProduct.sellingPrice,
      lowStockThreshold:
        lowStockThreshold !== undefined
          ? lowStockThreshold !== null
            ? Number(lowStockThreshold)
            : null
          : existingProduct.lowStockThreshold,
      lastUpdatedBy: req.user!.email,
    },
  });

  const effectiveThreshold = updatedProduct.lowStockThreshold ?? defaultThreshold;

  res.json({
    message: 'Product updated successfully',
    product: {
      ...updatedProduct,
      effectiveThreshold,
      isLowStock: updatedProduct.quantityOnHand <= effectiveThreshold,
    },
  });
}

export async function deleteProduct(req: Request<{ id: string }>, res: Response): Promise<void> {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!existingProduct) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  await prisma.product.delete({
    where: { id },
  });

  res.json({ message: 'Product deleted successfully', id });
}

export async function adjustStock(
  req: Request<{ id: string }, {}, AdjustStockInput>,
  res: Response
): Promise<void> {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;
  const { adjustment } = req.body;

  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!existingProduct) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const newQuantity = existingProduct.quantityOnHand + adjustment;
  if (newQuantity < 0) {
    res.status(400).json({
      error: `Cannot reduce stock below zero. Current stock is ${existingProduct.quantityOnHand}, attempted change is ${adjustment}.`,
    });
    return;
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { defaultLowStockThreshold: true },
  });

  const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      quantityOnHand: newQuantity,
      lastUpdatedBy: req.user!.email,
    },
  });

  const effectiveThreshold = updatedProduct.lowStockThreshold ?? defaultThreshold;

  res.json({
    message: `Stock adjusted by ${adjustment > 0 ? '+' + adjustment : adjustment} units`,
    product: {
      ...updatedProduct,
      effectiveThreshold,
      isLowStock: updatedProduct.quantityOnHand <= effectiveThreshold,
    },
  });
}
