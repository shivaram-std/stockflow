import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../api/client';
import { Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AlertCircle } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  defaultThreshold: number;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
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

  const resetForm = () => {
    setName('');
    setSku('');
    setDescription('');
    setQuantityOnHand(0);
    setCostPrice('');
    setSellingPrice('');
    setLowStockThreshold('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

      const result = await api.products.create(payload);
      success(`Product '${result.product.name}' added successfully!`);
      onSuccess(result.product);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Product"
      description="Create a product in your organization inventory catalog"
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-product-form" isLoading={isSubmitting}>
            Create Product
          </Button>
        </>
      }
    >
      <form id="add-product-form" onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="e.g. Wireless Ergonomic Mouse"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="SKU"
            required
            placeholder="e.g. MOUSE-WL-01"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            helperText="Unique identifier within your organization"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-400"
            placeholder="Brief product notes or specs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Initial Quantity"
            type="number"
            min="0"
            step="1"
            required
            placeholder="0"
            value={quantityOnHand}
            onChange={(e) => setQuantityOnHand(parseInt(e.target.value, 10) || 0)}
          />

          <Input
            label="Cost Price ($)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />

          <Input
            label="Selling Price ($)"
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
            placeholder={`Leave empty to use org default (${defaultThreshold})`}
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            helperText={`If blank, triggers alert when stock drops to or below ${defaultThreshold} units`}
          />
        </div>
      </form>
    </Modal>
  );
};
