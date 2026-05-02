'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

/**
 * Bouton Google OAuth via Supabase.
 * Redirige vers le callback Supabase qui crée la session et nous renvoie sur `next`.
 *
 * Prérequis Supabase : Auth → Providers → Google → activer + clientId/secret.
 * Voir https://supabase.com/docs/guides/auth/social-login/auth-google
 */
export function GoogleButton({ next = '/app' }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        toast.error('Connexion Google impossible : ' + error.message);
        setLoading(false);
      }
      // Sinon le browser redirige vers Google → on reste en loading
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur Google');
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      block
      size="lg"
      loading={loading}
      onClick={handleClick}
    >
      <GoogleIcon className="h-4 w-4" />
      Continuer avec Google
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.708V4.96H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.04l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.165 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
