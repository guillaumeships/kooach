'use client';

import { useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

interface NewsletterFormProps {
  source?: string;
  /** Variante compacte (pour le footer ou un encart inline) */
  compact?: boolean;
}

export function NewsletterForm({ source = 'unknown', compact = false }: NewsletterFormProps) {
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || status !== 'idle') return;

    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Une erreur est survenue.');
      }

      setStatus('success');
      track('newsletter_signup', { source });
      toast.success('Inscription confirmée !', {
        description: 'On t\'envoie un mail de bienvenue dans 1-2 minutes.',
      });
    } catch (err) {
      setStatus('idle');
      toast.error(err instanceof Error ? err.message : 'Erreur réseau, réessaye.');
    }
  }

  if (status === 'success') {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary-subtle px-4 py-3 text-[14px] font-medium text-primary',
          compact ? '' : 'sm:px-6 sm:py-4 sm:text-[15px]',
        )}
      >
        <Check className="h-4 w-4" />
        Inscrit ✓ — vérifie ta boîte mail dans 1-2 min
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex w-full flex-col gap-3',
        compact ? 'sm:flex-row sm:gap-2' : 'sm:flex-row sm:gap-3',
      )}
    >
      <Input
        type="email"
        placeholder="ton@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading'}
        required
        aria-label="Email pour s'inscrire à Kooach Insider"
        className="h-11"
      />
      <Button
        type="submit"
        disabled={!isValid || status === 'loading'}
        leftIcon={status === 'loading' ? Loader2 : Mail}
        className={cn(
          'shrink-0',
          compact ? 'h-11' : 'h-11 sm:h-12',
          isValid && status === 'idle' && 'kk-glow-ready',
        )}
      >
        {status === 'loading' ? 'Inscription…' : compact ? "S'inscrire" : "Je m'inscris"}
      </Button>
    </form>
  );
}
