/**
 * app/app/upgrade/page.tsx
 *
 * Page affichée à l'user dont l'essai gratuit 7j est terminé sans paiement.
 *
 * Contexte : Étape B no-CC trial (2026-05-21). L'user a signup sans CB, a
 * profité de 7j gratuits, et arrive ici quand /app détecte trial_end < now
 * sans stripe_customer_id.
 *
 * Promesse : pas de surprise, l'user voit ce qu'il a généré, on lui demande
 * de mettre sa CB MAINTENANT pour continuer.
 *
 * Auth : route protégée (Supabase Auth cookie). Si pas d'user → /login.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggleCompact } from '@/components/theme-toggle';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabase } from '@/lib/supabase';

export default async function UpgradePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login?next=/app/upgrade');
  }

  // Compte combien de générations l'user a faites pendant son trial — sert
  // d'argument tangible ("tu as déjà gagné X heures de contenu")
  const db = getSupabase();
  const { count: totalGenerations } = await db
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', user.email.toLowerCase());

  const gens = totalGenerations ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggleCompact />
      </div>
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full text-center">
          <p
            className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ✦ Ton essai gratuit est fini
          </p>
          <h1
            className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tu as kiffé&nbsp;? Continue.
          </h1>
          <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
            7 jours d'accès illimité, {gens > 0 ? <><strong className="text-foreground">{gens} contenu{gens > 1 ? 's' : ''} généré{gens > 1 ? 's' : ''}</strong> pendant ton essai. </> : null}
            Pas de carte demandée jusqu'à maintenant. Si Kooach t'a fait gagner du temps, débloque ton accès en 1 clic.
          </p>

          <div className="mb-10 rounded-2xl border border-border bg-card p-8 text-left shadow-kk-sm">
            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Kooach Pro</h2>
                <p className="text-sm text-muted-foreground">Annulable à tout moment</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">29€</p>
                <p className="text-xs text-muted-foreground">/mois TTC</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                <span>5 générations/jour · 100/mois (jamais atteint en pratique)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                <span>7 contenus Insta personnalisés par génération (3 posts + bio + newsletter + email + reel)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                <span>Voice cloning sur tes posts existants</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                <span>Annulation 1 clic depuis ton compte</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button size="lg" asChild className="min-w-[260px]">
              <Link href="/api/stripe/checkout">
                Mets ta CB pour continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Paiement sécurisé Stripe. Tu peux annuler à tout moment depuis ton compte.
            </p>
          </div>

          <hr className="my-12 border-border/60" />

          <div className="space-y-3 text-left text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Tu hésites ?</strong> Écris-moi à{' '}
              <a
                href="mailto:contact@kooach.fr"
                className="text-primary underline hover:no-underline"
              >
                contact@kooach.fr
              </a>{' '}
              — je réponds personnellement, c'est moi en face.
            </p>
            <p>
              <strong className="text-foreground">Tu veux pas continuer ?</strong> Pas grave. Tu peux{' '}
              <Link href="/app/account" className="text-primary underline hover:no-underline">
                supprimer ton compte
              </Link>{' '}
              — aucun débit, aucun mail relance après suppression.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
