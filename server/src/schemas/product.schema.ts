import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z.string().trim().min(1, 'SKU is required'),
  description: z.string().trim().optional().nullable(),
  quantityOnHand: z.coerce.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').default(0),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional().nullable(),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').optional().nullable(),
  lowStockThreshold: z.coerce.number().int('Low stock threshold must be an integer').min(0, 'Threshold cannot be negative').optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name cannot be empty').optional(),
  sku: z.string().trim().min(1, 'SKU cannot be empty').optional(),
  description: z.string().trim().optional().nullable(),
  quantityOnHand: z.coerce.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').optional(),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional().nullable(),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').optional().nullable(),
  lowStockThreshold: z.coerce.number().int('Low stock threshold must be an integer').min(0, 'Threshold cannot be negative').optional().nullable(),
});

export const adjustStockSchema = z.object({
  adjustment: z.coerce.number().int('Adjustment must be an integer (e.g., +5 or -3)'),
  note: z.string().trim().optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
