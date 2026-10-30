import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const organizationId = req.user!.organizationId;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { defaultLowStockThreshold: true, name: true },
  });

  const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

  const products = await prisma.product.findMany({
    where: { organizationId },
    orderBy: { updatedAt: 'desc' },
  });

  const totalProducts = products.length;
  let totalInventory = 0;
  const lowStockItems: any[] = [];

  for (const product of products) {
    totalInventory += product.quantityOnHand;
    const effectiveThreshold = product.lowStockThreshold ?? defaultThreshold;
    if (product.quantityOnHand <= effectiveThreshold) {
      lowStockItems.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantityOnHand: product.quantityOnHand,
        lowStockThreshold: product.lowStockThreshold,
        effectiveThreshold,
        sellingPrice: product.sellingPrice,
      });
    }
  }

  res.json({
    organizationName: org?.name || '',
    defaultLowStockThreshold: defaultThreshold,
    stats: {
      totalProducts,
      totalInventory,
      lowStockCount: lowStockItems.length,
    },
    lowStockItems,
  });
}
