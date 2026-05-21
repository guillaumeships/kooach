/**
 * app/api/internal/drafts/route.ts
 *
 * GET /api/internal/drafts — liste les drafts du founder authentifié.
 *
 * Query params optionnels :
 *   - status: 'draft' | 'sent' | 'replied' | 'converted' | 'archived' | 'all'
 *   - limit: number (default 50, max 200)
 *
 * Auth : founder uniquement (Supabase Auth cookie + email ∈ FOUNDER_EMAILS).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFounderEmail } from '@/lib/internal-auth';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const VALID_STATUSES = ['draft', 'sent', 'replied', 'converted', 'archived'] as const;

export async function GET(req: NextRequest) {
  const founderEmail = await getFounderEmail();
  if (!founderEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limitRaw = parseInt(searchParams.get('limit') ?? '50', 10);
  const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 200);

  const db = getSupabase();
  let query = db
    .from('cold_dm_drafts')
    .select('id, prospect_handle, hook_line1, hook_line2, full_post, status, response_text, notes, sent_at, replied_at, converted_at, created_at, updated_at')
    .eq('founder_email', founderEmail)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all' && (VALID_STATUSES as readonly string[]).includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('drafts GET error:', error.message);
    return NextResponse.json({ error: 'DB read failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, drafts: data ?? [] });
}
