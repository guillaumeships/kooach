/**
 * app/_components/LandingBits.tsx
 *
 * Bridge legacy → nouvelles briques 2026.
 *
 * Re-exporte les nouvelles primitives (SectionEyebrow, LandingCTA) sous les
 * anciens noms (SectionTag, CtaButton) pour que les pages niche (coach-sportif)
 * continuent à fonctionner sans refacto massive.
 */

import type { ReactNode } from 'react';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';
import { LandingCTA } from '@/components/landing/landing-cta';

// STRIPE_URL (Payment Link statique) RETIRÉ 2026-05-09. Le checkout passe
// désormais par /api/stripe/checkout (Checkout Session API) — cf gotcha #25.
// Ne PAS rebrancher cette URL : Stripe ignore client_reference_id sur les
// Payment Links statiques avec Link/Apple Pay -> profils DB cassés.

/** Alias legacy → utilise SectionEyebrow */
export function SectionTag({ children }: { children: ReactNode }) {
  return <SectionEyebrow className="mb-4 inline-block">{children}</SectionEyebrow>;
}

/** Alias legacy → mappe size lg/sm vers le LandingCTA 2026 */
export function CtaButton({
  href,
  size = 'lg',
  children,
}: {
  href: string;
  size?: 'lg' | 'sm';
  children: ReactNode;
}) {
  return (
    <LandingCTA href={href} size={size === 'lg' ? 'lg' : 'md'} glow={size === 'lg'}>
      {children}
    </LandingCTA>
  );
}

/** Liste des 7 contenus inclus (utilisée dans le pricing) */
export const CONTENTS_LIST = [
  { icon: '💜', name: 'Post Émotionnel' },
  { icon: '📚', name: 'Post Éducatif' },
  { icon: '🔥', name: 'Post Motivationnel' },
  { icon: '🔗', name: 'Bio Instagram' },
  { icon: '📧', name: 'Newsletter' },
  { icon: '✉️', name: 'Email de relance' },
  { icon: '🎬', name: 'Idée Réel + Script' },
];
