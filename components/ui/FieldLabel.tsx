import type { ReactNode } from 'react';

export default function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {children}
    </span>
  );
}
