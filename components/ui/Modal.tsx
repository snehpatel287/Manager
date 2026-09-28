'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
}

/** Backdrop + centered panel. Closes on Escape or backdrop click. */
export default function Modal({ open, onClose, labelledBy, role = 'dialog', children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid animate-[fade_.12s_ease-out] place-items-center bg-gray-950/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-105 rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
