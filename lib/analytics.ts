/**
 * lib/analytics.ts
 *
 * Helper typé pour les custom events Plausible.
 *
 * Plausible est chargé via app/layout.tsx (script.tagged-events.js).
 * Cette fonction wrappe window.plausible() avec un typage strict et un
 * fallback no-op si Plausible n'est pas chargé (dev, blocked by adblocker).
 *
 * Pourquoi : sans tracking custom, on ne peut pas mesurer le funnel
 *   lead_magnet → newsletter → signup → paid.
 * Avec ces events + UTM cookies (cf middleware.ts), on a la full
 * attribution chaîne pour comprendre quel canal performe vraiment.
 */

type KooachEvent =
  | 'lead_magnet_accroches_generated'   // L'user a généré 10 accroches
  | 'lead_magnet_bio_generated'         // L'user a généré 5 bios
  | 'newsletter_signup'                 // Inscription newsletter Kooach Insider
  | 'signup_started'                    // L'user a atteint /signup
  | 'tool_copy_clicked'                 // Bouton copier dans un free tool cliqué
  | 'pricing_cta_clicked';              // Clic CTA pricing depuis landing

interface PlausibleProps {
  [key: string]: string | number | boolean;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleProps; callback?: () => void }) => void;
  }
}

/**
 * Tracke un event Plausible custom. No-op si Plausible n'est pas chargé.
 *
 * Exemple :
 *   track('newsletter_signup', { source: 'footer' });
 *   track('lead_magnet_accroches_generated', { niche: 'musculation' });
 */
export function track(event: KooachEvent, props?: PlausibleProps): void {
  if (typeof window === 'undefined') return;
  if (!window.plausible) return;

  try {
    window.plausible(event, props ? { props } : undefined);
  } catch (e) {
    // Plausible peut être bloqué par adblocker — silent fail
    if (process.env.NODE_ENV === 'development') {
      console.warn('[analytics] track failed:', event, e);
    }
  }
}
