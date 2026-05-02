'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Header partagé pour les pages /app/* (sauf /app qui a son propre header).
 *
 * Structure :
 *   - Bouton "← Dashboard" cliquable à gauche (retour /app)
 *   - Titre de page au centre/gauche selon contexte
 *   - Optionnel : actions à droite (CTA, settings, etc.)
 *
 * Visible UNIQUEMENT en desktop (mobile a la BottomNav qui sert de retour).
 */
export function AppPageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex items-start justify-between gap-4 max-md:hidden',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/app"
          className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Dashboard
        </Link>
        <span className="text-border" aria-hidden>
          /
        </span>
        <div>
          <h1 className="font-display text-[22px] font-bold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] leading-tight text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
