'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await createSupabaseBrowserClient().auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    );
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <AuthShell title="C'est envoyé" description="">
        <div className="text-center">
          <p className="m-0 mb-3 text-[15px] leading-relaxed text-muted-foreground">
            Si un compte existe avec <strong className="text-foreground">{email}</strong>, un
            lien pour réinitialiser ton mot de passe vient d&apos;être envoyé.
          </p>
          <p className="m-0 text-xs text-muted-foreground/70">Pense à vérifier tes spams.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Entre ton email. On t'envoie un lien pour définir un nouveau mot de passe."
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          ← Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            disabled={loading}
            autoFocus
            required
          />
        </div>
        <Button block size="lg" type="submit" loading={loading} disabled={!email.trim()}>
          Envoyer le lien
        </Button>
      </form>
    </AuthShell>
  );
}
