'use client';

import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { toast } from 'sonner';

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

/**
 * Bandeau soft affiché dans /app/* si l'email du user n'est pas encore confirmé.
 *
 * Politique 2026-05-21 : on n'oblige PAS la confirmation pour entrer dans
 * l'app (cf. décision insights conversion landing — erreur "email gating").
 * À la place, on affiche ce bandeau non-bloquant pendant 48h et on laisse
 * l'user resend le mail s'il veut.
 *
 * Le composant est dismissable (sessionStorage) pour ne pas être agressif.
 */
export function EmailConfirmationBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('kk_email_banner_dismissed') === '1';
  });
  const [resending, setResending] = useState(false);

  if (dismissed) return null;

  async function handleResend() {
    setResending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        },
      });
      if (error) throw error;
      toast.success('Email de confirmation renvoyé. Check tes spams si tu vois rien.');
    } catch (e) {
      toast.error("Impossible de renvoyer l'email pour le moment. Réessaie plus tard.");
    } finally {
      setResending(false);
    }
  }

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('kk_email_banner_dismissed', '1');
    }
    setDismissed(true);
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 shrink-0" />
          <span>
            Pense à valider ton email <strong>{email}</strong> sous 48h pour sécuriser ton compte.
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="rounded-md px-2 py-1 text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50"
          >
            {resending ? 'Envoi…' : 'Renvoyer le mail'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer"
            className="rounded-md p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
