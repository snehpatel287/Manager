'use client';

import { useState, useTransition } from 'react';
import { updateEntryStatusAction } from '@/app/actions';
import type { EntryStatus } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const OPTIONS: { value: EntryStatus; label: string; active: string }[] = [
  { value: 'live', label: 'Live', active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  { value: 'removed', label: 'Removed', active: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' },
];

/** Live / Removed toggle that saves as soon as it's clicked. */
export default function StatusSwitch({
  entryId,
  status: initial,
  reason,
}: {
  entryId: string;
  status: EntryStatus;
  reason?: string;
}) {
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const choose = (next: EntryStatus) => {
    if (next === status || pending) return;
    const previous = status;
    setStatus(next); // show it right away; undone below if saving fails
    setError(null);
    startTransition(async () => {
      try {
        await updateEntryStatusAction(entryId, next);
      } catch (e) {
        setStatus(previous);
        setError(e instanceof Error ? e.message : 'Could not change status');
      }
    });
  };

  return (
    <span className="flex flex-col gap-1">
      <span
        role="radiogroup"
        aria-label="Status"
        title={reason}
        className={cn(
          'inline-flex w-fit rounded-full border border-gray-200 p-0.5 dark:border-gray-700',
          pending && 'opacity-70',
        )}
      >
        {OPTIONS.map((o) => {
          const selected = o.value === status;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(o.value)}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                selected
                  ? o.active
                  : 'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200',
              )}
            >
              {selected && <span className="size-1.5 rounded-full bg-current" />}
              {o.label}
            </button>
          );
        })}
      </span>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}
