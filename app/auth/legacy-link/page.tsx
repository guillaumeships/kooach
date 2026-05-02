'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const TOKEN_KEY = 'kk_t';

function Inner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        /* localStorage indisponible — l'app demandera de re-login. */
      }
    }
    router.replace('/app');
  }, [router, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Connexion en cours…</p>
    </div>
  );
}

export default function LegacyLinkPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
