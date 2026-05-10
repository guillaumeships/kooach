/**
 * app/api/lead-magnet/generate-bio/route.ts
 *
 * POST /api/lead-magnet/generate-bio
 *
 * Endpoint public (pas d'auth) qui :
 *   1. Valide le body via zod (niche / specialty / city / goal / email)
 *   2. Rate-limit par IP (3 générations / 24h, hash SHA-256 RGPD-safe)
 *   3. Génère 5 bios via Claude (Vercel AI SDK + Gateway)
 *   4. Insert ligne en DB (lead_magnet_bio_subscribers)
 *   5. Envoie l'email J0 avec les 5 bios (Resend)
 *   6. Retourne { bios } au client
 *
 * Mêmes patterns que /api/lead-magnet/generate (hooks) — schémas séparés.
 */

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import { getSupabase } from '@/lib/supabase';
import { generateBios } from '@/lib/lead-magnet-bio/generate';
import { sendLeadMagnetBiosEmail } from '@/lib/lead-magnet-bio/email';
import { bioRequestSchema, BIO_NICHE_LABELS } from '@/lib/lead-magnet-bio/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_IP_LIMIT = 3;

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

/**
 * IP cliente fiable côté Vercel. Cf gotcha sécurité dans
 * `/api/lead-magnet/generate/route.ts` (même fonction).
 */
function getClientIp(req: Request): string {
  const vercelXff = req.headers.get('x-vercel-forwarded-for');
  if (vercelXff) return vercelXff.split(',')[0].trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
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

  const parsed = bioRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          'Champs invalides. Vérifie ta niche, ta spécialité (3 à 120 car), ton objectif et ton email.',
      },
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
    .from('lead_magnet_bio_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since);

  if (countError) {
    console.error('lead-magnet-bio: erreur count rate-limit —', countError.message);
    // Fail-open : on laisse passer (faux positif > faux négatif)
  } else if ((count ?? 0) >= DAILY_IP_LIMIT) {
    return NextResponse.json(
      { error: 'Limite quotidienne atteinte (3 générations / 24h). Reviens demain.' },
      { status: 429 },
    );
  }

  // 3. Génère les 5 bios via Claude
  let bios;
  try {
    const result = await generateBios(input);
    bios = result.bios;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('lead-magnet-bio: erreur generation IA —', message, err);
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
    .from('lead_magnet_bio_subscribers')
    .insert({
      email:     input.email.toLowerCase().trim(),
      niche:     input.niche,
      specialty: input.specialty,
      city:      input.city || null,
      goal:      input.goal,
      bios,
      ip_hash:   ipHash,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('lead-magnet-bio: erreur insert —', insertError.message);
  }

  // 5. Envoie l'email J0 (best-effort)
  try {
    await sendLeadMagnetBiosEmail({
      to:    input.email,
      niche: BIO_NICHE_LABELS[input.niche],
      bios,
    });

    if (row?.id) {
      await db
        .from('lead_magnet_bio_subscribers')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', row.id);
    }
  } catch (err) {
    console.error('lead-magnet-bio: erreur envoi email J0 —', err);
  }

  return NextResponse.json({ bios });
}
