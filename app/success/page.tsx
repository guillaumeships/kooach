'use client';

/**
 * app/success/page.tsx — refonte premium 2026
 *
 * Page affichée après un paiement Stripe réussi.
 * 2 cas : authed (Supabase) ou guest (paiement direct sans signup).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Mail, Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { LandingCTA, LandingCTASecondary } from '@/components/landing/landing-cta';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type State = 'loading' | 'authed' | 'guest';

export default function SuccessPage() {
  const [state, setState] = useState<State>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email);
        setState('authed');
      } else {
        setState('guest');
      }
    });
  }, []);

  return (
    <main className="kk-noise relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Aurora mesh + halo glow primary */}
      <div className="kk-mesh-hero" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />

      <Card className="kk-card-premium kk-noise relative w-full max-w-[560px] overflow-hidden rounded-3xl px-8 py-10 text-center sm:px-12 sm:py-12">
        {/* Barre top primary gradient */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

        <Link
          href="/"
          className="font-display mb-8 inline-flex items-center gap-2 text-[20px] italic tracking-tight text-primary no-underline"
        >
          <Image src="/img/logo.svg" alt="" width={24} height={24} className="shrink-0" />
          Kooach
        </Link>

        {/* Icône avec halo glow — block flex pour passer à la ligne sous le logo */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" aria-hidden />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-subtle to-primary-muted/30 text-primary shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.4)]">
            {state === 'authed' ? (
              <Check className="h-9 w-9" strokeWidth={2.5} />
            ) : (
              <Sparkles className="h-9 w-9" strokeWidth={1.5} />
            )}
          </div>
        </div>

        {state === 'loading' && (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        )}

        {state === 'authed' && (
          <>
            <SectionEyebrow className="mb-3 inline-block">Paiement confirmé</SectionEyebrow>
            <h1
              className="font-display mb-3 font-bold text-foreground"
              style={{ fontSize: 'clamp(28px, 5vw, 38px)', lineHeight: 1.1, letterSpacing: '-1px' }}
            >
              Bienvenue chez <em className="italic text-primary">Kooach</em>.
            </h1>
            <p className="mx-auto mb-8 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
              {email ? (
                <>
                  Ton accès <strong className="font-semibold text-foreground">{email}</strong> est activé.
                </>
              ) : (
                <>Ton accès est activé.</>
              )}
            </p>

            <div className="mb-8 flex flex-col gap-2.5 text-left">
              <Step num="1" text="Remplis ton profil (spécialité, style, cible)" />
              <Step num="2" text="Choisis ton objectif" />
              <Step num="3" text="Génère tes 7 contenus en 60 secondes" />
            </div>

            <div className="flex justify-center">
              <LandingCTA href="/app" size="lg">
                Aller à mon dashboard
              </LandingCTA>
            </div>

            <p className="mt-6 text-[12.5px] text-muted-foreground/80">
              💡 Tu pourras toujours te reconnecter depuis{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                kooach.fr/login
              </Link>
              .
            </p>
          </>
        )}

        {state === 'guest' && (
          <>
            <SectionEyebrow className="mb-3 inline-block">Paiement confirmé</SectionEyebrow>
            <h1
              className="font-display mb-3 font-bold text-foreground"
              style={{ fontSize: 'clamp(28px, 5vw, 38px)', lineHeight: 1.1, letterSpacing: '-1px' }}
            >
              Bienvenue chez <em className="italic text-primary">Kooach</em>.
            </h1>
            <p className="mx-auto mb-8 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
              Ton accès arrive par email en{' '}
              <strong className="font-semibold text-foreground">moins d&apos;une minute</strong>.
              Vérifie ta boîte de réception.
            </p>

            <div className="mb-7 flex flex-col gap-2.5 text-left">
              <Step num="1" text="Ouvre l'email de Kooach" icon={<Mail className="h-3.5 w-3.5" />} />
              <Step num="2" text="Clique sur ton lien d'accès" />
              <Step num="3" text="Génère ton premier contenu" />
            </div>

            <div className="mb-7 rounded-xl border border-primary/20 bg-primary-subtle/60 px-5 py-4 text-left text-[13px] leading-relaxed text-primary">
              Pas reçu après 5 minutes ? Vérifie tes spams,{' '}
              <Link href="/recover-access" className="font-semibold underline-offset-2 hover:underline">
                redemande un lien
              </Link>{' '}
              ou écris-nous à{' '}
              <a
                href="mailto:contact@kooach.fr"
                className="font-semibold underline-offset-2 hover:underline"
              >
                contact@kooach.fr
              </a>
              .
            </div>

            <div className="flex justify-center">
              <LandingCTASecondary href="/">
                Retour à l&apos;accueil
                <ArrowRight className="h-3.5 w-3.5" />
              </LandingCTASecondary>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}

function Step({
  num,
  text,
  icon,
}: {
  num: string;
  text: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[14px] font-bold text-primary-foreground shadow-[0_4px_10px_-2px_hsl(var(--primary)/0.4)]">
        {num}
      </div>
      <span className="flex-1 text-[14px] font-medium leading-tight text-foreground">
        {text}
      </span>
      {icon && (
        <span className="shrink-0 text-muted-foreground">{icon}</span>
      )}
    </div>
  );
}
