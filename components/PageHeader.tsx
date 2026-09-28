import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon from './Icon';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, backHref, backLabel, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <Icon name="arrowLeft" /> {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">{title}</h1>
          {description && <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        {actions && <div className="flex w-full gap-2 *:flex-1 sm:w-auto sm:*:flex-none">{actions}</div>}
      </div>
    </div>
  );
}
