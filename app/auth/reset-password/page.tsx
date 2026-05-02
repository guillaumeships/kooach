'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || password !== confirm) return;
    setLoading(true);
    setError('');
    const { error: authError } = await createSupabaseBrowserClient().auth.updateUser({
      password,
    });
    if (authError) {
      setError('Le lien a peut-être expiré. Demande un nouveau lien.');
      setLoading(false);
      return;
    }
    router.push('/app');
    router.refresh();
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisis un nouveau mot de passe (8 caractères minimum)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-pw">Nouveau mot de passe</Label>
          <Input
            id="new-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            disabled={loading}
            autoComplete="new-password"
            autoFocus
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Confirme</Label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            disabled={loading}
            autoComplete="new-password"
            required
          />
        </div>

        {confirm && password !== confirm && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Les mots de passe ne correspondent pas.
          </div>
        )}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          block
          size="lg"
          type="submit"
          loading={loading}
          disabled={password.length < 8 || password !== confirm}
        >
          Mettre à jour mon mot de passe
        </Button>
      </form>
    </AuthShell>
  );
}
