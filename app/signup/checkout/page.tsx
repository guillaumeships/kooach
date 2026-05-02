/**
 * app/signup/checkout/page.tsx
 *
 * LEGACY redirect — conservée pour compat des anciens liens de mail (avant
 * Étape B no-CC trial 2026-05-21).
 *
 * Avant : signup → email confirm → /signup/checkout → /api/stripe/checkout
 *         (Stripe Checkout direct avec trial 7j Stripe-managed)
 *
 * Après : signup → /api/profile/init → /app (trial 7j Kooach-managed sans CB)
 *         La page paiement est /app/upgrade, déclenchée quand le trial expire.
 *
 * On redirige donc vers /app — l'user authentifié verra son dashboard, et
 * si son trial est déjà expiré, /app gère le redirect vers /app/upgrade.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function CheckoutRedirectPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login?next=/app');
  }

  redirect('/app');
}
