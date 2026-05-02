'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
// import { GoogleButton } from '@/components/auth/google-button'; // re-enable avec credentials Google
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Separator } from '@/components/ui/separator';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (authError) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Se connecter"
      description="Bon retour. Connecte-toi pour générer ton contenu."
      footer={
        <div className="space-y-2.5">
          <p className="text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Crée-en un
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/70">
            Tu n&apos;as pas de mot de passe (ancien compte) ?{' '}
            <Link href="/recover-access" className="underline hover:text-foreground">
              Recevoir un lien magique
            </Link>
          </p>
        </div>
      }
    >
      {/* Google OAuth — commenté tant que les credentials Google Cloud ne sont
          pas configurées. Voir CONTEXT.md section "Google OAuth — à finir". */}
      {/*
      <GoogleButton />
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          ou
        </span>
      </div>
      */}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              href="/forgot-password"
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              Oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </div>

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
          disabled={!email.trim() || !password}
        >
          Se connecter
        </Button>
      </form>
    </AuthShell>
  );
}
