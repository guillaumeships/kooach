import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getAllSlugs, getAllPosts, getPostBySlug, formatBlogDate } from '@/lib/blog';

import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingCTA } from '@/components/landing/landing-cta';

interface Params {
  slug: string;
}

// SSG : pré-génère toutes les routes au build (pas de SSR runtime).
export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Article introuvable' };

  const canonical = `https://kooach.fr/blog/${post.slug}`;

  return {
    title: `${post.title} · Blog Kooach`,
    description: post.description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt,
      url: canonical,
      type: 'article',
      locale: 'fr_FR',
      publishedTime: post.date,
      ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
    },
    alternates: { canonical },
  };
}

export default function BlogPostPage({ params }: { params: Params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  // JSON-LD Article schema (SEO++ pour Google rich results)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description || post.excerpt,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'Kooach',
      url: 'https://kooach.fr',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kooach',
      url: 'https://kooach.fr',
    },
    mainEntityOfPage: `https://kooach.fr/blog/${post.slug}`,
  };

  // BreadcrumbList schema → Google affiche un fil d'Ariane dans les SERP
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://kooach.fr' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://kooach.fr/blog' },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://kooach.fr/blog/${post.slug}`,
      },
    ],
  };

  // 2 articles "à lire aussi" (excluant l'article courant)
  const relatedPosts = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <LandingNav />

      <main className="min-h-screen bg-background pb-24 pt-32 sm:pt-36">
        <article className="mx-auto max-w-[720px] px-[6%]">
          {/* Back to blog link */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            <span aria-hidden>←</span> Retour au blog
          </Link>

          {/* Article header */}
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
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

            <h1
              className="font-display mb-5 font-bold text-foreground"
              style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-1.2px' }}
            >
              {post.title}
            </h1>

            {post.description && (
              <p
                className="text-muted-foreground"
                style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.6 }}
              >
                {post.description}
              </p>
            )}
          </header>

          {/* Article body — typography prose pour le rendu markdown */}
          <div
            className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-[28px] prose-h2:leading-tight
              prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-[20px]
              prose-p:text-[16.5px] prose-p:leading-[1.75] prose-p:text-foreground/90
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4
              prose-em:text-foreground prose-em:italic
              prose-li:text-[16px] prose-li:leading-relaxed prose-li:text-foreground/90
              prose-blockquote:border-l-primary prose-blockquote:bg-primary-subtle/40
              prose-blockquote:rounded-r-md prose-blockquote:py-1 prose-blockquote:not-italic
              prose-blockquote:text-foreground/80
              prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5
              prose-code:text-[14px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA fin d'article — pousser vers le lead magnet (gratuit, low friction) */}
          <aside className="mt-16 rounded-2xl border border-border bg-card p-7 shadow-kk-md sm:p-9">
            <p className="font-display mb-2 text-[11.5px] font-bold uppercase tracking-[1.5px] text-primary">
              ✦ Outil gratuit
            </p>
            <h3
              className="font-display mb-3 font-bold text-foreground"
              style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', lineHeight: 1.2, letterSpacing: '-0.5px' }}
            >
              Génère 10 accroches Instagram en 30 secondes
            </h3>
            <p className="mb-5 text-[15px] leading-relaxed text-muted-foreground">
              Donne ta niche sportive et ton sujet du jour, on te génère 10 accroches
              calibrées coachs FR. Gratuit, sans inscription Kooach.
            </p>
            <LandingCTA href="/generateur-accroches" size="md">
              Tester l'outil gratuit
            </LandingCTA>
          </aside>

          {/* À lire aussi — internal linking SEO + temps de session ↑ + bounce ↓ */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 border-t border-border pt-12">
              <p className="font-display mb-6 text-[11.5px] font-bold uppercase tracking-[1.5px] text-primary">
                ✦ À lire aussi
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {relatedPosts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group block rounded-xl border border-border bg-card p-5 no-underline transition-all hover:border-primary/40 hover:shadow-kk-md"
                  >
                    {p.category && (
                      <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-primary">
                        {p.category}
                      </p>
                    )}
                    <h4
                      className="font-display mb-2 font-bold leading-tight text-foreground group-hover:text-primary"
                      style={{ fontSize: '18px', letterSpacing: '-0.3px' }}
                    >
                      {p.title}
                    </h4>
                    <p className="text-[13.5px] leading-relaxed text-muted-foreground line-clamp-3">
                      {p.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <LandingFooter />
    </>
  );
}
