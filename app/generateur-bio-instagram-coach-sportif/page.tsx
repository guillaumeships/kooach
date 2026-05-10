/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import Link from 'next/link';

import { BioForm } from './_components/bio-form';

import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { ScrollReveal } from '@/app/_components/ScrollReveal';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';
import { LandingCTA } from '@/components/landing/landing-cta';

export const metadata: Metadata = {
  title: 'Générateur de bio Instagram pour coach sportif · Outil gratuit · Kooach',
  description:
    "Génère 5 bios Instagram pour ton compte de coach sportif — calibrées sur ta niche, ta spécialité et ta ville. Gratuit, sans inscription Kooach.",
  openGraph: {
    title: 'Générateur de bio Instagram pour coach sportif — Outil gratuit',
    description:
      'Donne ta niche, ta spécialité, ta ville : on te génère 5 bios différentes calibrées coachs sportifs FR. Gratuit, en 30 secondes.',
    url: 'https://kooach.fr/generateur-bio-instagram-coach-sportif',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://kooach.fr/generateur-bio-instagram-coach-sportif' },
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
            style={{ fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.05, letterSpacing: '-1.5px' }}
          >
            5 bios Instagram qui{' '}
            <em className="italic text-primary">convertissent</em>.
            <br />
            En 30 secondes.
          </h1>

          <p
            className="fade-in mx-auto text-muted-foreground"
            data-delay="2"
            style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', lineHeight: 1.6, maxWidth: 580 }}
          >
            Ta bio Instagram, c'est <strong className="font-semibold text-foreground">150 caractères pour convaincre un inconnu</strong> que tu peux changer son corps. 99% des coachs la ratent. Donne ta niche et ta spécialité — on te génère 5 modèles calibrés pour ta cible.
          </p>
        </div>

        <BioForm />

        <p className="mt-5 text-center text-[12.5px] text-muted-foreground/80">
          🔒 Email pour t'envoyer une copie · pas de spam · désinscription en 1 clic
        </p>
      </div>
    </section>
  );
}

// ─── Pourquoi 5 bios différentes ───────────────────────────────────────────

function WhyFiveBios() {
  const angles = [
    {
      label: 'Autorité',
      desc:
        "Mise en avant de tes diplômes, années d'exp, certifications. Pour rassurer les prospects méfiants.",
    },
    {
      label: 'Transformation client',
      desc:
        "Focus sur les résultats tangibles que tu produis (kg perdus, transfo, prise de masse).",
    },
    {
      label: 'Locale',
      desc:
        "Ancrage géographique fort. Imbattable en local : « Coach perte de poids · Lyon ».",
    },
    {
      label: 'Lifestyle',
      desc:
        'Tonalité aspirationnelle, style de vie. Pour cibles qui veulent une identité, pas un service.',
    },
    {
      label: 'Spécialisation pointue',
      desc:
        'Niche ultra-précise. « Prépa physique foot, 12 ans avec les pros » > coach généraliste.',
    },
  ];

  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-[920px] px-[6%]">
        <div className="mb-12 text-center">
          <SectionEyebrow className="mb-4">✦ Comment ça marche</SectionEyebrow>
          <h2
            className="font-display mb-4 font-bold text-foreground"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.15, letterSpacing: '-1px' }}
          >
            5 bios, <em className="italic text-primary">5 angles distincts</em>.
          </h2>
          <p className="mx-auto max-w-[560px] text-[15.5px] leading-relaxed text-muted-foreground">
            Plutôt que de te donner UNE bio "moyenne", on te génère 5 versions sous des angles différents. Tu choisis celle qui te ressemble le plus — ou tu mixes (le hook de l'une, le CTA de l'autre).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {angles.map((angle, i) => (
            <div
              key={angle.label}
              className="kk-card-premium rounded-xl p-5"
            >
              <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-primary">
                ✦ {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="font-display mb-2 text-[16px] font-bold leading-tight text-foreground">
                {angle.label}
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {angle.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Upsell Kooach Pro ─────────────────────────────────────────────────────

function UpsellSection() {
  return (
    <section className="bg-background pb-24 pt-4 sm:pb-32">
      <div className="mx-auto max-w-[820px] px-[6%]">
        <div className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl p-8 text-center sm:p-12">
          <div className="font-display mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-[11.5px] font-bold uppercase tracking-[1.2px] text-primary">
            ✦ Va plus loin
          </div>
          <h2
            className="font-display mb-4 font-bold text-foreground"
            style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', lineHeight: 1.15, letterSpacing: '-0.8px' }}
          >
            Ta bio est faite. <br />
            <em className="italic text-primary">Et tes 3 posts/sem ?</em>
          </h2>
          <p className="mx-auto mb-7 max-w-[540px] text-[15.5px] leading-relaxed text-muted-foreground">
            Une bio se fait <strong className="font-semibold text-foreground">une fois</strong>, peut-être 2-3 fois sur l'année. <strong className="font-semibold text-foreground">Tes posts, c'est tous les jours.</strong> Avec Kooach Pro, tu génères 7 contenus complets (3 posts + bio + newsletter + email + reel) en 60s, calibrés sur ton ton — autant de fois que tu veux dans le mois.
          </p>
          <LandingCTA href="/signup?utm_source=lead-magnet&utm_medium=tool&utm_campaign=bio-page" size="lg">
            Tester Kooach Pro · 7 jours gratuits
          </LandingCTA>
          <p className="mt-3 text-[12.5px] text-muted-foreground/80">
            Annulable en 1 clic · sans engagement
          </p>
        </div>

        <p className="mt-10 text-center text-[13.5px] text-muted-foreground">
          Tu cherches d'autres outils ?{' '}
          <Link
            href="/generateur-accroches"
            className="text-primary underline-offset-2 hover:underline"
          >
            Génère 10 accroches Instagram →
          </Link>
        </p>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BioGeneratorPage() {
  return (
    <>
      <ScrollReveal />
      <LandingNav />
      <main>
        <Hero />
        <WhyFiveBios />
        <UpsellSection />
      </main>
      <LandingFooter />
    </>
  );
}
