'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';

/** Copies text and flips `copied` to true for `resetMs`, then back. */
export function useCopy(resetMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      if (!ok) return false;
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
      return true;
    },
    [resetMs],
  );

  return { copied, copy };
}
