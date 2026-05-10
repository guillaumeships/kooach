/**
 * app/api/newsletter/subscribe/route.ts
 *
 * POST /api/newsletter/subscribe
 *
 * Endpoint public (pas d'auth) qui :
 *   1. Valide l'email
 *   2. Insert ou ignore (UNIQUE constraint sur email = idempotent)
 *   3. Envoie l'email de bienvenue Resend (best-effort)
 *   4. Retourne { ok: true } systématiquement (pas de leak "email déjà inscrit")
 */

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';

import { getSupabase } from '@/lib/supabase';
import { sendNewsletterWelcomeEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const subscribeSchema = z.object({
  email:  z.string().email().max(254),
  source: z.string().max(60).optional(),
});

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

/** IP cliente fiable côté Vercel (cf gotchas). */
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
  }

  const email   = parsed.data.email.toLowerCase().trim();
  const source  = parsed.data.source?.slice(0, 60) ?? null;
  const ipHash  = hashIp(getClientIp(req));
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

  const db = getSupabase();

  // Insert avec ON CONFLICT DO NOTHING (UNIQUE sur email = idempotent).
  // Si le user était déjà inscrit, on ne renvoie PAS d'erreur (anti-énumération
  // emails) et on n'envoie pas un 2e mail de bienvenue.
  const { error: insertError, count } = await db
    .from('newsletter_subscribers')
    .insert(
      {
        email,
        source,
        ip_hash:    ipHash,
        user_agent: userAgent,
      },
      { count: 'exact' },
    );

  // Code 23505 = UNIQUE violation = déjà inscrit. On l'ignore silencieusement.
  if (insertError && insertError.code !== '23505') {
    console.error('newsletter: erreur insert —', insertError.message);
    // On ne fail pas la requête côté UX (le user a "réussi" à s'inscrire).
  }

  // N'envoie le mail de bienvenue que si l'insert a vraiment créé une nouvelle ligne
  // (count > 0). Sinon le user était déjà inscrit, pas besoin de re-mailer.
  if ((count ?? 0) > 0 || insertError === null) {
    try {
      await sendNewsletterWelcomeEmail(email);
    } catch (err) {
      console.error('newsletter: erreur envoi welcome —', err instanceof Error ? err.message : err);
      // Swallow : l'inscription est en DB, on relancera l'envoi via job si besoin.
    }
  }

  return NextResponse.json({ ok: true });
}
