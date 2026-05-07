/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import Link from 'next/link';

import { LeadMagnetForm } from './_components/lead-magnet-form';

import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { ScrollReveal } from '@/app/_components/ScrollReveal';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';
import { LandingCTA } from '@/components/landing/landing-cta';

export const metadata: Metadata = {
  title: '10 accroches Instagram pour coachs sportifs · Outil gratuit · Kooach',
  description:
    'Génère 10 accroches Instagram qui scrollent net pour ton compte de coach sportif — en 30 secondes, gratuit, sans inscription Kooach.',
  openGraph: {
    title: '10 accroches Instagram pour coachs sportifs — Outil gratuit',
    description:
      'Tu manques d\'inspi pour ouvrir ton prochain post ? Génère 10 accroches calibrées à ta niche sportive en 30 secondes. Gratuit.',
    url: 'https://kooach.fr/generateur-accroches',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://kooach.fr/generateur-accroches' },
};

// ─── Hero tool-first ────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pb-16 pt-32 sm:pt-36">
      <div className="kk-mesh-hero" aria-hidden="true" />
      <div className="kk-noise pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-[920px] px-[6%]">
        <div className="mb-10 text-center">
          <div className="fade-in font-display mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-4 py-1.5 text-[14px] italic text-primary backdrop-blur-sm">
            ✨ Outil gratuit · pour coachs sportifs FR
          </div>

          <h1
            className="fade-in font-display mb-4 font-bold text-foreground"
            data-delay="1"
            style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-1.5px' }}
          >
            10 accroches Instagram qui{' '}
            <em className="italic text-primary">scrollent net</em>.
            <br />
            En 30 secondes.
          </h1>

          <p
            className="fade-in mx-auto text-muted-foreground"
            data-delay="2"
            style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', lineHeight: 1.6, maxWidth: 580 }}
          >
            Tu sais ce que tu veux dire — mais l'attaque du post t'arrête à chaque fois ?
            Donne ta niche et ton sujet, on te génère 10 accroches calibrées à ta cible.
          </p>
        </div>

        <LeadMagnetForm />

        <p className="mt-5 text-center text-[12.5px] text-muted-foreground/80">
          🔒 Email pour t'envoyer une copie · pas de spam · désinscription en 1 clic
        </p>
      </div>
    </section>
  );
}

// ─── Comment ça marche ──────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Tu donnes le contexte',
      body: 'Ta niche sportive, ton sujet du jour, et ce que tu veux que le post déclenche (DM, ventes, RDV, notoriété).',
      icon: '✦',
    },
    {
      num: '02',
      title: "L'IA calibre 10 accroches",
      body: 'On utilise les techniques qui convertissent vraiment en fitness FR : casse-croyance, contre-courant, mini-histoire, liste promesse, douleur ciblée.',
      icon: '⚡',
    },
    {
      num: '03',
      title: 'Tu copies, tu publies',
      body: 'Tu reçois aussi les 10 accroches par email. Tu choisis celle qui te parle, tu ouvres ton post avec, et tu enchaînes ton contenu derrière.',
      icon: '📩',
    },
  ];

  return (
    <section className="kk-noise relative border-t border-border bg-card py-20">
      <div className="mx-auto max-w-[1080px] px-[6%]">
        <div className="mb-12 text-center" data-reveal>
          <SectionEyebrow className="mb-4 inline-block">Comment ça marche</SectionEyebrow>
          <h2
            className="font-display font-bold text-foreground"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1, letterSpacing: '-1px' }}
          >
            Trois étapes. <em className="italic text-primary">Trente secondes.</em>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {steps.map((s, i) => (
            <div
              key={s.num}
              data-reveal
              data-delay={i.toString()}
              className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl px-7 py-7"
            >
              <span
                className="font-display pointer-events-none absolute right-6 top-5 select-none text-[40px] italic leading-none text-primary/20"
                aria-hidden="true"
              >
                {s.num}
              </span>

              <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-xl bg-primary/10 blur-lg" aria-hidden />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary-subtle text-[20px] text-primary shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.3)]">
                  {s.icon}
                </div>
              </div>

              <h3 className="font-display mb-2 text-[19px] font-bold leading-tight tracking-tight text-foreground">
                {s.title}
              </h3>
              <p className="text-[14px] leading-[1.65] text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Kooach Pro ─────────────────────────────────────────────────────────

function UpsellSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-24">
      <div className="kk-mesh-hero" aria-hidden="true" />
      <div className="kk-noise pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-[820px] px-[6%] text-center" data-reveal>
        <SectionEyebrow className="mb-4 inline-block">Va plus loin</SectionEyebrow>
        <h2
          className="font-display mb-5 font-bold text-foreground"
          style={{ fontSize: 'clamp(28px, 4.4vw, 44px)', lineHeight: 1.1, letterSpacing: '-1px' }}
        >
          Tu veux le post complet, pas juste l'accroche ?
        </h2>
        <p className="mx-auto mb-8 max-w-[560px] text-[16px] leading-[1.7] text-muted-foreground">
          Les accroches c'est bien — mais c'est 10% du job. Avec{' '}
          <strong className="font-semibold text-foreground">Kooach Pro</strong>, tu génères{' '}
          <strong className="font-semibold text-foreground">7 contenus complets</strong> en 60
          secondes : 3 posts Instagram (émotionnel, éducatif, motivationnel) + ta bio + ta
          newsletter + un email de relance + une idée de réel avec son script. Calibrés à ton ton,
          ta cible, ton objectif.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <LandingCTA href="/signup" size="lg">
            Tester Kooach Pro · 7 jours gratuits
          </LandingCTA>
          <Link
            href="/#exemples"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-5 py-2.5 text-[14px] font-medium text-foreground/80 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card hover:text-foreground"
          >
            Voir un exemple
          </Link>
        </div>

        <p className="mt-6 text-[12.5px] text-muted-foreground/80">
          🇫🇷 Conçu en France · annulable en 1 clic
        </p>

        <p className="mt-10 text-center text-[13.5px] text-muted-foreground">
          Tu cherches d'autres outils ?{' '}
          <Link
            href="/generateur-bio-instagram-coach-sportif"
            className="text-primary underline-offset-2 hover:underline"
          >
            Génère 5 bios Instagram pour coach sportif →
          </Link>
        </p>
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LeadMagnetPage() {
  return (
    <>
      <ScrollReveal />
      <LandingNav />
      <main>
        <Hero />
        <HowItWorksSection />
        <UpsellSection />
      </main>
      <LandingFooter />
    </>
  );
}
