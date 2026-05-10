/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';

import { NewsletterForm } from './_components/newsletter-form';

import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';

export const metadata: Metadata = {
  title: 'Kooach Insider — Newsletter mensuelle pour coachs sportifs FR',
  description:
    "1 email par mois, 5 minutes de lecture : 1 stat fitness FR du mois + 1 tip Insta concret + les chiffres réels de Kooach en transparence. Gratuit, sans spam.",
  openGraph: {
    title: 'Kooach Insider — La newsletter des coachs sportifs FR',
    description:
      'Stats fitness FR, tips Insta, chiffres Kooach en transparence. 1 email par mois. Gratuit.',
    url: 'https://kooach.fr/newsletter',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://kooach.fr/newsletter' },
};

export default function NewsletterPage() {
  return (
    <>
      <LandingNav />
      <main className="bg-background">
        <section className="relative overflow-hidden pb-20 pt-32 sm:pt-36">
          <div className="kk-mesh-hero" aria-hidden="true" />
          <div className="kk-noise pointer-events-none absolute inset-0" aria-hidden />

          <div className="relative z-[1] mx-auto max-w-[680px] px-[6%]">
            <div className="text-center">
              <SectionEyebrow className="mb-5">✦ Kooach Insider</SectionEyebrow>

              <h1
                className="font-display mb-5 font-bold text-foreground"
                style={{ fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: '-1.5px' }}
              >
                La newsletter <em className="italic text-primary">des coachs sportifs FR</em>.
              </h1>

              <p
                className="mx-auto mb-10 text-muted-foreground"
                style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', lineHeight: 1.6, maxWidth: 540 }}
              >
                1 email par mois. 5 minutes de lecture. Pas de spam.
              </p>
            </div>

            <div className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl p-6 sm:p-8">
              <div className="mb-6">
                <p className="font-display mb-3 text-[12px] font-bold uppercase tracking-[1.5px] text-primary">
                  ✦ Ce que tu vas recevoir
                </p>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  <li className="flex gap-3 text-[15px] leading-relaxed text-foreground/90">
                    <span className="font-display text-primary">→</span>
                    <span>
                      <strong className="font-semibold">1 stat fitness FR du mois</strong>{' '}
                      qui change les règles du jeu (ce que les coachs qui scalent savent et que les autres ratent)
                    </span>
                  </li>
                  <li className="flex gap-3 text-[15px] leading-relaxed text-foreground/90">
                    <span className="font-display text-primary">→</span>
                    <span>
                      <strong className="font-semibold">1 tip Instagram concret</strong>{' '}
                      (pas du générique recyclé du US, du calibré coach sportif FR)
                    </span>
                  </li>
                  <li className="flex gap-3 text-[15px] leading-relaxed text-foreground/90">
                    <span className="font-display text-primary">→</span>
                    <span>
                      <strong className="font-semibold">Les chiffres réels de Kooach</strong>{' '}
                      en transparence — MRR, signups, churn, échecs. Pas de fioritures.
                    </span>
                  </li>
                </ul>
              </div>

              <NewsletterForm source="newsletter-page" />
            </div>

            <p className="mt-6 text-center text-[12.5px] text-muted-foreground/80">
              🔒 Pas de spam · désinscription en 1 clic · données stockées en France (Supabase UE)
            </p>

            <div className="mt-16 border-t border-border/60 pt-12">
              <p className="font-display mb-4 text-center text-[12px] font-bold uppercase tracking-[1.5px] text-primary">
                ✦ Pourquoi je l'écris
              </p>
              <p className="mx-auto max-w-[540px] text-center text-[15px] leading-relaxed text-muted-foreground">
                Je construis Kooach en solo, sans levée, depuis la France. Cette newsletter, c'est
                ma manière de partager ce que j'apprends — sur le marché du coaching sportif FR,
                sur la psychologie Insta 2026, sur les vrais chiffres d'un SaaS qui démarre. Tu
                liras un mois sur deux les choses qui ont marché, et un mois sur deux les choses
                qui n'ont pas marché. Les deux sont utiles.
              </p>
              <p className="mx-auto mt-4 max-w-[540px] text-center text-[13.5px] italic text-muted-foreground/70">
                — Guillaume
              </p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
