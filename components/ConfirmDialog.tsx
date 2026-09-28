'use client';

import { useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import { buttonStyles } from './ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-title" role="alertdialog">
      <h3 id="confirm-title" className="text-[17px] font-semibold">
        {title}
      </h3>
      {message && <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button ref={cancelRef} type="button" className={buttonStyles({ variant: 'secondary' })} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={buttonStyles({ variant: danger ? 'danger' : 'primary' })}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
