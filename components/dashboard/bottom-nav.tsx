'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { History, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BottomNav 2026 — floating pill tab bar avec bouton "Créer" central dominant.
 *
 * Structure 3 slots : Historique · [CRÉER ★ proéminent] · Compte
 * (Stats supprimé — les stats clés vivent maintenant dans le hero /account).
 *
 * Pattern signature 2026 (Threads, Cursor, Raycast mobile) :
 *   - Floating (pas attaché au bottom edge)
 *   - Backdrop-blur prononcé + glassmorphism
 *   - Bouton central "Créer" plus gros (h-14 w-14), élevé visuellement
 *     (-translate-y-2.5), glow primary continu — l'œil va direct dessus
 *   - Pill indicator animé (Motion layoutId) sur les items secondaires
 *   - Safe-area iOS bottom (home indicator)
 */

export function BottomNav() {
  const pathname = usePathname();
  const isCreatePage = pathname === '/app';

  return (
    <nav
      className="kk-bottom-nav-2026 pointer-events-none fixed inset-x-0 bottom-0 z-25 px-4 md:hidden"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      aria-label="Navigation principale"
    >
      <div className="pointer-events-auto mx-auto flex max-w-sm items-center justify-around gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:bg-[hsl(220_13%_12%)]/80">
        {/* Slot 1 — Historique */}
        <NavItem href="/app/history" label="Historique" Icon={History} pathname={pathname} />

        {/* Slot CENTRAL — Créer (proéminent, élevé visuellement) */}
        <Link
          href="/app"
          aria-label="Créer du contenu"
          className={cn(
            'relative -translate-y-2.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95',
            'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground',
            'shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.55),0_0_0_4px_hsl(var(--background))]',
            !isCreatePage && 'kk-glow-ready',
          )}
        >
          {isCreatePage && (
            <motion.span
              layoutId="bnav-create-ring"
              className="absolute inset-0 rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <Sparkles className="relative h-6 w-6" strokeWidth={2.4} />
        </Link>

        {/* Slot 2 — Compte (les stats sont accessibles dans /account) */}
        <NavItem href="/app/account" label="Compte" Icon={User} pathname={pathname} />
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  Icon,
  pathname,
}: {
  href: string;
  label: string;
  Icon: typeof History;
  pathname: string;
}) {
  const active = pathname === href || (href !== '/app' && pathname.startsWith(href + '/'));
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-12 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full transition-colors"
    >
      {active && (
        <motion.span
          layoutId="bnav-secondary-active"
          className="absolute inset-0 rounded-full bg-primary/10"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          'relative h-[18px] w-[18px] transition-colors',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
        strokeWidth={active ? 2.4 : 2}
      />
      <span
        className={cn(
          'relative text-[10px] leading-none transition-colors',
          active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground',
        )}
      >
        {label}
      </span>
    </Link>
  );
}
