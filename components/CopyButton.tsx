'use client';

import { useCopy } from '@/hooks/useCopy';
import { cn } from '@/lib/utils/cn';
import Icon from './Icon';
import { buttonStyles } from './ui/button';

export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      className={buttonStyles({
        variant: 'ghost',
        size: 'sm',
        className: cn('min-w-21', copied && 'text-emerald-600 dark:text-emerald-400'),
      })}
      onClick={() => copy(text)}
      disabled={!text}
      aria-label={copied ? 'Copied' : label}
    >
      <Icon name={copied ? 'check' : 'copy'} />
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}
