'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { LandingCTA } from '@/components/landing/landing-cta';
import { ThemeToggleCompact } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'exemples', label: 'Exemples' },
  { id: 'tarifs',   label: 'Tarifs' },
  { id: 'faq',      label: 'FAQ' },
] as const;

// Liens externes (pages séparées) affichés dans la nav desktop pour visibilité.
const FREE_TOOL_HREF = '/generateur-accroches';
const BLOG_HREF = '/blog';

/**
 * Nav fixed-top en pill rounded backdrop-blur 2026.
 * - Active state via IntersectionObserver (scroll spy) — pattern Linear / Vercel
 * - Mobile : login icon-only, theme toggle visible
 * - Desktop : 3 nav items + theme + login texte + CTA gros
 */
export function LandingNav() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Scroll spy : active la nav item quand sa section est >= 50% dans le viewport.
  // S'auto-désactive sur les pages qui n'ont pas ces ancres (ex: /generateur-accroches).
  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
    );

    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return (
    <nav className="nav-in fixed left-0 right-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:gap-4 sm:px-5">
        <Link
          href="/"
          className="font-display flex shrink-0 items-center gap-2 text-[19px] italic tracking-tight text-primary no-underline sm:text-[20px]"
        >
          {/* Logo image cachée mobile pour dégager de l'espace au header */}
          <Image src="/img/logo.svg" alt="" width={24} height={24} className="hidden shrink-0 sm:block" />
          Kooach
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {SECTIONS.map(({ id, label }) => {
            const isActive = activeSection === id;
            return (
              <Link
                key={id}
                href={`/#${id}`}
                className={cn(
                  'relative text-[13.5px] font-medium no-underline transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                {/* Underline animé sur l'item actif */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute -bottom-1 left-0 h-[2px] rounded-full bg-primary transition-all duration-300',
                    isActive ? 'w-full opacity-100' : 'w-0 opacity-0',
                  )}
                />
              </Link>
            );
          })}
          {/* Blog — page séparée, pas de scroll spy */}
          <Link
            href={BLOG_HREF}
            className={cn(
              'relative text-[13.5px] font-medium no-underline transition-colors',
              pathname?.startsWith('/blog')
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Blog
            <span
              aria-hidden
              className={cn(
                'absolute -bottom-1 left-0 h-[2px] rounded-full bg-primary transition-all duration-300',
                pathname?.startsWith('/blog') ? 'w-full opacity-100' : 'w-0 opacity-0',
              )}
            />
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Outil gratuit — 2 versions :
              - Mobile : icon-only ✨ rond (gain de place, signal porte d'entrée gratuite)
              - Desktop : pill avec label complet */}
          <Link
            href={FREE_TOOL_HREF}
            aria-label="Outil gratuit · 10 accroches Instagram"
            title="Outil gratuit · 10 accroches Instagram"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-subtle text-[14px] text-primary no-underline transition-colors hover:border-primary/40 sm:hidden"
          >
            <span aria-hidden>✨</span>
          </Link>
          <Link
            href={FREE_TOOL_HREF}
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-[12px] font-semibold text-primary no-underline transition-colors hover:border-primary/40 sm:inline-flex"
          >
            <span aria-hidden>✨</span>
            Outil gratuit
          </Link>
          <ThemeToggleCompact className="h-9 w-9" />

          {/* Login : caché mobile (header trop serré, l'user récurrent
              utilise /login direct ou le footer). Visible desktop. */}
          <Link
            href="/login"
            className="hidden h-9 items-center justify-center rounded-md px-3 text-[13.5px] font-medium text-muted-foreground no-underline transition-colors hover:text-foreground sm:inline-flex"
          >
            Se connecter
          </Link>

          <LandingCTA href="/signup" size="md" glow={false} className="whitespace-nowrap">
            Essai gratuit
          </LandingCTA>
        </div>
      </div>
    </nav>
  );
}
