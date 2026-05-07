/**
 * lib/lead-magnet/email.ts
 *
 * Envoi de l'email J0 du lead magnet : livraison des 10 accroches générées.
 * Couleurs Kooach (#2D6A4F primary / #FAFAF7 cream / #111827 ink) + tease
 * Kooach Pro en footer.
 */

import { env } from '@/lib/env';
import type { Hook } from '@/lib/lead-magnet/schema';

interface SendHooksEmailInput {
  to: string;
  topic: string;
  hooks: Hook[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHookList(hooks: Hook[]): string {
  return hooks
    .map(
      (hook, i) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #E8E8E2">
            <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2D6A4F">
              ✦ ${String(i + 1).padStart(2, '0')} · ${escapeHtml(hook.category)}
            </p>
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55;color:#111827">
              ${escapeHtml(hook.text)}
            </p>
          </td>
        </tr>`,
    )
    .join('');
}

export async function sendLeadMagnetHooksEmail({ to, topic, hooks }: SendHooksEmailInput): Promise<void> {
  const subject = `Tes 10 accroches Instagram ✦ "${topic.slice(0, 60)}"`;

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
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(45,106,79,0.08)">
            <!-- Header -->
            <tr>
              <td style="padding:32px 36px 0">
                <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;font-style:italic;color:#2D6A4F;letter-spacing:-0.5px">Kooach</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#2D6A4F">
                  ✦ Tes 10 accroches sont prêtes
                </p>
              </td>
            </tr>

            <!-- Headline -->
            <tr>
              <td style="padding:18px 36px 8px">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;line-height:1.15;color:#111827;letter-spacing:-0.8px">
                  Voilà 10 façons d'ouvrir ton prochain post.
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 36px 24px">
                <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:#6B7280">
                  Sur le sujet : <strong style="color:#111827">${escapeHtml(topic)}</strong>.<br/>
                  Choisis celle qui te parle, écris ton post derrière, et publie.
                </p>
              </td>
            </tr>

            <!-- Hooks list -->
            <tr>
              <td style="padding:0 36px 28px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  ${renderHookList(hooks)}
                </table>
              </td>
            </tr>

            <!-- Tip -->
            <tr>
              <td style="padding:0 36px 28px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#EBF5EF;border:1px solid #C9E2D2;border-radius:10px">
                  <tr>
                    <td style="padding:14px 18px">
                      <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2D6A4F">
                        💡 Astuce
                      </p>
                      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a5c38">
                        Test les 2-3 qui te paraissent les plus inhabituelles — celles que tu n'aurais jamais écrites toi-même. C'est elles qui scrollent net.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Upsell Kooach Pro -->
            <tr>
              <td style="padding:0 36px 36px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(180deg,#FAFAF7 0%,#fff 100%);border:1px solid #E8E8E2;border-radius:12px">
                  <tr>
                    <td style="padding:24px 22px">
                      <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2D6A4F">
                        ✦ Va plus loin
                      </p>
                      <h2 style="margin:0 0 10px;font-family:Georgia,serif;font-size:20px;font-weight:700;line-height:1.25;color:#111827;letter-spacing:-0.4px">
                        Et le post complet derrière l'accroche ?
                      </h2>
                      <p style="margin:0 0 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.65;color:#6B7280">
                        Avec <strong style="color:#111827">Kooach Pro</strong>, tu génères <strong style="color:#111827">7 contenus complets</strong> en 60 secondes : 3 posts Instagram, ta bio, ta newsletter, un email de relance et une idée de réel + son script. Calibrés à ton ton, ta cible, ton objectif.
                      </p>
                      <a href="https://kooach.fr/signup?utm_source=lead-magnet&utm_medium=email&utm_campaign=hooks-j0"
                         style="display:inline-block;padding:13px 26px;background:#2D6A4F;color:#fff;text-decoration:none;border-radius:10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.2px">
                        Tester Kooach Pro · 7 jours gratuits →
                      </a>
                      <p style="margin:14px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9CA3AF">
                        Annulable en 1 clic · sans engagement
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:0 36px 32px">
                <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#9CA3AF">
                  Tu reçois cet email parce que tu as utilisé le générateur d'accroches sur kooach.fr.
                </p>
                <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#9CA3AF">
                  🇫🇷 Kooach — Le ghost-writer IA des coachs sportifs FR · <a href="mailto:contact@kooach.fr" style="color:#2D6A4F;text-decoration:none">contact@kooach.fr</a>
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
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Resend error ${res.status}: ${err.message ?? ''}`);
  }
}
