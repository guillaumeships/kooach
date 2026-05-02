import { CommandMenu } from '@/components/command-menu';
import { EmailConfirmationBanner } from '@/components/dashboard/email-confirmation-banner';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Layout des routes authentifiées /app/*.
 *
 * Monte :
 *   - le CommandMenu (Cmd+K) accessible depuis toutes les pages app
 *   - le bandeau soft email confirmation (si l'user n'a pas encore confirmé son email)
 *
 * Note 2026-05-21 : on bloque PAS l'accès si email non confirmé (décision
 * insights conversion — éviter le -20-30% de drop sur le hard gate email).
 * Le bandeau est dismissable et non-bloquant.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let pendingEmail: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email && !user.email_confirmed_at) {
      pendingEmail = user.email;
    }
  } catch {
    // Si l'auth échoue ici, on ne montre simplement pas le banner.
    // L'auth proprement dite est gérée par les pages enfants.
  }

  return (
    <>
      {pendingEmail && <EmailConfirmationBanner email={pendingEmail} />}
      {children}
      <CommandMenu />
    </>
  );
}
