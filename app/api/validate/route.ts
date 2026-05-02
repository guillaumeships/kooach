/**
 * app/api/validate/route.ts
 *
 * Route POST /api/validate — vérifie qu'un token est valide et non expiré.
 * Utilisé par le client pour tester le token stocké dans localStorage (kk_t)
 * avant d'afficher le dashboard.
 *
 * Corps JSON attendu : { token: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidToken } from '@/lib/token';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  const { token } = body;

  if (isValidToken(token)) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
}
