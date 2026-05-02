'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CARDS, OBJECTIFS } from '@/lib/cards-config';
import { cn } from '@/lib/utils';

/**
 * DashboardHero — la zone main quand pas de génération en cours.
 *
 * 4 états contextuels :
 *   1. profileEmpty   → "Remplis ton profil" (nouveau user)
 *   2. ready          → "Tu es prêt" + gros CTA central + preview 7 cards (profil rempli, jamais généré)
 *   3. returning      → "Bon retour" + preview 7 cards (récurrent avec générations passées)
 *   4. streakActive   → bandeau célébration en plus si streak ≥ 3j
 */

export type DashboardState = 'profileEmpty' | 'ready' | 'returning';

interface DashboardHeroProps {
  state: DashboardState;
  totalGenerations: number;
  canGenerate: boolean;
  isAnyBusy: boolean;
  selectedObjectif: string;
  onGenerate: () => void;
  onObjectifSelect: (value: string) => void;
  onLoadExample?: () => void;
  onOpenProfile?: () => void;
}

export function DashboardHero({
  state,
  totalGenerations,
  canGenerate,
  isAnyBusy,
  selectedObjectif,
  onGenerate,
  onObjectifSelect,
  onLoadExample,
  onOpenProfile,
}: DashboardHeroProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6 md:px-6 md:py-10">
      {/* Eyebrow ✦ — desktop only, signature Kooach. Sur mobile,
          on libère l'écran et le H1 conversationnel suffit. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 text-center md:mb-6"
      >
        <p className="font-display mb-2 hidden text-[14px] italic text-primary/80 md:block">
          ✦ {EYEBROW[state]}
        </p>
        <h1
          className="font-display font-bold tracking-tight text-foreground"
          style={{ fontSize: 'clamp(26px, 4vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.8px' }}
        >
          {TITLE[state](totalGenerations)}
        </h1>
        <p className="mx-auto mt-2 hidden max-w-md text-[14.5px] leading-relaxed text-muted-foreground sm:block">
          {SUBTITLE[state]}
        </p>
      </motion.div>

      {/* Quick-start chips (objectif) — grid 2x2 mobile, 4-cols desktop.
          Tactile mobile-first 2026 : zone de hit ≥44px, pas de wrap aléatoire. */}
      {state !== 'profileEmpty' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 md:mb-7"
        >
          <p className="mb-2.5 text-center text-[13px] text-muted-foreground">
            Un objectif ?
            <span className="ml-1 text-muted-foreground/60">(optionnel)</span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {OBJECTIFS.map(({ value, icon }) => {
              const selected = selectedObjectif === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onObjectifSelect(selected ? '' : value)}
                  className={cn(
                    'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-[12px] font-medium leading-tight transition-all sm:flex-row sm:gap-1.5 sm:rounded-full sm:py-2 sm:text-[12.5px]',
                    selected
                      ? 'border-primary/40 bg-primary-subtle text-primary shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.3)]'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground',
                  )}
                >
                  <span className="text-[17px] leading-none sm:text-base">{icon}</span>
                  <span className="text-center">{value}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* CTA central dominant */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto mb-6 max-w-md md:mb-8"
      >
        {/* Halo glow primary derrière le CTA */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/15 blur-2xl"
          aria-hidden
        />

        {state === 'profileEmpty' ? (
          <div className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl p-6 text-center">
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              Avant de générer, remplis ton profil.{' '}
              <strong className="font-semibold text-foreground">30 secondes.</strong> On guide.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={onOpenProfile} leftIcon={Zap} size="lg">
                Remplir mon profil
              </Button>
              {onLoadExample && (
                <Button
                  variant="outline"
                  onClick={onLoadExample}
                  size="lg"
                  className="border-dashed border-primary/30 text-primary hover:border-primary/60"
                  leftIcon={Sparkles}
                >
                  Voir un exemple
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button
            block
            size="lg"
            disabled={!canGenerate || isAnyBusy}
            onClick={onGenerate}
            className={cn(
              'relative h-[58px] rounded-2xl text-[15.5px]',
              canGenerate && !isAnyBusy && 'kk-glow-ready',
            )}
          >
            <Sparkles className="h-5 w-5" />
            {state === 'returning' ? 'Générer 7 contenus' : 'Créer mes 7 contenus'}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        )}
        <p className="mt-2.5 text-center text-[12px] text-muted-foreground/70">
          {state === 'profileEmpty'
            ? '~60 s une fois ton profil rempli'
            : '~60 s · 7 contenus prêts à publier'}
        </p>
      </motion.div>

      {/* Menu visuel "Inclus dans chaque génération" — desktop only.
          Sur mobile : focus laser tool-first, on cache.
          Sur desktop : occupe l'espace vide naturellement avec un rappel
          des 7 contenus produits (chips icône + label tiny). Pattern menu
          plutôt que preview — pas de contenu, juste l'inventaire. */}
      {state !== 'profileEmpty' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-12 hidden max-w-2xl md:block"
        >
          <p className="font-display mb-3 text-center text-[13px] italic text-muted-foreground">
            ✦ Tu vas recevoir
          </p>
          <div className="grid grid-cols-7 gap-2">
            {CARDS.map((card) => (
              <div
                key={card.only}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-card/40 px-2 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-sm"
              >
                <span className="text-[18px] leading-none">{card.icon}</span>
                <span className="line-clamp-2 text-center text-[10.5px] leading-tight text-muted-foreground">
                  {card.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy par état
// ─────────────────────────────────────────────────────────────────────────────

const EYEBROW: Record<DashboardState, string> = {
  profileEmpty: 'Bienvenue',
  ready: 'Prêt',
  returning: 'Bon retour',
};

const TITLE: Record<DashboardState, (total: number) => string> = {
  profileEmpty: () => 'On commence par toi.',
  ready: () => 'Allez, on crée.',
  returning: () => 'On crée quoi aujourd’hui ?',
};

const SUBTITLE: Record<DashboardState, string> = {
  profileEmpty:
    'Remplis ton profil en 30 secondes, et Kooach écrira pour toi.',
  ready:
    'Choisis un objectif si tu veux. Sinon, lance la séquence directement.',
  returning:
    'Un objectif pour orienter le ton, ou lance directement.',
};
