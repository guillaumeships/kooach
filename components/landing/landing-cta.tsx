import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CTA primary avec glow pulse + arrow translate au hover.
 * Pattern signature 2026 (Linear, Vercel, Cursor).
 */
export function LandingCTA({
  href,
  children,
  size = 'lg',
  glow = true,
  className,
}: {
  href: string;
  children: React.ReactNode;
  size?: 'lg' | 'md';
  glow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-all duration-200',
        'shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.4)]',
        'hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-4px_hsl(var(--primary)/0.5)]',
        'active:translate-y-0 active:scale-[0.98]',
        glow && 'kk-glow-ready',
        size === 'lg' ? 'px-7 py-3.5 text-[15px]' : 'px-5 py-2.5 text-[14px]',
        className,
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * CTA secondary outline — "Voir un exemple", "Page dédiée", etc.
 */
export function LandingCTASecondary({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-5 py-2.5 text-[14px] font-medium text-foreground/80 backdrop-blur-sm transition-all duration-200',
        'hover:border-primary/40 hover:bg-card hover:text-foreground',
        className,
      )}
    >
      {children}
    </Link>
  );
}
