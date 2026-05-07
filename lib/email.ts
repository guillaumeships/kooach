/**
 * lib/email.ts
 *
 * Envoi des emails transactionnels via Resend.
 *
 * Centralisé ici plutôt que dupliqué dans chaque route — utilisé par :
 *   - app/api/webhook/route.ts          (email d'accès après paiement)
 *   - app/api/recover-access/route.ts   (renvoi du lien magique)
 */

import { env } from '@/lib/env';

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

async function send({ to, subject, html, from }: SendOptions): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from ?? 'Kooach <contact@kooach.fr>',
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

/**
 * Email envoyé après paiement Stripe (et après une demande de récupération
 * d'accès). Pointe vers une route dédiée /auth/legacy-link?token=... plutôt
 * que vers la racine — Google Safe Browsing flag les liens email avec long
 * token sur la racine + redirect JS comme du phishing (credential harvesting).
 */
export async function sendAccessEmail(email: string, token: string): Promise<void> {
  const link = `https://kooach.fr/auth/legacy-link?token=${encodeURIComponent(token)}`;
  await send({
    to: email,
    subject: 'Ton accès Kooach est prêt ✦',
    html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111827">
      <p style="font-size:20px;font-style:italic;color:#2D6A4F;margin:0 0 28px">Kooach</p>
      <h1 style="font-size:24px;font-weight:700;margin:0 0 14px;line-height:1.3">Ton lien d'accès</h1>
      <p style="font-size:15px;color:#6B7280;margin:0 0 32px;line-height:1.65">
        Clique sur le bouton pour accéder à ton espace Kooach. Le lien est valable 30 jours.
      </p>
      <a href="${link}" style="display:inline-block;padding:14px 32px;background:#2D6A4F;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">
        Accéder à Kooach →
      </a>
      <p style="font-size:12px;color:#9CA3AF;margin:28px 0 0;line-height:1.6">
        Ou copie ce lien dans ton navigateur :<br>
        <span style="color:#2D6A4F;word-break:break-all">${link}</span>
      </p>
    </div>`,
  });
}

/**
 * Email de bienvenue envoyé après checkout Stripe quand le user existe déjà
 * dans Supabase Auth (cas standard signup -> /signup/checkout). Sans ça, le
 * coach paye et ne reçoit aucune confirmation -> red flag immédiat.
 *
 * From "Guillaume de Kooach" pour le ton perso (vs "Kooach" pour les mails
 * techniques). Invite à répondre direct -> humanise + boost engagement Resend.
 */
export async function sendWelcomeEmail(email: string): Promise<void> {
  await send({
    to: email,
    from: 'Guillaume de Kooach <contact@kooach.fr>',
    subject: 'Bienvenue parmi les abonnés Kooach Pro',
    html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111827">
      <p style="font-size:20px;font-style:italic;color:#2D6A4F;margin:0 0 28px">Kooach</p>
      <h1 style="font-size:24px;font-weight:700;margin:0 0 14px;line-height:1.3">Merci de ta confiance.</h1>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.65">
        Ton abonnement Kooach Pro est actif. Tu as l'accès illimité à toutes les générations dans le cadre du plan (5/jour, 100/mois). Annulable à tout moment depuis ton compte.
      </p>
      <a href="https://kooach.fr/app" style="display:inline-block;padding:14px 32px;background:#2D6A4F;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;margin:8px 0 24px">
        Accéder à mon dashboard →
      </a>
      <h2 style="font-size:16px;font-weight:700;margin:24px 0 12px;color:#111827">3 conseils pour ta première génération</h2>
      <p style="font-size:14px;color:#374151;margin:0 0 10px;line-height:1.65">
        <strong>1. Sois précis sur ton style.</strong> Plus tu remplis ton profil avec ton ton réel (cash, motivant, pédagogue…), plus Kooach t'imite fidèlement.
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 10px;line-height:1.65">
        <strong>2. Colle 2-3 de tes posts existants</strong> dans la zone "Exemples" — c'est ce qui transforme une IA générique en ghost-writer qui sonne comme toi.
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 24px;line-height:1.65">
        <strong>3. Cmd+Enter (ou Ctrl+Enter)</strong> pour générer plus vite quand tu seras à l'aise.
      </p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0">
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        Une question, un bug, une demande ? <strong>Réponds direct à ce mail</strong> — je lis tout, c'est moi en face.
      </p>
      <p style="font-size:14px;color:#6B7280;margin:16px 0 0;line-height:1.65;font-style:italic">
        Guillaume<br>
        <span style="font-size:13px;color:#9CA3AF">Fondateur, Kooach</span>
      </p>
    </div>`,
  });
}

/**
 * Email J+1 trial — envoyé 24-48h après checkout via cron quotidien.
 *
 * Pourquoi : le welcome email (J0) annonce les 3 conseils. Le J+1 ouvre une
 * conversation 1:1. Quand on est solo founder à 0 client, chaque réponse est
 * de l'or — feedback produit, témoignage potentiel, ou levée d'objection avant
 * la fin du trial. Format ultra-court : 1 question, pas de pitch, "réponds à
 * ce mail" en signature.
 *
 * Boost activation attendu : +5-10% conversion trial→paid (data First Page
 * Sage 2025 sur les drip onboarding court).
 */
export async function sendDayOneEmail(email: string): Promise<void> {
  await send({
    to: email,
    from: 'Guillaume de Kooach <contact@kooach.fr>',
    subject: 'Tu as réussi à générer ton 1er post ?',
    html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111827">
      <p style="font-size:20px;font-style:italic;color:#2D6A4F;margin:0 0 28px">Kooach</p>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.65">
        Hello,
      </p>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.65">
        C'est Guillaume, fondateur de Kooach. Tu t'es inscrit hier — juste un mail rapide pour savoir comment ça se passe.
      </p>
      <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.65">
        <strong>Tu as réussi à générer ton premier post ?</strong>
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        • <strong>Si oui</strong> — raconte-moi, j'adore savoir ce que les coachs en font.
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 24px;line-height:1.65">
        • <strong>Si non</strong> — t'es bloqué sur quoi ? Je peux t'aider en 5 min.
      </p>
      <a href="https://kooach.fr/app" style="display:inline-block;padding:14px 32px;background:#2D6A4F;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;margin:0 0 8px">
        Reprendre où j'en étais →
      </a>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0">
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        <strong>Réponds direct à ce mail</strong>, je lis tout — c'est moi en face, pas un bot.
      </p>
      <p style="font-size:14px;color:#6B7280;margin:16px 0 0;line-height:1.65;font-style:italic">
        Guillaume<br>
        <span style="font-size:13px;color:#9CA3AF">Fondateur, Kooach</span>
      </p>
    </div>`,
  });
}

/**
 * Email J-3 avant fin de trial (déclenché par Stripe `customer.subscription.trial_will_end`).
 *
 * Pourquoi : sans ça, le user oublie qu'il a un trial → débit surprise →
 * chargeback. Et inversement, un user qui hésitait à continuer manque le
 * "moment de décision" et abandonne par défaut. Cet email est la pièce
 * maîtresse de la conversion trial→paid (+10-30% selon ChartMogul 2026).
 *
 * Ton chaleureux + récap valeur + CTA Customer Portal pour confirmer ou
 * annuler. Format Georgia branded cohérent avec welcomeEmail.
 */
export async function sendTrialEndingEmail(email: string): Promise<void> {
  await send({
    to: email,
    from: 'Guillaume de Kooach <contact@kooach.fr>',
    subject: 'Plus que 3 jours d\'essai sur Kooach',
    html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111827">
      <p style="font-size:20px;font-style:italic;color:#2D6A4F;margin:0 0 28px">Kooach</p>
      <h1 style="font-size:24px;font-weight:700;margin:0 0 14px;line-height:1.3">Plus que 3 jours d'essai.</h1>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.65">
        Ton accès gratuit à Kooach s'achève dans 3 jours. À ce moment-là, on te demandera ta carte pour continuer — <strong>aucun débit anticipé, aucune surprise</strong> (on n'a jamais demandé ta CB).
      </p>
      <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.65">
        Si Kooach t'a aidé, tu pourras passer en payant en 1 clic à 29€/mois (ou 19€/mois si tu fais partie des 10 premiers beta-testeurs). Si ça ne t'a pas convaincu, tu peux juste partir — sans rien faire.
      </p>
      <a href="https://kooach.fr/app" style="display:inline-block;padding:14px 32px;background:#2D6A4F;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;margin:0 0 8px">
        Reprendre Kooach →
      </a>
      <p style="font-size:14px;color:#6B7280;margin:8px 0 24px;line-height:1.65">
        ou <a href="https://kooach.fr/app/account" style="color:#2D6A4F;text-decoration:underline">consulter mon compte</a>
      </p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:28px 0">
      <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827">Ce que tu peux faire avec Kooach</h2>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        ✓ 7 contenus Insta en 60 secondes (3 posts + bio + newsletter + email + reel)
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        ✓ Calibré sur ton style à toi (voice cloning depuis tes posts existants)
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        ✓ 5 générations par jour, 100 par mois — tu n'atteindras jamais le plafond
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 24px;line-height:1.65">
        ✓ Annulable à tout moment depuis ton compte
      </p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:28px 0">
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        Une question, un retour, un truc qui ne va pas ? <strong>Réponds direct à ce mail</strong> — je lis tout, c'est moi en face.
      </p>
      <p style="font-size:14px;color:#6B7280;margin:16px 0 0;line-height:1.65;font-style:italic">
        Guillaume<br>
        <span style="font-size:13px;color:#9CA3AF">Fondateur, Kooach</span>
      </p>
    </div>`,
  });
}

/**
 * Email de confirmation d'inscription à la newsletter "Kooach Insider".
 * Annonce le rythme (1er du mois, 5 min de lecture) + ce qu'on enverra
 * (stats fitness FR + tips Insta + chiffres Kooach transparents).
 */
export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  await send({
    to: email,
    from: 'Guillaume de Kooach <contact@kooach.fr>',
    subject: 'Bienvenue dans Kooach Insider',
    html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111827">
      <p style="font-size:20px;font-style:italic;color:#2D6A4F;margin:0 0 28px">Kooach</p>
      <h1 style="font-size:24px;font-weight:700;margin:0 0 14px;line-height:1.3">Bienvenue dans <em style="color:#2D6A4F">Kooach Insider</em>.</h1>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.65">
        Tu vas recevoir 1 email par mois (le 1er), 5 minutes de lecture max, avec :
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        ✓ <strong>1 stat fitness FR du mois</strong> qui change les règles
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        ✓ <strong>1 tip Instagram concret</strong> (pas un truc générique)
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 24px;line-height:1.65">
        ✓ <strong>Les chiffres réels de Kooach</strong> en transparence (MRR, signups, churn)
      </p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:28px 0">
      <p style="font-size:14px;color:#374151;margin:0 0 12px;line-height:1.65">
        Pas de spam, pas de pitch produit lourd. Une lecture utile, pas plus.
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.65">
        Si jamais tu veux essayer Kooach pendant que t'attends le prochain numéro :
        <a href="https://kooach.fr/generateur-accroches" style="color:#2D6A4F;text-decoration:underline">le générateur d'accroches gratuit</a> est ouvert sans inscription.
      </p>
      <p style="font-size:14px;color:#6B7280;margin:24px 0 0;line-height:1.65;font-style:italic">
        Guillaume<br>
        <span style="font-size:13px;color:#9CA3AF">Fondateur, Kooach</span>
      </p>
    </div>`,
  });
}

/**
 * Email de confirmation envoyé après suppression définitive de compte (RGPD).
 */
export async function sendDeletionConfirmedEmail(email: string): Promise<void> {
  await send({
    to: email,
    subject: 'Ton compte Kooach a été supprimé',
    html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111827">
      <p style="font-size:20px;font-style:italic;color:#2D6A4F;margin:0 0 28px">Kooach</p>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 14px;line-height:1.3">Compte supprimé</h1>
      <p style="font-size:15px;color:#6B7280;margin:0 0 16px;line-height:1.65">
        Conformément à ta demande, ton compte Kooach et l'ensemble de tes données ont été supprimés définitivement de nos serveurs.
      </p>
      <p style="font-size:15px;color:#6B7280;margin:0 0 16px;line-height:1.65">
        Si tu avais un abonnement Stripe en cours, il a été annulé — aucun débit ne sera effectué.
      </p>
      <p style="font-size:13px;color:#9CA3AF;margin:24px 0 0;line-height:1.6">
        Tu peux nous écrire à contact@kooach.fr si tu as la moindre question.
      </p>
    </div>`,
  });
}
