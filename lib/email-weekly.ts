/**
 * lib/email-weekly.ts
 *
 * Email weekly recap — envoyé chaque dimanche 19h via cron Vercel.
 * Pattern Spotify Wrapped + Strava weekly summary :
 *   - stats persos (X contenus, Y min économisées, vs semaine dernière)
 *   - top contenu de la semaine (snippet du dernier)
 *   - streak actuel
 *   - CTA "Lundi : on crée quoi ?" → /app
 *
 * Le mécanisme #1 de réengagement pour SaaS de création récurrente.
 */

import { createHmac } from 'crypto';
import { env } from '@/lib/env';

export interface WeeklyRecapStats {
  email: string;
  weekCount: number;          // contenus créés cette semaine
  prevWeekCount: number;      // contenus créés semaine dernière (pour delta)
  streakCount: number;
  totalGenerations: number;
  topContent?: {
    label: string;            // ex: "Post émotionnel"
    snippet: string;          // 80 premiers chars
  };
}

/**
 * Génère un token HMAC pour le lien unsubscribe (évite l'abus / bots).
 * Le token est lié à l'email + un type + une seed serveur, validé sur la
 * route GET. Le type permet d'avoir des tokens distincts pour weekly vs
 * lead-magnet sans qu'on puisse réutiliser l'un pour l'autre.
 */
export type UnsubscribeType = 'weekly' | 'lead-magnet';

export function makeUnsubscribeToken(email: string, type: UnsubscribeType = 'weekly'): string {
  const ns = type === 'lead-magnet' ? 'lead-magnet-nurture' : 'weekly-recap';
  return createHmac('sha256', env.TOKEN_SECRET)
    .update(`${ns}:${email.toLowerCase().trim()}`)
    .digest('hex')
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string, type: UnsubscribeType = 'weekly'): boolean {
  if (!token || typeof token !== 'string') return false;
  return makeUnsubscribeToken(email, type) === token;
}

/**
 * Envoie l'email weekly recap branded Kooach.
 * Best-effort : ne throw jamais (le cron continue même si un email échoue).
 */
export async function sendWeeklyRecapEmail(stats: WeeklyRecapStats): Promise<{ ok: boolean; error?: string }> {
  const { email, weekCount, prevWeekCount, streakCount, totalGenerations, topContent } = stats;

  const minutesSaved = weekCount * 7;  // ~7 min économisées par contenu généré
  const deltaCount = weekCount - prevWeekCount;
  const deltaText =
    prevWeekCount === 0
      ? '1ère semaine ✨'
      : deltaCount > 0
        ? `+${deltaCount} vs semaine dernière`
        : deltaCount === 0
          ? `comme la semaine dernière`
          : `${deltaCount} vs semaine dernière`;

  const unsubToken = makeUnsubscribeToken(email);
  const unsubUrl = `https://kooach.fr/api/email-prefs/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}&type=weekly`;

  const subject = weekCount === 0
    ? `On t'a manqué cette semaine ? 👋`
    : `Ta semaine sur Kooach — ${weekCount} contenu${weekCount > 1 ? 's' : ''} 🔥`;

  const html = renderHtml({
    weekCount, prevWeekCount, deltaText, minutesSaved,
    streakCount, totalGenerations, topContent, unsubUrl,
  });

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
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: `Resend ${res.status}: ${err.message ?? ''}` };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────

interface RenderArgs {
  weekCount: number;
  prevWeekCount: number;
  deltaText: string;
  minutesSaved: number;
  streakCount: number;
  totalGenerations: number;
  topContent?: { label: string; snippet: string };
  unsubUrl: string;
}

function renderHtml(args: RenderArgs): string {
  const { weekCount, deltaText, minutesSaved, streakCount, totalGenerations, topContent, unsubUrl } = args;

  // Cas "0 contenu cette semaine" — variante comeback nudge
  if (weekCount === 0) {
    return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;background:#FAFAF7">
      <div style="text-align:center;margin-bottom:32px">
        <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-style:italic;color:#2D6A4F;margin:0;letter-spacing:-0.5px">Kooach</p>
      </div>

      <div style="background:#fff;border:1px solid #e5e5dc;border-radius:16px;padding:32px 28px;box-shadow:0 4px 24px -8px rgba(0,0,0,.06)">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 12px;line-height:1.2">On t'a manqué cette semaine ?</h1>
        <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 18px">
          Pas un seul contenu généré. Pas de stress — un coup de mou ça arrive. Mais ton Insta n'attend pas, et tes followers non plus.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">
          ${totalGenerations > 0 ? `<strong>Tu as ${totalGenerations} contenus créés au total.</strong> ` : ''}Reprends en 60 secondes — Kooach se souvient déjà de ton style.
        </p>

        <div style="text-align:center;margin:28px 0">
          <a href="https://kooach.fr/app?utm_source=email&utm_medium=weekly-recap&utm_campaign=comeback" style="display:inline-block;background:#2D6A4F;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">
            Reprendre maintenant →
          </a>
        </div>

        <p style="font-size:13px;line-height:1.6;color:#888;margin:24px 0 0;padding-top:20px;border-top:1px solid #f0f0e8">
          Tu peux aussi écrire la liste des sujets à traiter cette semaine, et générer 7 contenus d'un coup pour avoir 7 jours d'avance.
        </p>
      </div>

      ${footer(unsubUrl)}
    </div>`;
  }

  // Cas standard "X contenus cette semaine"
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;background:#FAFAF7">
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-style:italic;color:#2D6A4F;margin:0;letter-spacing:-0.5px">Kooach</p>
    </div>

    <div style="background:#fff;border:1px solid #e5e5dc;border-radius:16px;padding:32px 28px;box-shadow:0 4px 24px -8px rgba(0,0,0,.06)">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:rgba(45,106,79,.8);margin:0 0 8px">✦ Ta semaine sur Kooach</p>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#1a1a1a;margin:0 0 24px;line-height:1.2">${weekCount} contenu${weekCount > 1 ? 's' : ''} créé${weekCount > 1 ? 's' : ''}.</h1>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;border-collapse:separate;border-spacing:6px 0">
        <tr>
          <td valign="top" style="background:#f5f5ee;border:1px solid #e5e5dc;border-radius:12px;padding:14px 14px;width:33.33%">
            <p style="font-size:11px;color:#888;margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">Cette semaine</p>
            <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1a1a1a;margin:0;line-height:1">${weekCount}</p>
            <p style="font-size:11px;color:#666;margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">${deltaText}</p>
          </td>
          <td valign="top" style="background:#f5f5ee;border:1px solid #e5e5dc;border-radius:12px;padding:14px 14px;width:33.33%">
            <p style="font-size:11px;color:#888;margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">Temps gagné</p>
            <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1a1a1a;margin:0;line-height:1">${minutesSaved}<span style="font-size:14px;font-weight:400;color:#666"> min</span></p>
            <p style="font-size:11px;color:#666;margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">~7 min/contenu</p>
          </td>
          ${streakCount > 0 ? `<td valign="top" style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:12px;padding:14px 14px;width:33.33%">
            <p style="font-size:11px;color:#888;margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">🔥 Streak</p>
            <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1a1a1a;margin:0;line-height:1">${streakCount}<span style="font-size:14px;font-weight:400;color:#666">j</span></p>
            <p style="font-size:11px;color:#666;margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">${streakCount >= 7 ? 'top 10%' : 'continue'}</p>
          </td>` : ''}
        </tr>
      </table>

      ${topContent ? `<div style="border-top:1px solid #f0f0e8;padding-top:20px;margin-bottom:24px">
        <p style="font-family:Georgia,serif;font-size:13px;font-style:italic;color:#666;margin:0 0 8px">✦ Ton dernier contenu</p>
        <p style="font-size:13px;font-weight:600;color:#2D6A4F;margin:0 0 6px">${escapeHtml(topContent.label)}</p>
        <p style="font-size:14px;line-height:1.6;color:#444;margin:0;font-style:italic">"${escapeHtml(topContent.snippet)}…"</p>
      </div>` : ''}

      <div style="text-align:center;margin:28px 0 8px">
        <a href="https://kooach.fr/app?utm_source=email&utm_medium=weekly-recap&utm_campaign=monday-prompt" style="display:inline-block;background:#2D6A4F;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">
          Lundi : on crée quoi ? →
        </a>
      </div>

      <p style="text-align:center;font-size:13px;color:#888;margin:16px 0 0">
        Génère ta semaine en 60 secondes pour garder ton streak.
      </p>
    </div>

    ${footer(unsubUrl)}
  </div>`;
}

function footer(unsubUrl: string): string {
  return `<p style="text-align:center;font-size:12px;color:#999;margin:24px 0 0;line-height:1.6">
    Kooach — Le ghost-writer IA des coachs sportifs FR<br/>
    <a href="https://kooach.fr" style="color:#2D6A4F;text-decoration:none">kooach.fr</a><br/>
    <a href="${unsubUrl}" style="color:#999;text-decoration:underline;font-size:11px">Se désabonner du récap hebdomadaire</a>
  </p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
