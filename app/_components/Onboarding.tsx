'use client';

/**
 * Modal d'onboarding affichée UNE SEULE FOIS au premier accès au dashboard.
 *
 * Stockage : flag booléen dans localStorage (clé `kk_onboarded`).
 *   - absent → on affiche la modal
 *   - "1"   → l'utilisateur a vu/skip l'onboarding, on n'affiche plus
 */

import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Target, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const ONBOARDED_KEY = 'kk_onboarded';

type IconComponent = React.ComponentType<{ className?: string }>;

interface Step {
  num:   string;
  title: string;
  body:  string;
  Icon:  IconComponent;
}

const STEPS: Step[] = [
  {
    num:   '1',
    Icon:  Sparkles,
    title: 'Remplis ton profil',
    body:  'Spécialité, style, mots-clés, cible. Plus tu es précis, plus le contenu te ressemble. Tu peux aussi coller 2-3 anciens posts pour calibrer ton ton.',
  },
  {
    num:   '2',
    Icon:  Target,
    title: 'Choisis un objectif (optionnel)',
    body:  "Attirer des DMs, décrocher des RDV, vendre ton programme, gagner en notoriété. L'objectif oriente le ton et l'angle du contenu.",
  },
  {
    num:   '3',
    Icon:  Wand2,
    title: 'Génère tes 7 contenus',
    body:  'Un clic. 30-45 secondes. Tu obtiens 7 contenus prêts à publier : 3 posts Instagram, ta bio, ta newsletter, un email de relance, et une idée de réel + son script.',
  },
];

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(ONBOARDED_KEY) !== '1') {
      const t = setTimeout(() => setOpen(true), 350);
      return () => clearTimeout(t);
    }
  }, []);

  function close() {
    localStorage.setItem(ONBOARDED_KEY, '1');
    setOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.Icon;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      {/* Note : pas de `kk-card-premium` ici — cette classe applique un transform
          au hover qui override le translate-x/y de centrage du DialogContent et
          fait sortir la modal du viewport sur mobile. Le DialogContent shadcn a
          déjà bg-card + border + shadow, suffisant pour un rendu propre. */}
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-8 sm:rounded-2xl">
        {/* Icon hero */}
        <div className="text-center">
          <div className="relative mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-md" aria-hidden />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle text-primary">
              <Icon className="h-7 w-7" />
            </div>
          </div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            ✦ Étape {current.num} sur {STEPS.length}
          </p>
        </div>

        {/* Titre + body */}
        <h2 className="font-display mt-1 text-center text-[24px] font-bold leading-tight tracking-tight text-foreground">
          {current.title}
        </h2>
        <p className="text-center text-[14.5px] leading-[1.65] text-muted-foreground">
          {current.body}
        </p>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                i === step ? 'w-6 bg-primary' : 'w-2 bg-border',
              )}
            />
          ))}
        </div>

        {/* CTA + skip */}
        <div className="flex flex-col gap-2">
          <Button block size="lg" rightIcon={isLast ? Sparkles : ArrowRight} onClick={next}>
            {isLast ? "C'est parti" : 'Suivant'}
          </Button>
          <Button variant="ghost" size="sm" onClick={close} className="self-center">
            Passer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
