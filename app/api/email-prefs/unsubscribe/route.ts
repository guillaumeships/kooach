/**
 * app/api/email-prefs/unsubscribe/route.ts
 *
 * Désabonnement one-click depuis le footer des emails (RFC 8058 + GDPR-friendly).
 *
 * GET  /api/email-prefs/unsubscribe?email=...&token=...&type=weekly
 *      → vérifie HMAC, set weekly_recap_optout=true, retourne page de confirmation
 *
 * POST /api/email-prefs/unsubscribe
 *      → même payload, support du header List-Unsubscribe-Post (Gmail/Outlook
 *        envoient un POST automatique sur "se désabonner" en 1 clic).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken, type UnsubscribeType } from '@/lib/email-weekly';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function handle(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  let email = url.searchParams.get('email');
  let token = url.searchParams.get('token');
  let type = url.searchParams.get('type') ?? 'weekly';

  // POST one-click form-encoded fallback
  if (!email || !token) {
    try {
      const form = await req.formData();
      email = email ?? (form.get('email') as string | null);
      token = token ?? (form.get('token') as string | null);
      type = type ?? (form.get('type') as string | null) ?? 'weekly';
    } catch {
      /* pas de body form, OK */
    }
  }

  if (!email || !token) {
    return new NextResponse(renderPage('Lien invalide.', 'Les paramètres requis sont manquants.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const unsubType: UnsubscribeType = type === 'lead-magnet' ? 'lead-magnet' : 'weekly';

  if (!verifyUnsubscribeToken(cleanEmail, token, unsubType)) {
    return new NextResponse(renderPage('Lien invalide.', "Ce lien de désabonnement n'est pas reconnu. Si tu veux te désabonner, écris-nous à contact@kooach.fr."), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const db = getSupabase();
  let confirmMessage = '';

  if (unsubType === 'lead-magnet') {
    // Désabonnement de la séquence J1/J3/J7 du lead magnet
    const { error } = await db
      .from('lead_magnet_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', cleanEmail);
    if (error) {
      return new NextResponse(renderPage('Erreur', "Une erreur s'est produite. Réessaie ou écris-nous à contact@kooach.fr."), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    confirmMessage = "Tu ne recevras plus de mails de cette série. Si tu changes d'avis, retente le générateur d'accroches sur kooach.fr.";
  } else {
    // Désabonnement du récap hebdomadaire (utilisateurs Pro)
    const { error } = await db
      .from('profiles')
      .update({ weekly_recap_optout: true })
      .eq('email', cleanEmail);
    if (error) {
      return new NextResponse(renderPage('Erreur', "Une erreur s'est produite. Réessaie ou écris-nous à contact@kooach.fr."), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    confirmMessage = "Tu ne recevras plus le récap hebdomadaire. Tes emails de service (paiement, accès) continuent de fonctionner.";
  }

  return new NextResponse(renderPage('Désabonné ✓', confirmMessage), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const GET = handle;
export const POST = handle;

// ─────────────────────────────────────────────────────────────────────────────

function renderPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Kooach — ${title}</title>
  <style>
    * { box-sizing: border-box }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FAFAF7;
      color: #1a1a1a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border: 1px solid #e5e5dc;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px -8px rgba(0,0,0,.06);
    }
    .brand {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-style: italic;
      color: #2D6A4F;
      margin: 0 0 24px;
      letter-spacing: -0.5px;
    }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 12px;
      line-height: 1.2;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #555;
      margin: 0 0 16px;
    }
    a.cta {
      display: inline-block;
      margin-top: 16px;
      background: #2D6A4F;
      color: #fff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <p class="brand">Kooach</p>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(body)}</p>
    <a class="cta" href="https://kooach.fr">Retour sur kooach.fr</a>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
