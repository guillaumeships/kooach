import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TIPS = [
  { num: '1', text: 'Décris ta cible avec précision (ex: "femmes 35-50 sédentaires")' },
  { num: '2', text: 'Colle 2-3 anciens posts pour calibrer ton style (Voice Cloning)' },
  { num: '3', text: 'Choisis un objectif clair pour orienter le ton' },
];

export function EmptyState({ onLoadExample }: { onLoadExample?: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-8 text-center">
        <div className="relative mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center">
          {/* Glow halo */}
          <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" aria-hidden />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-subtle via-primary-subtle to-primary-muted/30 text-primary shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.4)]">
            <Sparkles className="h-8 w-8" strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="font-display mb-2 text-2xl font-bold tracking-tight text-foreground">
          Prêt à créer ton premier contenu&nbsp;?
        </h2>
        <p className="mx-auto max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          Remplis ton profil dans la sidebar et génère 7 contenus en 60 secondes.
        </p>
      </div>

      <Card className="kk-card-premium kk-noise overflow-hidden p-5">
        <p className="font-display mb-4 text-[14px] italic text-primary/80">
          ✦ Pour de meilleurs résultats
        </p>
        <div className="flex flex-col gap-3.5">
          {TIPS.map((tip) => (
            <div key={tip.num} className="flex items-start gap-3">
              <span className="font-display flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary ring-1 ring-inset ring-primary/20">
                {tip.num}
              </span>
              <span className="text-[13.5px] leading-relaxed text-foreground/85">
                {tip.text}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {onLoadExample && (
        <Button
          variant="outline"
          block
          onClick={onLoadExample}
          className="mt-4 border-dashed border-primary/30 text-primary hover:border-primary/60 hover:bg-primary-subtle/40"
          leftIcon={Sparkles}
        >
          Pré-remplir avec un exemple coach sportif
        </Button>
      )}
    </div>
  );
}
