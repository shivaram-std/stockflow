export interface Organization {
  id: string;
  name: string;
  defaultLowStockThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  organizationId: string;
  organization: Organization;
  createdAt?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  description: string | null;
  quantityOnHand: number;
  costPrice: number | null;
  sellingPrice: number | null;
  lowStockThreshold: number | null;
  effectiveThreshold: number;
  isLowStock: boolean;
  lastUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalInventory: number;
  lowStockCount: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  lowStockThreshold: number | null;
  effectiveThreshold: number;
  sellingPrice: number | null;
}

export interface DashboardData {
  organizationName: string;
  defaultLowStockThreshold: number;
  stats: DashboardStats;
  lowStockItems: LowStockItem[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
