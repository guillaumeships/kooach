/**
 * lib/email-nurture.ts
 *
 * Séquence nurturing J1/J3/J7 pour les subscribers du lead magnet
 * `/generateur-accroches`. Envoyée via cron quotidien.
 *
 * Stratégie :
 *   J1 — "T'as bien reçu ?" : conversationnel, check engagement, tease
 *   J3 — Storytelling : pourquoi Kooach existe, qui on est
 *   J7 — Offer : 7 jours gratuits Kooach Pro (vrai CTA conversion)
 *
 * Volontairement progressive — pas de pitch produit J1 (tu venais de
 * recevoir un cadeau, pas un commercial). Le J7 est le moment de l'offre.
 */

import { env } from '@/lib/env';
import { makeUnsubscribeToken } from '@/lib/email-weekly';

interface NurtureCommonArgs {
  email: string;
  niche?: string | null;     // ex : "musculation", "domicile"
  topic?: string | null;     // ex : "pourquoi 80% stagnent en muscu"
}

const FROM = 'Guillaume de Kooach <contact@kooach.fr>';

// ─────────────────────────────────────────────────────────────────────────────
// J1 — Check engagement, conversationnel, pas de pitch
// ─────────────────────────────────────────────────────────────────────────────

export async function sendNurtureJ1Email(args: NurtureCommonArgs): Promise<{ ok: boolean; error?: string }> {
  const { email, niche, topic } = args;
  const unsubUrl = makeUnsubUrl(email, 'lead-magnet');

  const subject = "Tu les as testées, tes 10 accroches ?";
  const html = wrap(`
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:rgba(45,106,79,.8);margin:0 0 8px">✦ Jour 1 — petit check</p>
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;color:#1a1a1a;margin:0 0 16px;line-height:1.3">Salut,</h1>

    <p style="font-size:15px;line-height:1.65;color:#444;margin:0 0 14px">
      Hier tu as récupéré ${niche ? `tes 10 accroches sur <strong style="color:#2D6A4F">${escapeHtml(niche)}</strong>` : 'tes 10 accroches'}${topic ? ` (${escapeHtml(topic)})` : ''} via Kooach.
    </p>

    <p style="font-size:15px;line-height:1.65;color:#444;margin:0 0 14px">
      Question simple : <strong style="color:#1a1a1a">tu en as testé une ?</strong>
    </p>

    <p style="font-size:15px;line-height:1.65;color:#444;margin:0 0 22px">
      Si oui, je veux savoir laquelle a fait scroller. Si non, choisis-en une au pif et publie aujourd'hui — c'est juste un post, pas un mariage.
    </p>

    <div style="background:#f5f5ee;border-left:3px solid #2D6A4F;padding:14px 18px;margin:0 0 22px;border-radius:0 8px 8px 0">
      <p style="font-size:13.5px;line-height:1.55;color:#444;margin:0">
        💡 <strong>Petit truc</strong> : les 3 premières lignes décident si on continue. Le reste du post peut être moyen — l'accroche, jamais.
      </p>
    </div>

    <p style="font-size:15px;line-height:1.65;color:#444;margin:0 0 22px">
      Réponds à ce mail si tu veux mon retour sur un de tes posts. Je lis tout.
    </p>

    <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:#444;margin:0">
      — Guillaume
    </p>
  `, unsubUrl);

  return await send(email, subject, html, unsubUrl);
}

// ─────────────────────────────────────────────────────────────────────────────
// J3 — Storytelling, pourquoi Kooach existe
// ─────────────────────────────────────────────────────────────────────────────

export async function sendNurtureJ3Email(args: NurtureCommonArgs): Promise<{ ok: boolean; error?: string }> {
  const { email } = args;
  const unsubUrl = makeUnsubUrl(email, 'lead-magnet');

  const subject = "Pourquoi j'ai créé Kooach.";
  const html = wrap(`
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:rgba(45,106,79,.8);margin:0 0 8px">✦ Jour 3 — l'histoire</p>
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;color:#1a1a1a;margin:0 0 16px;line-height:1.3">Pourquoi j'ai créé Kooach.</h1>

    <p style="font-size:15px;line-height:1.7;color:#444;margin:0 0 16px">
      Je connais beaucoup de coachs sportifs. Tous ont le même problème : <strong style="color:#1a1a1a">ils savent coacher, mais ils ne savent pas écrire.</strong>
    </p>

    <p style="font-size:15px;line-height:1.7;color:#444;margin:0 0 16px">
      Pas qu'ils écrivent mal. Ils écrivent bien quand ils prennent le temps. Mais ils ne le prennent jamais. Tu rentres le soir après 5 séances, et écrire un post Insta c'est la dernière chose que tu veux faire.
    </p>

    <p style="font-size:15px;line-height:1.7;color:#444;margin:0 0 16px">
      Résultat : Insta vide ⟹ pas de DMs ⟹ pas de nouveaux clients. Tu vois la spirale.
    </p>

    <p style="font-size:15px;line-height:1.7;color:#444;margin:0 0 16px">
      Kooach règle ça. Tu rentres ta spécialité, ton style, ta cible. En 60 secondes, tu as 7 contenus calibrés sur toi : 3 posts Instagram, ta bio, une newsletter, un email de relance, et un script de réel. <strong style="color:#1a1a1a">Une semaine d'avance, à chaque fois.</strong>
    </p>

    <p style="font-size:15px;line-height:1.7;color:#444;margin:0 0 22px">
      Les 10 accroches que tu as reçues, c'est juste un échantillon de ce que Kooach fait. La vraie machine, c'est la séquence complète.
    </p>

    <div style="text-align:center;margin:24px 0">
      <a href="https://kooach.fr/?utm_source=email&utm_medium=lead-magnet-nurture&utm_campaign=j3" style="display:inline-block;background:#2D6A4F;color:#fff;text-decoration:none;padding:13px 26px;border-radius:12px;font-weight:600;font-size:14.5px">
        Voir comment ça marche →
      </a>
    </div>

    <p style="font-size:13.5px;line-height:1.65;color:#666;margin:24px 0 0;padding-top:18px;border-top:1px solid #f0f0e8">
      Demain je t'enverrai un dernier mail — avec un essai gratuit pour tester si Kooach te convient. Sans engagement, annulable en 1 clic.
    </p>

    <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:#444;margin:18px 0 0">
      — Guillaume
    </p>
  `, unsubUrl);

  return await send(email, subject, html, unsubUrl);
}

// ─────────────────────────────────────────────────────────────────────────────
// J7 — Offer 7 jours gratuits, vraie conversion
// ─────────────────────────────────────────────────────────────────────────────

export async function sendNurtureJ7Email(args: NurtureCommonArgs): Promise<{ ok: boolean; error?: string }> {
  const { email } = args;
  const unsubUrl = makeUnsubUrl(email, 'lead-magnet');

  const subject = "7 jours gratuits sur Kooach — et tes posts s'écrivent tout seuls.";
  const html = wrap(`
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:rgba(45,106,79,.8);margin:0 0 8px">✦ Jour 7 — l'offre</p>
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 16px;line-height:1.25">Tes 7 jours gratuits t'attendent.</h1>

    <p style="font-size:15px;line-height:1.7;color:#444;margin:0 0 14px">
      Tu as testé Kooach avec les 10 accroches gratuites. Ça t'a donné une idée du ton.
    </p>

    <p style="font-size:15px;line-height:1.7;color:#444;margin:0 0 18px">
      <strong style="color:#1a1a1a">Avec Kooach Pro, tu as la séquence complète, chaque fois que tu en as besoin :</strong>
    </p>

    <ul style="margin:0 0 22px;padding:0 0 0 4px;list-style:none">
      <li style="font-size:14.5px;line-height:1.6;color:#444;margin:0 0 10px;padding-left:24px;position:relative">
        <span style="position:absolute;left:0;top:1px;color:#2D6A4F;font-weight:700">✓</span>
        3 posts Instagram (émotionnel, éducatif, motivationnel) calibrés à ton ton
      </li>
      <li style="font-size:14.5px;line-height:1.6;color:#444;margin:0 0 10px;padding-left:24px;position:relative">
        <span style="position:absolute;left:0;top:1px;color:#2D6A4F;font-weight:700">✓</span>
        Ta bio Instagram, optimisée conversion DM
      </li>
      <li style="font-size:14.5px;line-height:1.6;color:#444;margin:0 0 10px;padding-left:24px;position:relative">
        <span style="position:absolute;left:0;top:1px;color:#2D6A4F;font-weight:700">✓</span>
        Une newsletter, un email de relance prospect
      </li>
      <li style="font-size:14.5px;line-height:1.6;color:#444;margin:0 0 10px;padding-left:24px;position:relative">
        <span style="position:absolute;left:0;top:1px;color:#2D6A4F;font-weight:700">✓</span>
        Une idée de réel + son script
      </li>
      <li style="font-size:14.5px;line-height:1.6;color:#444;margin:0 0 0;padding-left:24px;position:relative">
        <span style="position:absolute;left:0;top:1px;color:#2D6A4F;font-weight:700">✓</span>
        Le tout en 60 secondes, autant de fois que tu veux
      </li>
    </ul>

    <div style="background:#f5f5ee;border:1px solid #e5e5dc;border-radius:12px;padding:18px 20px;margin:0 0 24px">
      <p style="font-size:13.5px;line-height:1.6;color:#666;margin:0 0 4px">Kooach Pro</p>
      <p style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0;line-height:1">29 €<span style="font-size:15px;font-weight:400;color:#666">/mois</span></p>
      <p style="font-size:13px;line-height:1.6;color:#2D6A4F;margin:6px 0 0;font-weight:600">7 jours gratuits — annulable en 1 clic.</p>
    </div>

    <div style="text-align:center;margin:24px 0">
      <a href="https://kooach.fr/signup?utm_source=email&utm_medium=lead-magnet-nurture&utm_campaign=j7" style="display:inline-block;background:#2D6A4F;color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:600;font-size:15px">
        Démarrer mes 7 jours gratuits →
      </a>
    </div>

    <p style="font-size:13px;line-height:1.65;color:#888;margin:22px 0 0;padding-top:18px;border-top:1px solid #f0f0e8">
      Si Kooach n'est pas pour toi, c'est OK — tu ne recevras plus de mails de ma part. Merci d'avoir testé les accroches gratuites.
    </p>

    <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:#444;margin:18px 0 0">
      — Guillaume
    </p>
  `, unsubUrl);

  return await send(email, subject, html, unsubUrl);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

function makeUnsubUrl(email: string, type: 'lead-magnet'): string {
  const token = makeUnsubscribeToken(email, type);
  return `https://kooach.fr/api/email-prefs/unsubscribe?email=${encodeURIComponent(email)}&token=${token}&type=${type}`;
}

function wrap(inner: string, unsubUrl: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;background:#FAFAF7">
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-style:italic;color:#2D6A4F;margin:0;letter-spacing:-0.5px">Kooach</p>
    </div>
    <div style="background:#fff;border:1px solid #e5e5dc;border-radius:16px;padding:32px 28px;box-shadow:0 4px 24px -8px rgba(0,0,0,.06)">
      ${inner}
    </div>
    <p style="text-align:center;font-size:12px;color:#999;margin:24px 0 0;line-height:1.6">
      Kooach — Le ghost-writer IA des coachs sportifs FR<br/>
      <a href="https://kooach.fr" style="color:#2D6A4F;text-decoration:none">kooach.fr</a><br/>
      <a href="${unsubUrl}" style="color:#999;text-decoration:underline;font-size:11px">Se désabonner de cette série</a>
    </p>
  </div>`;
}

async function send(email: string, subject: string, html: string, unsubUrl: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
