/**
 * app/api/recover-access/route.ts
 *
 * POST /api/recover-access
 *
 * Permet à un utilisateur qui a perdu son lien d'accès (email supprimé, spam,
 * token expiré) de demander un nouveau lien.
 *
 * Sécurité :
 *   - Réponse identique que l'email existe ou non (anti-énumération).
 *   - Rate limit IP-based : 3 demandes / heure / IP.
 *   - Le lien n'est envoyé QUE si le profil existe ET subscription_active=true.
 *
 * Corps : { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { makeToken } from '@/lib/token';
import { getSupabase } from '@/lib/supabase';
import { sendAccessEmail } from '@/lib/email';

// Rate limit IP-based en mémoire (cf. note dans /api/generate)
const RECOVER_LIMIT_PER_HOUR = 3;
const RECOVER_WINDOW_MS = 60 * 60 * 1000;
const recoverBucket = new Map<string, number[]>();

function checkRecoverRate(ip: string): boolean {
  const now = Date.now();
  const recent = (recoverBucket.get(ip) ?? []).filter((t) => now - t < RECOVER_WINDOW_MS);
  if (recent.length >= RECOVER_LIMIT_PER_HOUR) return false;
  recent.push(now);
  recoverBucket.set(ip, recent);
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

// Validation simple d'un email — on n'a pas besoin d'une regex stricte, juste
// d'éviter d'envoyer du n'importe quoi à Resend.
function looksLikeEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 4 &&
    value.length < 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

// Réponse standard — toujours 200 OK avec le même message, qu'on ait trouvé
// l'email ou non. Empêche un attaquant de découvrir qui a un compte Kooach.
const GENERIC_OK = {
  ok: true,
  message: 'Si cet email correspond à un compte actif, tu vas recevoir un lien d\'accès dans quelques instants.',
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRecoverRate(ip)) {
    return NextResponse.json(
      { error: 'Trop de demandes. Réessaie dans une heure.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!looksLikeEmail(rawEmail)) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
  }

  // Vérifie si le compte existe et est actif. Aucune réponse différente côté
  // client : on retourne toujours GENERIC_OK pour ne pas leaker l'existence.
  const db = getSupabase();
  const { data: profile } = await db
    .from('profiles')
    .select('email, subscription_active')
    .eq('email', rawEmail)
    .maybeSingle();

  if (profile && profile.subscription_active) {
    try {
      const token = makeToken(rawEmail);
      await sendAccessEmail(rawEmail, token);
    } catch (e) {
      console.error('recover: erreur envoi —', e instanceof Error ? e.message : e);
      // On ne change PAS la réponse côté client — message générique inchangé.
    }
  }

  return NextResponse.json(GENERIC_OK);
}
