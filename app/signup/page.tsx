'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

import { AuthShell } from '@/components/auth/auth-shell';
// import { GoogleButton } from '@/components/auth/google-button'; // re-enable avec credentials Google
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Separator } from '@/components/ui/separator';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 8) return;
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // emailRedirectTo reste défini pour le cas où Supabase Auth aurait
        // "Confirm email" activé (ancien comportement, fallback).
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/signup/checkout`,
      },
    });

    if (authError) {
      const code = authError.message.toLowerCase();
      if (code.includes('already registered') || code.includes('already exists')) {
        setError('Un compte existe déjà avec cet email. Connecte-toi à la place.');
      } else if (code.includes('password')) {
        setError('Le mot de passe doit contenir au moins 8 caractères.');
      } else {
        setError('Une erreur est survenue. Réessaie.');
      }
      setLoading(false);
      return;
    }

    // Anti-énumération : Supabase ne renvoie pas d'erreur si le compte existe,
    // mais data.user.identities = [] dans ce cas.
    if (
      data?.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      setError('Un compte existe déjà avec cet email. Connecte-toi à la place.');
      setLoading(false);
      return;
    }

    // Si "Confirm email" est désactivé côté Supabase Dashboard, signUp() crée
    // une session active immédiatement → on initialise le profil (trial 7j
    // sans CB) puis on push direct dans /app.
    // Si "Confirm email" est encore activé (fallback), on affiche l'écran
    // "vérifie ta boîte mail" comme avant.
    if (data?.session) {
      // Initialise le profil DB avec trial_end = now+7d (no-CC trial Phase M1-3).
      // Si l'appel échoue, on log mais on push quand même (le profil sera
      // recréé au prochain accès /app ou lors du checkout Stripe).
      try {
        await fetch('/api/profile/init', { method: 'POST', credentials: 'include' });
      } catch (e) {
        console.error('signup: profile/init failed —', e);
      }
      router.push('/app');
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <AuthShell title="Vérifie ta boîte mail" description="">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-primary">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <p className="mx-auto mb-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Un email de confirmation vient d&apos;être envoyé à{' '}
            <strong className="text-foreground">{email}</strong>. Clique sur le lien pour activer
            ton compte et choisir ton plan.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Pas reçu après 5 minutes ? Vérifie tes spams.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crée ton compte"
      description="7 jours gratuits, sans engagement. Accès immédiat après inscription."
      footer={
        <p className="text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      {/* Google OAuth — commenté tant que les credentials Google Cloud ne sont
          pas configurées. Voir CONTEXT.md section "Google OAuth — à finir". */}
      {/*
      <GoogleButton next="/app" />
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
          <Label htmlFor="password">Mot de passe (8 caractères min.)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            disabled={loading}
            autoComplete="new-password"
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
          disabled={!email.trim() || password.length < 8}
        >
          Créer mon compte
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground/70">
          En créant un compte, tu acceptes nos{' '}
          <Link
            href="/mentions-legales"
            className="underline hover:text-foreground"
          >
            mentions légales
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
