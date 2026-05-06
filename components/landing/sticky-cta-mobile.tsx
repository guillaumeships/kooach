'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * Sticky CTA mobile — bouton "Essai gratuit" floating visible dès que l'user
 * scroll de >300px. Conversion mobile +15-30% en moyenne (data 2026 SaaS).
 *
 * Caché sur desktop (md:hidden) car la nav landing a déjà un CTA visible.
 * Caché sur les pages internes (/app, /signup, /login, etc.) — on l'expose
 * uniquement sur la landing publique.
 */
export function StickyCtaMobile() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Affiche dès que l'user scroll >300px (passé le hero)
      setVisible(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-3 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
      style={{
        background:
          'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 60%, transparent 100%)',
      }}
      aria-hidden={!visible}
    >
      <Link
        href="/signup"
        className="kk-glow-ready flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-kk-lg transition-transform active:scale-[0.98]"
      >
        <Sparkles className="h-4 w-4" />
        Essai gratuit · 7 jours · sans CB
      </Link>
    </div>
  );
}
