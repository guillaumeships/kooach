import { redirect } from 'next/navigation';
import { getFounderEmail } from '@/lib/internal-auth';
import { NavInternal } from '@/components/internal/nav-internal';

/**
 * Layout des routes /internal/* (founder-only).
 *
 * Gate strict : si l'user n'est pas un founder (cf. FOUNDER_EMAILS dans
 * lib/internal-auth.ts), redirect /app (404 perçu).
 *
 * Nav minimaliste (Hook Generator / Drafts), pas de CommandMenu, pas de
 * bandeau email, pas de nav landing.
 */
export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await getFounderEmail();
  if (!email) {
    redirect('/app');
  }
  return (
    <>
      <NavInternal />
      {children}
    </>
  );
}
