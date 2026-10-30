import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../api/client';
import { Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AlertCircle } from 'lucide-react';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Product) => void;
  defaultThreshold: number;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
  defaultThreshold,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantityOnHand, setQuantityOnHand] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success } = useToast();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setDescription(product.description || '');
      setQuantityOnHand(product.quantityOnHand);
      setCostPrice(product.costPrice !== null ? String(product.costPrice) : '');
      setSellingPrice(product.sellingPrice !== null ? String(product.sellingPrice) : '');
      setLowStockThreshold(
        product.lowStockThreshold !== null ? String(product.lowStockThreshold) : ''
      );
      setErrorMsg(null);
    }
  }, [product]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    if (!sku.trim()) {
      setErrorMsg('SKU is required.');
      return;
    }

    if (quantityOnHand < 0) {
      setErrorMsg('Quantity on hand cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim() || null,
        quantityOnHand: Number(quantityOnHand),
        costPrice: costPrice !== '' ? Number(costPrice) : null,
        sellingPrice: sellingPrice !== '' ? Number(sellingPrice) : null,
        lowStockThreshold: lowStockThreshold !== '' ? Number(lowStockThreshold) : null,
      };

      const result = await api.products.update(product.id, payload);
      success(`Product '${result.product.name}' updated!`);
      onSuccess(result.product);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Product"
      description={`Update fields for SKU: ${product.sku}`}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="edit-product-form" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="SKU"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-400"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Quantity on Hand"
            type="number"
            min="0"
            step="1"
            required
            value={quantityOnHand}
            onChange={(e) => setQuantityOnHand(parseInt(e.target.value, 10) || 0)}
          />

          <Input
            label="Cost Price (₹)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />

          <Input
            label="Selling Price (₹)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <Input
            label="Custom Low-Stock Threshold"
            type="number"
            min="0"
            step="1"
            placeholder={`Using org default (${defaultThreshold})`}
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            helperText={`Leave empty to inherit organization default threshold (${defaultThreshold})`}
          />
        </div>
      </form>
    </Modal>
  );
};
