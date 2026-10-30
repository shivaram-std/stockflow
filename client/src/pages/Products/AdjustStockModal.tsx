import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../api/client';
import { Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface AdjustStockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Product) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [adjustmentStr, setAdjustmentStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success } = useToast();

  if (!product) return null;

  const adjustment = parseInt(adjustmentStr, 10) || 0;
  const projectedQuantity = product.quantityOnHand + adjustment;
  const isNegativeResult = projectedQuantity < 0;

  const handleClose = () => {
    setAdjustmentStr('');
    setNote('');
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (adjustment === 0) {
      setErrorMsg('Please enter a non-zero adjustment value (e.g. +5 or -2).');
      return;
    }

    if (isNegativeResult) {
      setErrorMsg(
        `Cannot reduce stock below 0. Current stock is ${product.quantityOnHand}, adjustment is ${adjustment}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.products.adjustStock(product.id, adjustment, note.trim() || undefined);
      success(result.message);
      onSuccess(result.product);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adjust Stock Quantity"
      description={`Quick stock in/out for ${product.name} (${product.sku})`}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="adjust-stock-form"
            isLoading={isSubmitting}
            disabled={adjustment === 0 || isNegativeResult}
          >
            Apply Adjustment
          </Button>
        </>
      }
    >
      <form id="adjust-stock-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stock Level Preview Calculation */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Current
            </span>
            <span className="text-xl font-bold text-slate-800">{product.quantityOnHand}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-sm font-bold">
              {adjustment > 0 ? `+${adjustment}` : adjustment}
            </span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              New Level
            </span>
            <span
              className={`text-xl font-black ${
                isNegativeResult ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {projectedQuantity}
            </span>
          </div>
        </div>

        <Input
          label="Stock Adjustment (+/- Units)"
          type="number"
          step="1"
          required
          autoFocus
          placeholder="e.g. +10 or -3"
          value={adjustmentStr}
          onChange={(e) => setAdjustmentStr(e.target.value)}
          helperText="Enter positive number to add stock, negative to deduct"
        />

        <Input
          label="Reason / Note"
          placeholder="e.g., Supplier shipment, damaged goods"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </form>
    </Modal>
  );
};
