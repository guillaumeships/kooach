'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useClipboard(timeout = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback(
    async (key: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedKey(key);
      toast.success('Copié dans le presse-papier');
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), timeout);
    },
    [timeout]
  );

  return { copiedKey, copy };
}
