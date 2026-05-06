'use client';

/**
 * Mockup CSS du dashboard Kooach affiché dans le hero de la landing.
 *
 * Fenêtre style macOS + 3 cards (post émotionnel / éducatif / motivationnel)
 * avec un extrait réaliste de contenu coach. Anim stagger via Framer Motion.
 * Dark mode safe (couleurs via tokens HSL Tailwind).
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MockupProps {
  variant?: 'generic' | 'sportif';
}

type CardData = {
  icon: string;
  iconStyle: string;
  label: string;
  preview: string;
};

const CONTENT: Record<'generic' | 'sportif', CardData[]> = {
  generic: [
    {
      icon: '💜',
      iconStyle: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
      label: 'Post émotionnel',
      preview:
        "Hier, j'ai eu cette cliente en pleurs en consultation. Pas de drame. Juste l'émotion d'une petite victoire après 3 mois de travail. Et là j'ai réalisé que…",
    },
    {
      icon: '📚',
      iconStyle: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      label: 'Post éducatif',
      preview:
        "90% des gens font cette erreur en pensant bien faire. Ils confondent volonté et discipline. La volonté, c'est ponctuel. La discipline, c'est…",
    },
    {
      icon: '⚡',
      iconStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      label: 'Post motivationnel',
      preview:
        "Tu as commencé il y a 3 semaines. Tu vois pas encore les résultats. Et ton cerveau te dit déjà d'arrêter. Voilà ce qui se passe vraiment dans ton corps…",
    },
  ],
  sportif: [
    {
      icon: '💜',
      iconStyle: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
      label: 'Post émotionnel',
      preview:
        'Marie, 42 ans, m\'a dit hier : "C\'est la première fois en 10 ans que je me sens forte." Pas la plus performante. Forte. Et c\'est exactement…',
    },
    {
      icon: '📚',
      iconStyle: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      label: 'Post éducatif',
      preview:
        'Tu fais 3 séances par semaine et tu progresses pas ? Voilà la variable que 90% des gens ignorent — et qui change tout : la récup. Concrètement…',
    },
    {
      icon: '⚡',
      iconStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      label: 'Post motivationnel',
      preview:
        'Tu connais le pire moment d\'une transfo physique ? C\'est pas la 1ère semaine. C\'est la 4ème. Quand tu te dis "je vois rien". Voilà pourquoi ton corps…',
    },
  ],
};

export default function ProductMockup({ variant = 'generic' }: MockupProps) {
  const cards = CONTENT[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative mx-auto w-full max-w-[540px] overflow-hidden rounded-2xl',
        'border border-border/70 bg-card',
        'shadow-kk-lg shadow-[0_32px_80px_-20px_rgba(0,0,0,0.18),0_12px_32px_-12px_hsl(var(--primary)/0.18)]',
      )}
    >
      {/* Barre de fenêtre macOS */}
      <div className="flex items-center gap-1.5 border-b border-border/70 bg-muted/40 px-3.5 py-2.5 dark:bg-muted/20">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <div className="ml-2 flex-1 rounded-md border border-border/60 bg-background px-2.5 py-0.5 text-center font-mono text-[11px] text-muted-foreground/80">
          kooach.fr/app
        </div>
      </div>

      {/* En-tête dashboard */}
      <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3 text-[12px]">
        <span className="font-semibold text-foreground">7 contenus générés</span>
        <span className="rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-0.5 text-[10px] font-semibold text-primary">
          {variant === 'sportif' ? 'Coach sportif' : 'Coach nutrition'}
        </span>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
          🔥 5 jours
        </span>
      </div>

      {/* Liste cards */}
      <div className="flex flex-col gap-2.5 px-4 pb-5 pt-3.5">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 transition-colors hover:border-primary/30"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-[26px] w-[26px] items-center justify-center rounded-md text-[14px]',
                  c.iconStyle,
                )}
              >
                {c.icon}
              </span>
              <span className="text-[12px] font-semibold text-foreground">{c.label}</span>
            </div>
            <p className="line-clamp-3 text-[12px] leading-[1.55] text-foreground/75">
              {c.preview}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Fade-out bottom */}
      <div
        className="pointer-events-none -mt-7 h-7 bg-gradient-to-b from-transparent to-card"
        aria-hidden
      />
    </motion.div>
  );
}
