'use client';

import { ErrorState } from '@/components/States';
import { buttonStyles } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      message={error.message}
      action={
        <button type="button" className={buttonStyles()} onClick={reset}>
          Try again
        </button>
      }
    />
  );
}
