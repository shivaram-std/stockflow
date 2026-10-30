import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  Boxes,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { Product } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { AddProductModal } from './AddProductModal';
import { EditProductModal } from './EditProductModal';
import { AdjustStockModal } from './AdjustStockModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'normal'>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { organization } = useAuth();
  const { error } = useToast();

  const defaultThreshold = organization?.defaultLowStockThreshold ?? 5;

  const fetchProducts = useCallback(
    async (search?: string) => {
      setIsLoading(true);
      try {
        const res = await api.products.list(search);
        setProducts(res.products);
      } catch (err: any) {
        error(err.message || 'Failed to fetch products.');
      } finally {
        setIsLoading(false);
      }
    },
    [error]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery.trim() || undefined);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  // Client-side status filtering on top of server search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === 'low_stock') return p.isLowStock;
      if (statusFilter === 'normal') return !p.isLowStock;
      return true;
    });
  }, [products, statusFilter]);

  // Handlers for modal callbacks
  const handleProductCreated = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleProductUpdated = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Inventory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {products.length} products total in your catalog
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">
            Status:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Low Stock ({products.filter((p) => p.isLowStock).length})
          </button>
          <button
            onClick={() => setStatusFilter('normal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'normal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Normal ({products.filter((p) => !p.isLowStock).length})
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts(searchQuery.trim() || undefined)}
            className="ml-auto"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No matching products found' : 'No products in inventory yet'}
            description={
              searchQuery
                ? `No items match the search query "${searchQuery}". Try a different term or clear filters.`
                : 'Get started by adding your first product with SKU, quantity, and pricing.'
            }
            icon={<Package className="w-8 h-8" />}
            actionLabel={searchQuery ? 'Clear Search' : 'Add First Product'}
            onAction={searchQuery ? () => setSearchQuery('') : () => setIsAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 w-auto min-w-[220px]">Product & Description</th>
                  <th className="py-3 px-6 w-36 min-w-[130px] whitespace-nowrap">SKU</th>
                  <th className="py-3 px-6 w-32 min-w-[120px] text-center whitespace-nowrap">Quantity</th>
                  <th className="py-3 px-6 w-28 min-w-[110px] text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-6 w-32 min-w-[110px] text-right whitespace-nowrap">Cost Price (₹)</th>
                  <th className="py-3 px-6 w-32 min-w-[110px] text-right whitespace-nowrap">Selling Price (₹)</th>
                  <th className="py-3 px-6 w-36 min-w-[130px] text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Description */}
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-slate-900">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-slate-400 truncate mt-0.5" title={product.description}>
                          {product.description}
                        </div>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200/70 inline-block whitespace-nowrap">
                        {product.sku}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span
                        className={`text-sm font-black px-2.5 py-1 rounded-xl inline-block whitespace-nowrap ${
                          product.isLowStock
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : 'text-slate-800 bg-slate-100'
                        }`}
                      >
                        {product.quantityOnHand} units
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                        Threshold: {product.effectiveThreshold}
                        {product.lowStockThreshold === null && ' (org)'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      {product.isLowStock ? (
                        <Badge variant="danger" dot>
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success" dot>
                          In Stock
                        </Badge>
                      )}
                    </td>

                    {/* Cost Price */}
                    <td className="py-4 px-6 text-right font-medium text-slate-600 whitespace-nowrap">
                      {formatCurrency(product.costPrice)}
                    </td>

                    {/* Selling Price */}
                    <td className="py-4 px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(product.sellingPrice)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAdjustingProduct(product)}
                          title="Quick Stock In / Out"
                          leftIcon={<Boxes className="w-3.5 h-3.5 text-indigo-600" />}
                        >
                          Stock
                        </Button>
                        <button
                          onClick={() => setEditingProduct(product)}
                          title="Edit Product"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          title="Delete Product"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleProductCreated}
        defaultThreshold={defaultThreshold}
      />

      <EditProductModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={handleProductUpdated}
        defaultThreshold={defaultThreshold}
      />

      <AdjustStockModal
        product={adjustingProduct}
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onSuccess={handleProductUpdated}
      />

      <DeleteConfirmModal
        product={deletingProduct}
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onSuccess={handleProductDeleted}
      />
    </div>
  );
};
