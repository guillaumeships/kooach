/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import Link from 'next/link';

import ExemplesSection from './_components/ExemplesSection';
import { ScrollReveal } from './_components/ScrollReveal';
import ProductMockup from './_components/ProductMockup';

import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';
import { LandingCTA } from '@/components/landing/landing-cta';
import { StickyCtaMobile } from '@/components/landing/sticky-cta-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Kooach — Tu coaches. Kooach écrit pour toi. Pour coachs sportifs FR.',
  description:
    'Pour coachs sportifs FR (en salle, à domicile, en ligne). 7 contenus Instagram calibrés sur ton style — posts, newsletter, email, script réel — en 60 secondes. 7 jours gratuits, sans CB.',
  openGraph: {
    title: 'Kooach — Tu coaches. Kooach écrit pour toi.',
    description:
      'Pour coachs sportifs FR. 7 contenus Instagram qui transforment les scrolleurs en DMs, et les DMs en clients. Calibrés à ton ton et à ta cible. En 60 secondes.',
    url: 'https://kooach.fr',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://kooach.fr' },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

// STRIPE_URL retiré 2026-05-09 : checkout via /api/stripe/checkout (cf gotcha #25)

const CONTENTS = [
  { icon: '💜', name: 'Post Émotionnel' },
  { icon: '📚', name: 'Post Éducatif' },
  { icon: '🔥', name: 'Post Motivationnel' },
  { icon: '🔗', name: 'Bio Instagram' },
  { icon: '📧', name: 'Newsletter' },
  { icon: '✉️', name: 'Email de relance' },
  { icon: '🎬', name: 'Idée Réel + Script' },
];

const FAQ_ITEMS = [
  {
    q: 'Je suis coach sportif en salle (pas en ligne), est-ce que ça marche pour moi ?',
    a: 'Oui. Que tu coaches en salle, à domicile ou en ligne, le besoin est le même : être visible sur Instagram pour attirer des prospects. Kooach génère du contenu qui parle à ton audience, peu importe ton format.',
  },
  {
    q: 'Mes posts vont-ils être originaux ou copiés-collés d\'autres coachs ?',
    a: 'Chaque génération est unique. Le modèle Claude (par Anthropic) n\'a pas de "templates" en mémoire — chaque sortie est calculée en live à partir de ton profil. Concrètement : 2 coachs avec exactement les mêmes inputs ne reçoivent jamais les mêmes contenus. Et tu peux coller 2-3 de tes anciens posts dans Kooach pour caler le ton sur le tien.',
  },
  {
    q: 'Combien de générations je peux faire par mois ?',
    a: 'Jusqu\'à 5 générations complètes par jour, 100 par mois — soit l\'équivalent de 700 contenus prêts à publier chaque mois (3 posts Insta, bio, newsletter, email et réel à chaque génération). En pratique, 5 à 10 générations couvrent largement le besoin d\'un coach qui poste tous les jours. Plus 15 régénérations unitaires par jour si une card te plaît pas. Tu n\'atteindras jamais le plafond en usage normal. Si tu as un usage vraiment exceptionnel, écris-nous à contact@kooach.fr.',
  },
  {
    q: 'Je vends des programmes en ligne. Kooach peut-il m\'aider à les vendre ?',
    a: 'Oui. Choisis l\'objectif "Vendre mon programme" lors de la génération — Kooach oriente le ton et l\'angle des contenus pour faire monter en désir, pas pour faire de la vente agressive.',
  },
  {
    q: 'Combien de temps je gagne par semaine ?',
    a: 'En moyenne 4 à 6 heures par semaine. Là où tu mettais 30-45 minutes pour rédiger un post, Kooach te sort 7 contenus en 60 secondes. Le temps gagné, tu le mets sur tes clients.',
  },
  {
    q: 'Le contenu est-il en français parfait ou avec des tournures bizarres ?',
    a: 'Le modèle utilisé (Claude Sonnet 4.6 d\'Anthropic) est entraîné sur du français de qualité. Pas d\'anglicismes maladroits, pas de phrase qui sonne "traduite de l\'anglais". C\'est aussi pour ça qu\'on reste sur Claude et pas GPT — il est meilleur en FR sur la rédaction longue.',
  },
  {
    q: 'Et si je suis débutant en social media, ça me va ?',
    a: 'Encore mieux. Tu n\'as PAS besoin de savoir "comment écrire un bon hook" ou "structurer un post viral". Tu remplis ton profil (spécialité, style, cible), tu choisis un objectif, le contenu sort prêt à publier. Aucune compétence rédactionnelle requise.',
  },
  {
    q: 'En quoi Kooach est différent de ChatGPT ?',
    a: 'ChatGPT génère des mots, mais sans la calibration métier. Kooach connaît la psychologie des coachs sportifs FR : les hooks qui marchent en fitness, le ton qui convertit en DM, les angles qui vendent un programme. Pas besoin de savoir prompter — tu remplis ton profil, c\'est calibré.',
  },
  {
    q: 'Mes données et mes posts existants restent-ils privés ?',
    a: 'Oui. Tes profils, contenus générés et exemples sont stockés sur Supabase (serveurs UE), accès strictement limité à toi. Aucune donnée n\'est partagée avec des tiers, aucun tracking publicitaire. Si tu supprimes ton compte, tout est effacé sous 30 jours conformément au RGPD.',
  },
  {
    q: 'Que se passe-t-il après les 7 jours gratuits ?',
    a: 'À la fin des 7 jours, on te demande ta CB pour passer à 29 €/mois — pas avant. Pas de débit anticipé, pas de surprise. Si Kooach t\'a kiffé, tu mets ta CB en 1 clic. Sinon, tu pars, sans rien faire.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HERO — refonte 2026 : eyebrow + title plus impactant + dual CTA + trust signals
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pb-20 pt-32 sm:pt-36">
      {/* Aurora mesh gradient (déjà existante) + noise texture (signature 2026) */}
      <div className="kk-mesh-hero" aria-hidden="true" />
      <div className="kk-noise pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-[1] mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 px-[6%] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        {/* Colonne gauche — copy + CTAs */}
        <div className="text-center lg:text-left">
          {/* Eyebrow niche : pill rounded avec emoji haltère, sentence case 2026 */}
          <div className="fade-in font-display mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-4 py-1.5 text-[14px] italic text-primary backdrop-blur-sm">
            🏋️ Pour coachs sportifs FR
          </div>

          <h1
            className="fade-in font-display mb-5 font-bold text-foreground"
            data-delay="1"
            style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.02, letterSpacing: '-2px' }}
          >
            Tu coaches.
            <br />
            <em className="italic text-primary">Kooach écrit pour toi.</em>
          </h1>

          <p
            className="fade-in mx-auto mb-8 text-muted-foreground lg:mx-0"
            data-delay="2"
            style={{ fontSize: 'clamp(16px, 1.7vw, 19px)', lineHeight: 1.6, maxWidth: 540 }}
          >
            7 contenus Instagram calibrés pour coachs sportifs — qui transforment les scrolleurs
            en DMs, et les DMs en clients. <strong className="font-semibold text-foreground">En 60 secondes.</strong>
          </p>

          <div
            className="fade-in mb-3 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            data-delay="3"
          >
            <LandingCTA href="/signup" size="lg">
              7 jours gratuits, sans CB
            </LandingCTA>
          </div>

          {/* Login link — mobile only (desktop : "Se connecter" dans la nav).
              Garde l'utilisateur récurrent à un clic du dashboard sur mobile,
              où le header est trop serré pour héberger un 4e item. */}
          <p
            className="fade-in mb-7 text-center text-[13.5px] text-muted-foreground sm:hidden"
            data-delay="3"
          >
            Déjà client ?{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </p>

          {/* Trust signals — niche-specific */}
          <div
            className="fade-in flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground lg:justify-start"
            data-delay="3"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="text-primary">●</span> En salle, à domicile ou en ligne
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-primary">●</span> 7 jours gratuits sans CB
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-primary">●</span> Annulable en 1 clic
            </span>
          </div>
        </div>

        {/* Colonne droite — mockup produit avec halo */}
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-8 rounded-[40px] bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <ProductMockup variant="sportif" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT SECTION — "Le constat" (douleur niche, frappe directe)
// ─────────────────────────────────────────────────────────────────────────────

function ContextSection() {
  return (
    <section className="kk-noise relative border-t border-border bg-card py-24">
      <div className="mx-auto max-w-[820px] px-[6%] text-center" data-reveal>
        <SectionEyebrow className="mb-4 inline-block">Le constat</SectionEyebrow>
        <h2
          className="font-display mb-6 font-bold text-foreground"
          style={{ fontSize: 'clamp(28px, 4.4vw, 44px)', lineHeight: 1.15, letterSpacing: '-1px' }}
        >
          Les coachs sportifs qui scalent ont un point commun&nbsp;:{' '}
          <em className="italic text-primary">leur Instagram tourne tout seul.</em>
        </h2>
        <p className="text-[16.5px] leading-[1.7] text-muted-foreground">
          Un post tous les 2 jours, sans réfléchir, sans procrastiner. Pendant que toi tu te dis
          <em className="italic text-foreground/85"> "il faut que je m'y mette"</em>, eux ils
          enchaînent les DMs entrants.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.7] text-muted-foreground">
          Kooach règle ce trou : <strong className="font-semibold text-foreground">7 contenus prêts à publier</strong>,
          calibrés à ton ton, à ta cible et à ton objectif.{' '}
          <em className="italic text-foreground/90">
            Plus jamais à te demander quoi poster.
          </em>{' '}
          Une semaine de contenu en moins de temps qu'un café.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT ÇA MARCHE — 3 étapes visuelles
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      num:   '01',
      title: 'Décris ton profil',
      body:  'Spécialité, style, mots-clés, cible. 30 secondes pour calibrer Kooach à ton ton et ton audience.',
      icon:  '✦',
    },
    {
      num:   '02',
      title: 'Choisis ton objectif',
      body:  'Attirer des DMs, décrocher des RDV, vendre ton programme. Chaque objectif oriente l\'angle du contenu.',
      icon:  '🎯',
    },
    {
      num:   '03',
      title: 'Génère 7 contenus',
      body:  '3 posts Instagram, ta bio, ta newsletter, un email de relance, et une idée de réel + son script. Prêts à publier.',
      icon:  '⚡',
    },
  ];

  return (
    <section className="kk-noise relative border-t border-border bg-card py-24">
      <div className="mx-auto max-w-[1080px] px-[6%]">
        <div className="mb-14 text-center" data-reveal>
          <SectionEyebrow className="mb-4 inline-block">Comment ça marche</SectionEyebrow>
          <h2
            className="font-display font-bold text-foreground"
            style={{ fontSize: 'clamp(30px, 4.4vw, 48px)', lineHeight: 1.1, letterSpacing: '-1px' }}
          >
            Trois étapes. <em className="italic text-primary">Soixante secondes.</em>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {steps.map((s, i) => (
            <div
              key={s.num}
              data-reveal
              data-delay={i.toString()}
              className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl px-7 py-8"
            >
              {/* Numéro en filigrane Fraunces serif */}
              <span
                className="font-display pointer-events-none absolute right-6 top-5 select-none text-[44px] italic leading-none text-primary/20"
                aria-hidden="true"
              >
                {s.num}
              </span>

              {/* Icon avec halo */}
              <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-xl bg-primary/10 blur-lg"
                  aria-hidden
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary-subtle text-[20px] text-primary shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.3)]">
                  {s.icon}
                </div>
              </div>

              <h3 className="font-display mb-2 text-[20px] font-bold leading-tight tracking-tight text-foreground">
                {s.title}
              </h3>
              <p className="text-[14.5px] leading-[1.65] text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON — Kooach vs ChatGPT vs Templates (pattern conversion 2026)
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonSection() {
  const without = [
    'Page blanche · 30 à 45 min pour pondre 1 post',
    'ChatGPT générique sans calibration · prompts à perfectionner',
    'Posts irréguliers car flemme ou manque d\'inspi le matin',
    'Tu copies tes concurrents et ça finit par se voir',
    'Newsletter, email, réel : tout à écrire à la main',
    'Tu sais que ton agenda Insta freine ta croissance',
  ];

  const withKooach = [
    '60 secondes par session · 7 contenus prêts à publier',
    'Calibré sur ton ton + ta cible + ton objectif',
    'Tu publies 4-7×/semaine sans réfléchir',
    'Chaque génération est unique · jamais la même 2 fois',
    '3 posts + bio + newsletter + email + réel + script',
    'Tu te concentres sur tes clients, pas sur ton feed',
  ];

  return (
    <section className="kk-noise relative border-t border-border bg-background py-24">
      <div className="mx-auto max-w-[1080px] px-[6%]">
        <div className="mb-12 text-center" data-reveal>
          <SectionEyebrow className="mb-4 inline-block">Avant / Après</SectionEyebrow>
          <h2
            className="font-display font-bold text-foreground"
            style={{ fontSize: 'clamp(30px, 4.4vw, 48px)', lineHeight: 1.1, letterSpacing: '-1px' }}
          >
            Le coût caché d'écrire <em className="italic text-primary">tout toi-même</em>.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
            4h/semaine sur ton contenu × 50€/h de coaching que tu ne factures pas =
            <strong className="font-semibold text-foreground"> 800€/mois en temps perdu</strong>.
            Kooach Pro coûte 29€.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2" data-reveal>
          {/* Sans Kooach */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-7 sm:p-8">
            <div className="font-display mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1 text-[13px] italic text-muted-foreground">
              ✕ Sans Kooach
            </div>
            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
              {without.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.55] text-muted-foreground">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Avec Kooach */}
          <div className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl p-7 sm:p-8">
            <div
              className="pointer-events-none absolute inset-x-0 -top-12 h-32 bg-gradient-to-b from-primary/15 to-transparent"
              aria-hidden
            />
            <div className="font-display relative mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-subtle px-3.5 py-1 text-[13px] italic text-primary">
              ✦ Avec Kooach
            </div>
            <ul className="relative m-0 flex list-none flex-col gap-3.5 p-0">
              {withKooach.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.55] text-foreground/90">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREUVE — placeholder témoignages (avant qu'on en ait des vrais)
// ─────────────────────────────────────────────────────────────────────────────

function ProofSection() {
  const stats = [
    { value: '60s',  label: 'Par génération',          sub: '7 contenus complets en 1 minute' },
    { value: '7',    label: 'Contenus par session',    sub: '3 posts · bio · newsletter · email · réel' },
    { value: '0',    label: 'Prompt à écrire',         sub: 'Tu remplis ton profil, c\'est calibré' },
  ];

  return (
    <section className="kk-noise relative border-t border-border bg-card py-24">
      <div className="mx-auto max-w-[1080px] px-[6%]">
        {/* Stats produit — 3 chiffres concrets, pas de fake testimonials */}
        <div className="mb-12 text-center" data-reveal>
          <SectionEyebrow className="mb-4 inline-block">Le produit en chiffres</SectionEyebrow>
          <h2
            className="font-display mb-3 font-bold text-foreground"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1, letterSpacing: '-1px' }}
          >
            Conçu pour ne pas <em className="italic text-primary">te faire perdre de temps</em>.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {stats.map((s, i) => (
            <div
              key={s.label}
              data-reveal
              data-delay={i.toString()}
              className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl px-7 py-8 text-center"
            >
              <div
                className="font-display mb-2 font-extrabold leading-none text-primary"
                style={{ fontSize: 'clamp(48px, 7vw, 72px)', letterSpacing: '-3px' }}
              >
                {s.value}
              </div>
              <p className="font-display text-[13px] italic text-foreground/85">
                ✦ {s.label}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-[560px] text-center text-[13px] leading-relaxed text-muted-foreground/80" data-reveal>
          🇫🇷 Tes données restent sur des serveurs européens. Aucune revente, aucun tracking publicitaire.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAD MAGNET TEASER — porte d'entrée gratuite avant les tarifs (objection
// handling pour les hésitants qui allaient bounce sans signup ni email).
// Placée APRÈS Proof et AVANT Pricing : le visiteur déjà convaincu a cliqué
// le hero CTA bien plus haut, donc on ne cannibalise que les hésitants.
// ─────────────────────────────────────────────────────────────────────────────

function LeadMagnetTeaserSection() {
  return (
    <section className="kk-noise relative border-t border-border bg-background py-24">
      <div className="mx-auto max-w-[1080px] px-[6%]">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* Colonne gauche — copy */}
          <div data-reveal>
            <SectionEyebrow className="mb-4 inline-block">Outil gratuit</SectionEyebrow>
            <h2
              className="font-display mb-4 font-bold text-foreground"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1, letterSpacing: '-1px' }}
            >
              Pas encore prêt&nbsp;?
              <br />
              <em className="italic text-primary">Teste sans t&apos;inscrire.</em>
            </h2>
            <p className="mb-6 max-w-md text-[15.5px] leading-[1.7] text-muted-foreground">
              Notre générateur d&apos;accroches Instagram te sort{' '}
              <strong className="font-semibold text-foreground">10 hooks calibrés</strong> à ta
              niche en 30 secondes. Aucun compte à créer, aucune carte. Juste : ton sujet, ta
              niche, et c&apos;est parti.
            </p>

            <ul className="m-0 mb-7 flex list-none flex-col gap-2.5 p-0">
              {[
                '10 accroches uniques par génération',
                '5 niches sportives FR couvertes',
                'Reçues aussi par email pour archiver',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14px] text-foreground/90">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LandingCTA href="/generateur-accroches" size="lg" glow={false}>
              Essayer maintenant
            </LandingCTA>
            <p className="mt-3 text-[12.5px] text-muted-foreground/80">
              ⚡ Génération en ~30s · 3 essais gratuits par jour
            </p>
          </div>

          {/* Colonne droite — mockup form (statique, juste visuel) */}
          <div data-reveal data-delay="1" className="relative">
            <div
              className="pointer-events-none absolute -inset-4 rounded-[28px] bg-primary/10 blur-3xl"
              aria-hidden
            />
            <div className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl p-6 sm:p-7">
              <p className="font-display mb-5 text-[14px] italic text-primary/80">
                ✦ Aperçu de l&apos;outil
              </p>

              <div className="grid gap-3">
                <MockField label="Niche sportive" value="Musculation / force" />
                <MockField label="Sujet du post" value="Pourquoi 80% des gens stagnent en muscu" />
                <MockField label="Objectif" value="Attirer des DMs" />
                <MockField label="Email" value="ton@email.com" muted />

                <div className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-gradient-to-br from-primary to-primary-hover px-4 py-3 text-[14px] font-semibold text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)]">
                  <span className="text-base">✨</span>
                  Générer mes 10 accroches
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-[11.5px] text-muted-foreground/80">
                <span className="font-display tracking-[0.1em]">⚡ ~30 SECONDES</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  GRATUIT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockField({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] text-muted-foreground">
        {label}
      </span>
      <div className={`rounded-lg border border-border bg-background/60 px-3 py-2.5 text-[13px] ${muted ? 'text-muted-foreground/60' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARIFS
// ─────────────────────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section
      id="tarifs"
      className="kk-noise relative border-t border-border bg-background py-24"
    >
      <div className="mx-auto max-w-[1080px] px-[6%] text-center">
        <div data-reveal>
          <SectionEyebrow className="mb-4 inline-block">Tarifs</SectionEyebrow>
          <h2
            className="font-display mb-3 font-bold text-foreground"
            style={{ fontSize: 'clamp(30px, 4.4vw, 48px)', lineHeight: 1.1, letterSpacing: '-1px' }}
          >
            Simple et <em className="italic text-primary">transparent</em>.
          </h2>
          <p className="mx-auto mb-14 max-w-sm text-[16px] leading-relaxed text-muted-foreground">
            Un seul plan. Tout inclus. Annulable en 1 clic.
          </p>
        </div>

        <div className="relative flex justify-center" data-reveal data-delay="1">
          {/* Halo glow primary derrière la card */}
          <div
            className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-[400px] max-w-[500px] rounded-full bg-primary/15 blur-[80px]"
            aria-hidden
          />

          <div className="kk-card-premium kk-noise relative w-full max-w-[480px] overflow-hidden rounded-3xl px-10 py-12 max-sm:px-6 max-sm:py-8">
            {/* Barre primary top */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            {/* Ribbon différenciation niche (1 seul plan = pas de "Le plus populaire" mensonge) */}
            <div className="font-display absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12px] italic text-primary backdrop-blur-sm">
              🇫🇷 100% coachs sportifs FR
            </div>

            <div className="font-display text-[16px] italic text-primary">
              Kooach Pro
            </div>

            <div
              className="font-display my-5 font-extrabold text-foreground"
              style={{ fontSize: 76, lineHeight: 1, letterSpacing: '-3px' }}
            >
              <sup className="align-super text-[28px]" style={{ letterSpacing: 0 }}>
                €
              </sup>
              29
              <sub
                className="text-[20px] font-normal text-muted-foreground"
                style={{ letterSpacing: 0 }}
              >
                /mois
              </sub>
            </div>

            <div className="mb-7 inline-flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-[11.5px] font-semibold text-primary">
                ✦ 7 jours gratuits, sans CB
              </span>
              <p className="mt-1 text-[12.5px] italic leading-relaxed text-muted-foreground">
                vs <strong className="font-semibold not-italic text-foreground">800 €/mois</strong> en temps perdu si tu écris toi-même
                <br />
                vs <strong className="font-semibold not-italic text-foreground">600 €/mois</strong> pour un community manager freelance
              </p>
            </div>

            <ul className="m-0 mb-9 flex list-none flex-col gap-3 p-0 text-left">
              {CONTENTS.map((c, i) => (
                <li key={i} className="flex items-center gap-3 text-[14.5px]">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-foreground/90">
                    {c.icon} {c.name}
                  </span>
                </li>
              ))}
            </ul>

            <LandingCTA href="/signup" size="lg" className="w-full">
              7 jours gratuits, sans CB
            </LandingCTA>

            <p className="mt-5 inline-flex items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground">
              🔒 Satisfait ou remboursé · annulable en 1 clic
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

function FaqSection() {
  return (
    <section id="faq" className="kk-noise relative border-t border-border bg-card py-24">
      <div className="mx-auto max-w-[720px] px-[6%]">
        <div className="mb-12 text-center" data-reveal>
          <SectionEyebrow className="mb-4 inline-block">FAQ</SectionEyebrow>
          <h2
            className="font-display font-bold text-foreground"
            style={{ fontSize: 'clamp(30px, 4.4vw, 48px)', lineHeight: 1.1, letterSpacing: '-1px' }}
          >
            Questions <em className="italic text-primary">fréquentes</em>.
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              data-reveal
              data-delay={i.toString()}
              className="kk-card-premium kk-noise group overflow-hidden rounded-xl"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-foreground transition-colors hover:text-primary">
                {item.q}
                <span className="faq-arrow inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[18px] leading-none text-primary">
                  +
                </span>
              </summary>
              <p
                className="px-6 pb-5 text-[14.5px] text-muted-foreground"
                style={{ lineHeight: 1.7 }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL CTA
// ─────────────────────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-28 text-center">
      {/* Mesh halos primary glow */}
      <div className="kk-mesh-hero" aria-hidden="true" />
      <div className="kk-noise pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-[1080px] px-[6%]">
        <h2
          data-reveal
          className="font-display mx-auto mb-5 font-bold text-foreground"
          style={{
            fontSize: 'clamp(34px, 5.4vw, 60px)',
            lineHeight: 1.05,
            letterSpacing: '-1.5px',
            maxWidth: 700,
          }}
        >
          Prêt à transformer ton Instagram
          <br />
          en <em className="italic text-primary">machine à clients</em>&nbsp;?
        </h2>

        <p
          data-reveal
          data-delay="1"
          className="mx-auto mb-10 max-w-md text-[17px] leading-relaxed text-muted-foreground"
        >
          7 jours gratuits, sans CB. Sans engagement. Annulable en 1 clic.
        </p>

        <div data-reveal data-delay="2" className="flex justify-center">
          <LandingCTA href="/signup" size="lg">
            7 jours gratuits, sans CB
          </LandingCTA>
        </div>

        <p
          data-reveal
          data-delay="3"
          className="mt-6 inline-flex items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground/80"
        >
          🇫🇷 Conçu en France · Pour coachs sportifs en salle, à domicile et en ligne
        </p>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA.ORG — Product + Offer + FAQPage (rich snippets Google +15-30% CTR)
// ─────────────────────────────────────────────────────────────────────────────

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kooach',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Générateur IA de contenu Instagram pour coachs sportifs FR. 7 contenus calibrés (3 posts, bio, newsletter, email, reel) en 60 secondes.',
  url: 'https://kooach.fr',
  inLanguage: 'fr-FR',
  brand: { '@type': 'Brand', name: 'Kooach' },
  offers: {
    '@type': 'Offer',
    price: '29.00',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    priceValidUntil: '2027-12-31',
    url: 'https://kooach.fr/signup',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default function LandingPage() {
  return (
    <>
      {/* Schema.org JSON-LD — rich snippets Google (FAQ accordéon + prix) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <ScrollReveal />
      <LandingNav />
      <main>
        <Hero />
        {/* LeadMagnetTeaser repositionné en 2e position 2026-05-21 :
            avant, caché en bas de page (90% des visiteurs ne scrollaient pas
            jusque-là). Maintenant visible dès le 2e scroll = +30-50% de
            visiteurs voient le tool gratuit avant le pitch produit. */}
        <LeadMagnetTeaserSection />
        <ContextSection />
        <HowItWorksSection />
        <ExemplesSection />
        <ComparisonSection />
        <ProofSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
      <StickyCtaMobile />
    </>
  );
}
