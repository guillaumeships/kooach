/**
 * app/api/history/route.ts
 *
 * POST /api/history — retourne les N dernières générations de l'utilisateur
 * connecté.
 *
 * Authentification : Supabase Auth en priorité, fallback HMAC token.
 *
 * Corps : { token?, limit? }
 * Réponse : { items: GenerationItem[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthedEmail } from '@/lib/auth-server';
import { getSupabase } from '@/lib/supabase';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch { /* body vide accepté */ }

  const email = await getAuthedEmail(req, body);
  if (!email) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  const limitRaw = typeof body.limit === 'number' ? body.limit : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, Math.floor(limitRaw)), MAX_LIMIT);

  const db = getSupabase();
  const { data, error } = await db
    .from('generations')
    .select('id, created_at, post_emotionnel, post_educatif, post_motivationnel, bio_instagram, newsletter, email_relance, reel_idee, reel_script')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('history: erreur lecture —', error.message);
    return NextResponse.json({ error: 'Erreur de chargement.' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
