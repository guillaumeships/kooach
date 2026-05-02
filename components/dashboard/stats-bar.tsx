import { Flame, Sparkles, Clock } from 'lucide-react';
import { formatTimeSaved } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * StatsBar — version 2026 ultra-compacte (1 ligne, pas 3 cards).
 * Affiche les 3 stats inline avec icônes colorées dans une seule barre
 * floating au-dessus du contenu. Ratio info/surface optimisé.
 */
export function StatsBar({
  streak,
  total,
  className,
}: {
  streak: number;
  total: number;
  className?: string;
}) {
  const timeSaved = total === 0 ? '—' : formatTimeSaved(total).split(' ')[0];

  return (
    <div className={cn('flex items-center justify-center px-4 pt-4', className)}>
      <div className="kk-card-premium kk-noise inline-flex items-center gap-1 overflow-hidden rounded-full px-1.5 py-1">
        <StatPill
          icon={Flame}
          iconColor="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          label={streak === 0 ? 'Démarre' : `${streak}j`}
          sub={streak === 0 ? 'streak' : 'streak'}
        />
        <Divider />
        <StatPill
          icon={Sparkles}
          iconColor="bg-primary/15 text-primary"
          label={total === 0 ? '0' : String(total)}
          sub={total > 1 ? 'générés' : 'généré'}
        />
        <Divider />
        <StatPill
          icon={Clock}
          iconColor="bg-violet-500/15 text-violet-600 dark:text-violet-400"
          label={timeSaved}
          sub={total === 0 ? '—' : 'gagné'}
        />
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  iconColor,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1">
      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', iconColor)}>
        <Icon className="h-3 w-3" />
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-[15px] font-bold leading-none tracking-tight text-foreground tabular-nums">
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="h-3 w-px bg-border/60" aria-hidden />;
}
