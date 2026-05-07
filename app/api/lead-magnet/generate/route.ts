/**
 * app/api/lead-magnet/generate/route.ts
 *
 * POST /api/lead-magnet/generate
 *
 * Endpoint public (pas d'auth) qui :
 *   1. Valide le body via zod
 *   2. Rate-limit par IP (3 générations / 24h, hash SHA-256 RGPD-safe)
 *   3. Génère 10 accroches via Claude (Vercel AI SDK + Gateway)
 *   4. Insert ligne en DB (lead_magnet_subscribers) avec hooks snapshot
 *   5. Envoie l'email J0 avec les 10 accroches (Resend)
 *   6. Retourne { hooks } au client
 *
 * En cas d'erreur Resend, on swallow (les hooks sont déjà en DB, on pourra
 * relancer l'envoi via job). On ne fait pas planter la requête utilisateur.
 */

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import { getSupabase } from '@/lib/supabase';
import { generateHooks } from '@/lib/lead-magnet/generate';
import { sendLeadMagnetHooksEmail } from '@/lib/lead-magnet/email';
import { leadMagnetRequestSchema } from '@/lib/lead-magnet/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_IP_LIMIT = 3;

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

/**
 * IP cliente fiable côté Vercel.
 *
 * `x-forwarded-for` est un header arbitraire que n'importe qui peut injecter
 * → un attaquant fait varier la valeur pour bypass le rate-limit IP. Vercel
 * append à ce header au lieu de l'écraser, donc le 1er hop n'est PAS de
 * confiance.
 *
 * Sources de confiance par ordre :
 * 1. `x-vercel-forwarded-for` — header signé par l'edge Vercel (1 valeur fiable)
 * 2. `x-real-ip` — header injecté par certains proxies (moins courant)
 * 3. dernier hop de `x-forwarded-for` — Vercel append le client réel à droite
 * 4. fallback "unknown"
 */
function getClientIp(req: Request): string {
  const vercelXff = req.headers.get('x-vercel-forwarded-for');
  if (vercelXff) return vercelXff.split(',')[0].trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // Sur Vercel, le client réel est en DERNIER (Vercel append).
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return 'unknown';
}

export async function POST(req: Request) {
  // 1. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const parsed = leadMagnetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Champs invalides. Vérifie ta niche, ton sujet (3 à 120 car), ton objectif et ton email.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

  const db = getSupabase();

  // 2. Rate-limit par IP : compte les inserts dans les dernières 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db
    .from('lead_magnet_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since);

  if (countError) {
    console.error('lead-magnet: erreur count rate-limit —', countError.message);
    // En cas d'erreur DB on laisse passer (faux positif > faux négatif)
  } else if ((count ?? 0) >= DAILY_IP_LIMIT) {
    return NextResponse.json(
      { error: 'Limite quotidienne atteinte (3 générations / 24h). Reviens demain.' },
      { status: 429 },
    );
  }

  // 3. Génère les 10 accroches via Claude
  let hooks;
  try {
    const result = await generateHooks(input);
    hooks = result.hooks;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('lead-magnet: erreur generation IA —', message, err);
    return NextResponse.json(
      {
        error: 'La génération a échoué. Réessaye dans 30 secondes.',
        ...(process.env.NODE_ENV !== 'production' && { debug: message }),
      },
      { status: 502 },
    );
  }

  // 4. Insert en DB
  const { data: row, error: insertError } = await db
    .from('lead_magnet_subscribers')
    .insert({
      email: input.email.toLowerCase().trim(),
      niche: input.niche,
      topic: input.topic,
      goal: input.goal,
      hooks,
      ip_hash: ipHash,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('lead-magnet: erreur insert —', insertError.message);
    // On n'échoue pas la requête : l'utilisateur a quand même ses hooks
  }

  // 5. Envoie l'email J0 (best-effort)
  try {
    await sendLeadMagnetHooksEmail({
      to: input.email,
      topic: input.topic,
      hooks,
    });

    if (row?.id) {
      await db
        .from('lead_magnet_subscribers')
        .update({ pdf_sent_at: new Date().toISOString() })
        .eq('id', row.id);
    }
  } catch (err) {
    console.error('lead-magnet: erreur envoi email J0 —', err);
    // On swallow : les hooks sont déjà en DB, on pourra relancer l'envoi.
  }

  return NextResponse.json({ hooks });
}
