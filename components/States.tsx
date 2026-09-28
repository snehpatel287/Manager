import type { ReactNode } from 'react';
import Icon from './Icon';

const boxed =
  'rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900';
const layout = 'flex flex-col items-center justify-center gap-2.5 px-5 py-14 text-center';

export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={layout} role="status">
      <span className="size-6 animate-spin rounded-full border-3 border-gray-200 border-t-indigo-600 dark:border-gray-800 dark:border-t-indigo-400" />
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${layout} ${boxed}`}>
      <Icon name="inbox" size={28} className="text-gray-400" />
      <strong>{title}</strong>
      {message && <p className="text-gray-500 dark:text-gray-400">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, action }: { message?: string; action?: ReactNode }) {
  return (
    <div className={`${layout} ${boxed}`}>
      <strong>Something went wrong</strong>
      {message && <p className="text-gray-500 dark:text-gray-400">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
