'use client';

import { useEffect, useState, useTransition } from 'react';
import { checkEntryStatusesAction, type StatusCheckSummary } from '@/app/actions';
import { cn } from '@/lib/utils/cn';
import Icon from './Icon';
import { buttonStyles, type ButtonSize, type ButtonVariant } from './ui/button';

interface CheckStatusButtonProps {
  entryIds: string[];
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function describe(s: StatusCheckSummary): { text: string; error: boolean } {
  if (s.error) return { text: s.error, error: true };
  const parts = [`Checked ${s.checked}`];
  parts.push(s.changed ? `${s.changed} status${s.changed > 1 ? 'es' : ''} changed` : 'no changes');
  if (s.failed) parts.push(`${s.failed} couldn't be checked`);
  return { text: parts.join(' · '), error: false };
}

/** Checks the given entries against Reddit and shows the outcome as a toast. */
export default function CheckStatusButton({
  entryIds,
  label = 'Check on Reddit',
  variant = 'secondary',
  size = 'md',
}: CheckStatusButtonProps) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.error ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const run = () =>
    startTransition(async () => {
      try {
        setToast(describe(await checkEntryStatusesAction(entryIds)));
      } catch {
        setToast({ text: 'Check failed — please try again.', error: true });
      }
    });

  return (
    <>
      <button
        type="button"
        className={buttonStyles({ variant, size })}
        onClick={run}
        disabled={pending || entryIds.length === 0}
      >
        <Icon name="refresh" className={cn(pending && 'animate-spin')} />
        {pending ? 'Checking…' : label}
      </button>
      {toast && (
        <div
          role="status"
          className={cn(
            'fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-[fade_.15s_ease-out] rounded-lg px-4 py-3 text-sm shadow-lg',
            toast.error
              ? 'bg-red-600 text-white'
              : 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
          )}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}
