import type { EntryStatus } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const STYLES: Record<EntryStatus, { label: string; className: string }> = {
  live: {
    label: 'Live',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  removed: {
    label: 'Removed',
    className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  },
};

export default function StatusBadge({ status, reason }: { status: EntryStatus; reason?: string }) {
  const { label, className } = STYLES[status];
  return (
    <span
      title={reason}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
