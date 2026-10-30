import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { api } from '../../api/client';
import { Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();

  if (!product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.products.delete(product.id);
      success(`Product '${product.name}' removed from catalog.`);
      onSuccess(product.id);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Delete Product
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-700">
            Are you sure you want to delete{' '}
            <span className="font-bold text-slate-900">{product.name}</span> (SKU:{' '}
            <span className="font-mono">{product.sku}</span>)?
          </p>
          <p className="text-xs text-slate-500 mt-2">
            This action cannot be undone. All inventory records for this item will be permanently
            removed.
          </p>
        </div>
      </div>
    </Modal>
  );
};
