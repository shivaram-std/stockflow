import { prisma } from './prisma';
import { hashPassword } from './auth';

export const DEMO_EMAIL = 'demo@stockflow.com';
export const DEMO_PASSWORD = 'DemoUser123!';
export const DEMO_ORG_NAME = 'StockFlow Demo Retail';

export const DEMO_PRODUCTS = [
  {
    name: 'Ergonomic Office Chair',
    sku: 'FURN-CHAIR-01',
    description: 'Ergonomic high-back mesh chair with adjustable lumbar support',
    quantityOnHand: 4, // Low stock: 4 <= 5
    costPrice: 4500.0,
    sellingPrice: 8999.0,
    lowStockThreshold: 5,
  },
  {
    name: 'Wireless Mechanical Keyboard',
    sku: 'TECH-KB-RGB',
    description: 'Hot-swappable RGB mechanical keyboard with tactile switches',
    quantityOnHand: 2, // Low stock: 2 <= 8 (custom threshold)
    costPrice: 2200.0,
    sellingPrice: 4499.0,
    lowStockThreshold: 8,
  },
  {
    name: 'UltraWide 34-inch Monitor',
    sku: 'DISP-UW-34',
    description: 'WQHD 144Hz curved productivity and workstation display',
    quantityOnHand: 15, // In stock: 15 > 5
    costPrice: 28000.0,
    sellingPrice: 39999.0,
    lowStockThreshold: 5,
  },
  {
    name: 'USB-C Multi-Port Hub',
    sku: 'ACC-HUB-07',
    description: '7-in-1 4K HDMI, SD reader, and 100W PD pass-through adapter',
    quantityOnHand: 3, // Low stock: 3 <= 10 (custom threshold)
    costPrice: 850.0,
    sellingPrice: 1899.0,
    lowStockThreshold: 10,
  },
  {
    name: 'Noise-Cancelling Headphones',
    sku: 'AUD-NC-HEAD',
    description: 'Active noise cancelling wireless over-ear Bluetooth headphones',
    quantityOnHand: 22, // In stock: 22 > 5
    costPrice: 6500.0,
    sellingPrice: 12499.0,
    lowStockThreshold: 5,
  },
  {
    name: 'Standing Desk Anti-Fatigue Mat',
    sku: 'FURN-MAT-02',
    description: 'High-density ergonomic cushioning mat for standing desks',
    quantityOnHand: 18, // In stock: 18 > 5
    costPrice: 1100.0,
    sellingPrice: 2299.0,
    lowStockThreshold: 5,
  },
  {
    name: 'Adjustable Laptop Riser',
    sku: 'ACC-STAND-01',
    description: 'Foldable aluminum ventilated desk riser for laptops',
    quantityOnHand: 7, // In stock: 7 > org default 5
    costPrice: 950.0,
    sellingPrice: 1799.0,
    lowStockThreshold: null,
  },
];

export async function ensureDemoAccount() {
  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { organization: true },
  });

  if (existingUser) {
    const productCount = await prisma.product.count({
      where: { organizationId: existingUser.organizationId },
    });

    if (productCount === 0) {
      await prisma.product.createMany({
        data: DEMO_PRODUCTS.map((p) => ({
          ...p,
          organizationId: existingUser.organizationId,
          lastUpdatedBy: DEMO_EMAIL,
        })),
      });
    }

    return {
      user: existingUser,
      organization: existingUser.organization,
    };
  }

  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  const org = await prisma.organization.create({
    data: {
      name: DEMO_ORG_NAME,
      defaultLowStockThreshold: 5,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: hashedPassword,
      organizationId: org.id,
    },
    include: { organization: true },
  });

  await prisma.product.createMany({
    data: DEMO_PRODUCTS.map((p) => ({
      ...p,
      organizationId: org.id,
      lastUpdatedBy: DEMO_EMAIL,
    })),
  });

  return { user, organization: org };
}
