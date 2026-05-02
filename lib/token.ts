/**
 * lib/token.ts
 *
 * Gestion des tokens d'accès Kooach.
 *
 * Format : base64url(JSON{ email, exp }).hmac_sha256_hex_32chars
 * Exemple : eyJlbWFpbCI6...dGVzdEB0ZXN0LmZy.a1b2c3d4e5f6...
 *
 * - La partie avant le dernier "." est le payload (JSON encodé en base64url)
 * - La partie après le "." est la signature HMAC-SHA256, tronquée à 32 caractères hex
 * - Le token est stocké côté client dans localStorage, clé : kk_t
 * - Expiration : 30 jours après création
 */

import { createHmac } from 'crypto';

// Structure interne du payload décodé
interface TokenPayload {
  email: string;
  exp: number; // timestamp en millisecondes
}

/**
 * Crée un token d'accès valable 30 jours pour l'email donné.
 * Utilisé dans api/webhook/route.ts après confirmation du paiement Stripe.
 */
export function makeToken(email: string): string {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) throw new Error('TOKEN_SECRET manquant');

  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');

  const sig = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 32);

  return `${payload}.${sig}`;
}

/**
 * Vérifie qu'un token est valide (signature correcte + non expiré).
 * Retourne true ou false — ne lance jamais d'exception.
 */
export function isValidToken(token: unknown): boolean {
  return getTokenEmail(token) !== null;
}

/**
 * Extrait l'email depuis un token valide.
 * Retourne null si le token est invalide ou expiré.
 * C'est la fonction à utiliser dans les routes API pour identifier l'utilisateur.
 */
export function getTokenEmail(token: unknown): string | null {
  if (!token || typeof token !== 'string') return null;

  const secret = process.env.TOKEN_SECRET;
  if (!secret) return null;

  try {
    const dot = token.lastIndexOf('.');
    if (dot < 1) return null;

    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    // Recalcule la signature attendue et compare
    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .slice(0, 32);

    if (sig !== expected) return null;

    // Décode le payload et vérifie l'expiration
    const { email, exp }: TokenPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    );

    if (typeof exp !== 'number' || Date.now() > exp) return null;
    if (!email || typeof email !== 'string') return null;

    return email;
  } catch {
    // Token malformé → invalide silencieusement
    return null;
  }
}
