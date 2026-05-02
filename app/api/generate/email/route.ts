/**
 * app/api/generate/email/route.ts
 *
 * POST /api/generate/email
 *
 * Envoie les 7 contenus générés par email à l'utilisateur connecté.
 * Plus pratique que "télécharger" sur mobile : tout arrive dans la boîte
 * mail, accessible partout, archivable, partageable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthedEmail } from '@/lib/auth-server';
import { env } from '@/lib/env';
import type { GenerationResult } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br/>');
}

function renderSection(emoji: string, title: string, body: string | null | undefined): string {
  if (!body || !body.trim()) return '';
  return `
    <tr>
      <td style="padding:18px 0 8px;border-top:1px solid #E8E8E2">
        <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2D6A4F">
          ${emoji} ${title}
        </p>
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14.5px;line-height:1.65;color:#111827;white-space:pre-wrap">
          ${nl2br(body)}
        </div>
      </td>
    </tr>`;
}

export async function POST(req: NextRequest) {
  let body: { result?: GenerationResult } & Record<string, unknown>;
  try {
    body = (await req.json()) as { result?: GenerationResult };
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const email = await getAuthedEmail(req, body);
  if (!email) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  const result = body.result;
  if (!result || typeof result !== 'object') {
    return NextResponse.json({ error: 'Résultat manquant.' }, { status: 400 });
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const subject = `Tes 7 contenus Kooach ✦ ${today}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAFAF7;font-family:'Helvetica Neue',Arial,sans-serif">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FAFAF7">
      <tr>
        <td align="center" style="padding:40px 20px">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="max-width:640px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(45,106,79,0.08)">
            <tr>
              <td style="padding:32px 36px 12px">
                <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;font-style:italic;color:#2D6A4F;letter-spacing:-0.5px">Kooach</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#2D6A4F">
                  ✦ Tes 7 contenus du ${escapeHtml(today)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 36px 12px">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.2;color:#111827;letter-spacing:-0.5px">
                  Prêts à publier.
                </h1>
                <p style="margin:8px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#6B7280">
                  Copie-colle, planifie, publie. Tu retrouves aussi tout dans ton historique sur kooach.fr/app/history.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 36px 24px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  ${renderSection('💜', 'Post émotionnel', result.post_emotionnel)}
                  ${renderSection('📚', 'Post éducatif', result.post_educatif)}
                  ${renderSection('⚡', 'Post motivationnel', result.post_motivationnel)}
                  ${renderSection('📷', 'Bio Instagram', result.bio_instagram)}
                  ${renderSection('📨', 'Newsletter', result.newsletter)}
                  ${renderSection('✉️', 'Email de relance', result.email_relance)}
                  ${renderSection('🎬', 'Idée de réel', result.reel_idee)}
                  ${renderSection('🎬', 'Script du réel', result.reel_script)}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 36px 32px">
                <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#9CA3AF">
                  🇫🇷 Kooach — Le ghost-writer IA des coachs sportifs FR · <a href="https://kooach.fr/app" style="color:#2D6A4F;text-decoration:none">Retour au dashboard</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kooach <contact@kooach.fr>',
      to: email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    console.error('send-results email error:', res.status, err);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi. Réessaye dans 30 secondes.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sentTo: email });
}
