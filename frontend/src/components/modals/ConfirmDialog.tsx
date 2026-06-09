import { useAppStore } from '@/store/useAppStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function ConfirmDialog() {
  const { confirmDialog, clearConfirm } = useAppStore();

  if (!confirmDialog) return null;

  const handleConfirm = async () => {
    await confirmDialog.onConfirm();
    clearConfirm();
  };

  return (
    <Modal isOpen onClose={clearConfirm} title={confirmDialog.title} size="sm">
      <p className="text-sm text-gray-400 mb-5">{confirmDialog.message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={clearConfirm}>
          Cancel
        </Button>
        <Button
          variant={confirmDialog.variant === 'danger' ? 'danger' : 'primary'}
          onClick={handleConfirm}
        >
          {confirmDialog.confirmLabel ?? 'Confirm'}
        </Button>
      </div>
    </Modal>
  );
}
