import React, { useState, useEffect } from 'react';
import { Building2, SlidersHorizontal, Save, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';

export const SettingsPage: React.FC = () => {
  const { organization, updateOrganizationState } = useAuth();
  const [threshold, setThreshold] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await api.settings.get();
        setThreshold(String(res.settings.defaultLowStockThreshold));
      } catch (err: any) {
        error(err.message || 'Failed to load organization settings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [error]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedThreshold = parseInt(threshold, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setErrorMsg('Default low stock threshold must be a non-negative integer (0 or greater).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.settings.update(parsedThreshold);
      updateOrganizationState({ defaultLowStockThreshold: res.settings.defaultLowStockThreshold });
      success('Default low-stock threshold updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Organization Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your organization inventory preferences and tenant configurations
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tenant Identity</h3>
            <p className="text-xs text-slate-500">Your organization metadata and isolation context</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Organization Name
            </span>
            <div className="text-sm font-bold text-slate-900">
              {organization?.name || 'Loading...'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Organization ID (Tenant ID)
            </span>
            <div className="text-xs font-mono font-medium text-slate-600 truncate" title={organization?.id}>
              {organization?.id || '—'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200/70">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Tenant data is isolated and protected by backend authorization.</span>
        </div>
      </div>

      {/* Inventory Low-Stock Rules Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Inventory Threshold Rules</h3>
            <p className="text-xs text-slate-500">Configure global default low-stock warnings</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 pt-2">
            {errorMsg && (
              <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="max-w-md">
              <Input
                label="Default Low-Stock Threshold"
                type="number"
                min="0"
                step="1"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                helperText="Used automatically for products that have no specific custom threshold defined."
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
