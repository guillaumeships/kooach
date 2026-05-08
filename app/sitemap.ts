/**
 * app/sitemap.ts
 *
 * Génère automatiquement /sitemap.xml.
 *
 * Pages publiques indexables :
 *   - /                       (landing coachs sportifs FR — niche unique)
 *   - /generateur-accroches   (lead magnet — outil gratuit, levier SEO)
 *   - /blog                   (index articles SEO)
 *   - /blog/[slug]            (chaque article)
 *   - /mentions-legales       (obligation légale)
 *
 * /coach-sportif a fusionné dans / (mai 2026, redirect 301 dans next.config.mjs).
 * Pas d'inclusion de /app, /success, /recover-access (cf. robots.ts).
 */

import type { MetadataRoute } from 'next';

import { getAllPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kooach.fr';
  const lastModified = new Date();

  const blogPosts = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/generateur-accroches`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/generateur-bio-instagram-coach-sportif`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...blogPosts,
    {
      url: `${base}/qui-sommes-nous`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/newsletter`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}/mentions-legales`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
