/** @type {import('next').NextConfig} */

import { withSentryConfig } from '@sentry/nextjs';

// Headers de sécurité appliqués à toutes les pages.
// - X-Frame-Options DENY     : empêche l'embed (clickjacking)
// - X-Content-Type-Options   : empêche le sniffing MIME
// - Referrer-Policy          : limite la fuite d'URL vers les domaines tiers
// - Permissions-Policy       : désactive caméra/micro/geo (on n'en utilise pas)
// - Strict-Transport-Security: force HTTPS en prod
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Pages auth : on ne veut pas que Google les indexe (résout les
      // "duplicate content" remontés par Search Console sur /login, et
      // évite des pages d'auth orphelines dans les résultats de recherche).
      {
        source: '/:path(login|signup|forgot-password|recover-access)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  async redirects() {
    return [
      // Force www.kooach.fr -> kooach.fr (308 permanent). Sans ça Google
      // indexe les 2 versions du site comme duplicate content (issue
      // remontée par Search Console : "Duplicate without user-selected
      // canonical" sur /login et /). Aussi : signal négatif Safe Browsing
      // (un site servi sur 2 hosts sans canonical clair = pattern cloaking).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kooach.fr' }],
        destination: 'https://kooach.fr/:path*',
        permanent: true,
      },
      // Pivot niche : la landing /coach-sportif a fusionné dans / (mai 2026).
      // 301 permanent pour préserver le SEO accumulé sur cette URL.
      { source: '/coach-sportif', destination: '/', permanent: true },
      // Googlebot a heuristiquement parsé "/mois" depuis le texte "29€/mois"
      // affiché sur le pricing. On redirige le 404 vers la section tarifs
      // plutôt que de laisser Search Console flag un "Not found".
      { source: '/mois', destination: '/#tarifs', permanent: true },
      // Article blog renommé "personal trainer" → "coach sportif" (alignement
      // sur le positionnement Kooach 100% coachs sportifs FR + meilleur volume
      // de recherche FR). Redirect au cas où l'ancien slug a été partagé.
      {
        source: '/blog/10-exemples-bio-instagram-personal-trainer',
        destination: '/blog/10-exemples-bio-instagram-coach-sportif',
        permanent: true,
      },
      // /app/stats supprimée (mai 2026) : les stats vivent maintenant dans
      // le hero de /app/account (4 stats : Abonnement / Streak / Contenus / Temps gagné).
      { source: '/app/stats', destination: '/app/account', permanent: true },
      // Compat backward des anciens emails magic link (/?token=xxx).
      // Google Safe Browsing flag ce pattern comme phishing — on redirige
      // côté server vers /auth/legacy-link sans JS sur la homepage.
      {
        source: '/',
        has: [{ type: 'query', key: 'token', value: '(?<token>.+)' }],
        destination: '/auth/legacy-link?token=:token',
        permanent: false,
      },
    ];
  },
};

// Sentry wrapper — n'expose les sourcemaps que si SENTRY_AUTH_TOKEN est défini.
// Sans token, le wrapper passe quand même mais ne tente pas l'upload.
const sentryEnabled = !!process.env.SENTRY_AUTH_TOKEN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;
