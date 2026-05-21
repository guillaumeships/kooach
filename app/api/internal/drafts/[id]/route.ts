/**
 * app/api/internal/drafts/[id]/route.ts
 *
 * PATCH /api/internal/drafts/:id — update status, notes, response_text d'un draft.
 * DELETE /api/internal/drafts/:id — supprime un draft.
 *
 * Auth : founder uniquement.
 *
 * Body PATCH (tous optionnels, au moins 1 requis) :
 *   {
 *     status?:        'draft' | 'sent' | 'replied' | 'converted' | 'archived',
 *     notes?:         string | null,
 *     response_text?: string | null
 *   }
 *
 * Side effects sur status change :
 *   - status='sent'      → sent_at = now() si pas déjà set
 *   - status='replied'   → replied_at = now() si pas déjà set
 *   - status='converted' → converted_at = now() si pas déjà set
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFounderEmail } from '@/lib/internal-auth';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['draft', 'sent', 'replied', 'converted', 'archived'] as const;

interface PatchBody {
  status?: string;
  notes?: string | null;
  response_text?: string | null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const founderEmail = await getFounderEmail();
  if (!founderEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: PatchBody = {};
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!(VALID_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = body.status;
    const nowIso = new Date().toISOString();
    if (body.status === 'sent') update.sent_at = nowIso;
    if (body.status === 'replied') update.replied_at = nowIso;
    if (body.status === 'converted') update.converted_at = nowIso;
  }

  if (body.notes !== undefined) update.notes = body.notes;
  if (body.response_text !== undefined) update.response_text = body.response_text;

  const db = getSupabase();
  const { data, error } = await db
    .from('cold_dm_drafts')
    .update(update)
    .eq('id', id)
    .eq('founder_email', founderEmail) // garde-fou : ne pas update les drafts d'un autre founder
    .select('id, status, sent_at, replied_at, converted_at, notes, response_text, updated_at')
    .single();

  if (error) {
    console.error('drafts PATCH error:', error.message);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, draft: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const founderEmail = await getFounderEmail();
  if (!founderEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const db = getSupabase();
  const { error } = await db
    .from('cold_dm_drafts')
    .delete()
    .eq('id', id)
    .eq('founder_email', founderEmail);

  if (error) {
    console.error('drafts DELETE error:', error.message);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
