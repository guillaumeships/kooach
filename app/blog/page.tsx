import type { Metadata } from 'next';
import Link from 'next/link';

import { getAllPosts, formatBlogDate } from '@/lib/blog';

import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';

export const metadata: Metadata = {
  title: 'Blog Kooach — Conseils pour coachs sportifs FR',
  description:
    'Stratégies Instagram, copywriting et marketing pour coachs sportifs français. Articles courts, actionnables, écrits par un coach pour des coachs.',
  openGraph: {
    title: 'Blog Kooach — Conseils pour coachs sportifs FR',
    description:
      'Stratégies Instagram, copywriting et marketing pour coachs sportifs français.',
    url: 'https://kooach.fr/blog',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://kooach.fr/blog' },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <LandingNav />

      <main className="min-h-screen bg-background pb-24 pt-32 sm:pt-36">
        {/* Aurora hero discrète pour matcher la DA landing */}
        <div className="kk-mesh-hero" aria-hidden="true" />
        <div className="kk-noise pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative z-[1] mx-auto max-w-[840px] px-[6%]">
          {/* Header */}
          <header className="mb-14 text-center">
            <SectionEyebrow className="mb-4 inline-block">✦ Le blog Kooach</SectionEyebrow>
            <h1
              className="font-display mb-4 font-bold text-foreground"
              style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-1.5px' }}
            >
              Pour les coachs qui en ont marre <em className="italic text-primary">de galérer sur Insta</em>.
            </h1>
            <p
              className="mx-auto text-muted-foreground"
              style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', lineHeight: 1.6, maxWidth: 580 }}
            >
              Stratégies, exemples, et templates concrets pour transformer ton compte
              en machine à clients — sans y passer 2h par jour.
            </p>
          </header>

          {/* Articles list */}
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Premier article en cours d'écriture — reviens dans quelques jours ✦
            </p>
          ) : (
            <ul className="space-y-6">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="kk-card-premium kk-noise group block rounded-2xl border border-border bg-card p-6 no-underline transition-transform duration-200 hover:-translate-y-0.5 sm:p-8"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                      {post.category && (
                        <span className="font-display text-[11px] font-bold uppercase tracking-[1.5px] text-primary">
                          ✦ {post.category}
                        </span>
                      )}
                      {post.category && <span className="text-border">·</span>}
                      <span>{formatBlogDate(post.date)}</span>
                      {post.readTime && (
                        <>
                          <span className="text-border">·</span>
                          <span>{post.readTime} min de lecture</span>
                        </>
                      )}
                    </div>

                    <h2
                      className="font-display mb-2 font-bold text-foreground transition-colors group-hover:text-primary"
                      style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', lineHeight: 1.2, letterSpacing: '-0.5px' }}
                    >
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-[15px] leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary">
                      Lire l'article
                      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <LandingFooter />
    </>
  );
}
