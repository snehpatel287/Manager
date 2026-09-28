import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft';
export type ButtonSize = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-500/30';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  secondary:
    'border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800',
  ghost:
    'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  danger: 'border-transparent bg-red-600 text-white hover:bg-red-700',
  dangerSoft:
    'border-transparent bg-red-50 text-red-700 hover:border-red-300 dark:bg-red-950/60 dark:text-red-400 dark:hover:border-red-800',
};

const sizes: Record<ButtonSize, string> = {
  md: 'h-9.5 px-3.5 text-sm',
  sm: 'h-7.5 px-2.5 text-[13px]',
};

/** Class string for buttons — usable on <button> and <Link> alike. */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}
