/**
 * lib/blog.ts
 *
 * Moteur de blog markdown. Lit les fichiers .md depuis content/blog/,
 * parse le frontmatter avec gray-matter, et expose des helpers pour
 * lister/charger les articles.
 *
 * Pas de DB, pas de CMS — fichier = source de vérité. Ajouter un article
 * = créer un .md, commit, push. Vercel rebuild en SSG.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;          // ISO YYYY-MM-DD
  excerpt?: string;      // optionnel — sinon généré depuis le content
  category?: string;     // ex: "SEO", "Stratégie", "Outils"
  readTime?: number;     // minutes (auto-calc si absent)
  ogImage?: string;      // override OG image, sinon fallback /img/kooach-logo.svg
}

export interface BlogPost extends BlogPostMeta {
  content: string;       // HTML rendu depuis le markdown
  raw: string;           // markdown brut (utile pour reading time, SEO)
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog');

// Configure marked pour produire du HTML propre (pas de iframe, pas de JS).
marked.setOptions({
  gfm: true,        // tables, strikethrough, task lists
  breaks: false,    // un saut de ligne markdown ne crée pas un <br>
});

/**
 * Liste tous les articles publiés, triés par date descendante.
 * Tronqués au meta — pas le content (économise du build time).
 */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);

    return {
      slug,
      title: String(data.title ?? slug),
      description: String(data.description ?? ''),
      date: String(data.date ?? ''),
      excerpt: data.excerpt ? String(data.excerpt) : extractExcerpt(content),
      category: data.category ? String(data.category) : undefined,
      readTime: data.readTime ? Number(data.readTime) : estimateReadTime(content),
      ogImage: data.ogImage ? String(data.ogImage) : undefined,
    } satisfies BlogPostMeta;
  });

  // Tri date desc — le plus récent en premier.
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Charge un article complet (meta + content rendu en HTML).
 * Retourne null si le slug n'existe pas (la page appelante renverra 404).
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const html = marked.parse(content) as string;

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    date: String(data.date ?? ''),
    excerpt: data.excerpt ? String(data.excerpt) : extractExcerpt(content),
    category: data.category ? String(data.category) : undefined,
    readTime: data.readTime ? Number(data.readTime) : estimateReadTime(content),
    ogImage: data.ogImage ? String(data.ogImage) : undefined,
    content: html,
    raw: content,
  };
}

/**
 * Liste tous les slugs (utilisé par generateStaticParams sur la route SSG).
 */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

// ── Helpers internes ────────────────────────────────────────────────────────

function estimateReadTime(content: string): number {
  // 200 mots/min en lecture FR (étude moyenne).
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function extractExcerpt(content: string, maxLen = 160): string {
  // Première phrase significative (skip headings, listes, code blocks).
  const lines = content.split('\n').filter((l) => {
    const trimmed = l.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('#')) return false;
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) return false;
    if (trimmed.startsWith('```')) return false;
    if (trimmed.startsWith('>')) return false;
    return true;
  });

  const firstPara = lines[0] ?? '';
  // Strip markdown emphasis basics.
  const clean = firstPara.replace(/[*_`]/g, '');

  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

/**
 * Format date FR (ex: "8 mai 2026") — pour l'affichage public.
 */
export function formatBlogDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
