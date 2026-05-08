/**
 * app/robots.ts
 *
 * Génère automatiquement /robots.txt à la racine du domaine.
 *
 * On autorise tout sauf :
 *   - /app/* (dashboard privé, accès par token, indexer ne servirait à rien)
 *   - /api/* (routes serveur)
 *   - /success (page post-paiement, pas indexable)
 *   - /recover-access (formulaire, pas de contenu utile)
 */

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/api/', '/success', '/recover-access'],
    },
    sitemap: 'https://kooach.fr/sitemap.xml',
  };
}
