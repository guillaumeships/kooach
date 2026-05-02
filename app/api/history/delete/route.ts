/**
 * app/api/history/delete/route.ts
 *
 * POST /api/history/delete — supprime une génération.
 *
 * Sécurité : la suppression vérifie que le user_email de la ligne correspond
 * bien à l'email de l'utilisateur authentifié (Supabase Auth ou HMAC fallback).
 *
 * Corps : { token?, id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthedEmail } from '@/lib/auth-server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const email = await getAuthedEmail(req, body);
  if (!email) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: 'id manquant.' }, { status: 400 });
  }

  const db = getSupabase();
  const { error } = await db
    .from('generations')
    .delete()
    .eq('id', id)
    .eq('user_email', email); // double check : l'user ne peut supprimer QUE ses propres lignes

  if (error) {
    console.error('history/delete: erreur —', error.message);
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
