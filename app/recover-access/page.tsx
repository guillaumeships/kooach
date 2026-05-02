'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RecoverAccessPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/recover-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="C'est envoyé" description="">
        <div className="text-center">
          <p className="m-0 mb-3 text-[15px] leading-relaxed text-muted-foreground">
            Si <strong className="text-foreground">{email}</strong> correspond à un compte
            Kooach actif, tu vas recevoir un email avec un nouveau lien d&apos;accès dans les
            prochaines minutes.
          </p>
          <p className="m-0 text-xs text-muted-foreground/70">
            Pense à vérifier tes spams. Le lien est valable 30 jours.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Retrouver mon accès"
      description="Entre l'email associé à ton compte. Si un compte actif existe, tu vas recevoir un nouveau lien d'accès dans quelques instants."
      footer={
        <p className="text-xs text-muted-foreground">
          Tu n&apos;as jamais créé de compte ?{' '}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Découvre Kooach
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="recover-email">Email</Label>
          <Input
            id="recover-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            disabled={loading}
            autoFocus
            required
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button block size="lg" type="submit" loading={loading} disabled={!email.trim()}>
          Recevoir un nouveau lien
        </Button>
      </form>
    </AuthShell>
  );
}
