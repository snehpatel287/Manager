import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

export const cardStyles =
  'rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900';

export default function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn(cardStyles, className)} {...props} />;
}
