import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Boxes, AlertTriangle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { DashboardData } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton, TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { error } = useToast();

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const result = await api.dashboard.getStats();
      setData(result);
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [error]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {data ? data.organizationName : 'Inventory Overview'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Global default low-stock threshold:{' '}
            <span className="font-semibold text-slate-700">
              {data ? `${data.defaultLowStockThreshold} units` : '...'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
          <Link to="/products">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <div className="text-3xl font-black text-slate-900 mt-1">
                {data?.stats.totalProducts ?? 0}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Active catalog items</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Inventory Units */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Stock Units
            </span>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <div className="text-3xl font-black text-slate-900 mt-1">
                {data?.stats.totalInventory ?? 0}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Sum of quantity on hand</p>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className={`bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between ${
            (data?.stats.lowStockCount ?? 0) > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
          }`}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low-Stock Alerts
            </span>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <div
                className={`text-3xl font-black mt-1 ${
                  (data?.stats.lowStockCount ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {data?.stats.lowStockCount ?? 0}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Items at or below threshold</p>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              (data?.stats.lowStockCount ?? 0) > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {(data?.stats.lowStockCount ?? 0) > 0 ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* Low-Stock Items Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Low-Stock Inventory Alerts</span>
              {data && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
                  {data.lowStockItems.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Items requiring replenishment based on custom or organization default thresholds
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" size="sm">
              Manage Catalog
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} columns={5} />
          </div>
        ) : !data || data.stats.totalProducts === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Products in Inventory</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
              Your organization catalog is empty. Add products to track stock levels, calculate inventory, and monitor low-stock warnings.
            </p>
            <Link to="/products">
              <Button variant="primary" size="sm" leftIcon={<Package className="w-4 h-4" />}>
                Add Products
              </Button>
            </Link>
          </div>
        ) : data.lowStockItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">All Stock Levels Healthy</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All {data.stats.totalProducts} products are currently above their low-stock thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Product Name</th>
                  <th className="py-3 px-6 whitespace-nowrap">SKU</th>
                  <th className="py-3 px-6 text-center whitespace-nowrap">Qty on Hand</th>
                  <th className="py-3 px-6 text-center whitespace-nowrap">Threshold</th>
                  <th className="py-3 px-6 text-right whitespace-nowrap">Selling Price (₹)</th>
                  <th className="py-3 px-6 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <Link
                        to="/products"
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200/70 inline-block whitespace-nowrap">
                        {item.sku}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 inline-block whitespace-nowrap">
                        {item.quantityOnHand} units
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center text-xs text-slate-500 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{item.effectiveThreshold}</span>
                      {item.lowStockThreshold === null ? (
                        <span className="text-[10px] text-slate-400 block">(Org default)</span>
                      ) : (
                        <span className="text-[10px] text-indigo-500 block">(Custom)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-medium text-slate-900 whitespace-nowrap">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <Badge variant="danger" dot>
                        Low Stock
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
