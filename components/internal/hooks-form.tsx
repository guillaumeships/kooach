'use client';

import { useState } from 'react';
import { Copy, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Hook {
  line1: string;
  line2: string;
}

interface DraftResponse {
  ok: boolean;
  handle: string;
  hook: Hook;
  post: string;
}

export function HooksForm() {
  const [handle, setHandle] = useState('');
  const [postsRaw, setPostsRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DraftResponse | null>(null);
  const [error, setError] = useState('');

  function splitPosts(raw: string): string[] {
    return raw
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);
  }

  async function generate(regen = false) {
    const cleanHandle = handle.trim().replace(/^@/, '');
    const posts = splitPosts(postsRaw);

    if (!cleanHandle) {
      setError('Handle requis.');
      return;
    }
    if (posts.length < 1) {
      setError("Au moins 1 post requis (>20 chars). Sépare les posts par une ligne vide.");
      return;
    }

    setLoading(true);
    setError('');
    if (!regen) setResult(null);

    try {
      const res = await fetch('/api/internal/hook-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ handle: cleanHandle, posts: posts.slice(0, 5) }),
      });
      const data = (await res.json()) as DraftResponse | { error: string };
      if (!res.ok || !('ok' in data) || !data.ok) {
        const msg = 'error' in data ? data.error : `Erreur ${res.status}`;
        setError(msg);
        return;
      }
      setResult(data);
      if (regen) toast.success('Nouvelle variation générée');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await generate(false);
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error('Impossible de copier');
    }
  }

  const postCount = splitPosts(postsRaw).length;
  const hookText = result ? `${result.hook.line1}\n${result.hook.line2}` : '';

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-kk-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="handle">Handle Instagram du prospect</Label>
          <Input
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@coach_anna"
            disabled={loading}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="posts">
            Posts récents — colle 1 à 5 captions, séparées par une <strong>ligne vide</strong>
          </Label>
          <Textarea
            id="posts"
            value={postsRaw}
            onChange={(e) => setPostsRaw(e.target.value)}
            placeholder={`Combien de fois tu t'es dit 'lundi je recommence'…\n\nHier une cliente m'a dit qu'elle se sentait nulle…\n\n[3e post optionnel]`}
            disabled={loading}
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {postCount > 0
              ? `${postCount} post${postCount > 1 ? 's' : ''} détecté${postCount > 1 ? 's' : ''}`
              : 'Aucun post détecté'}
            {postCount > 5 && ' (les 5 premiers seront utilisés)'}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={!handle.trim() || postCount < 1}
          block
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? 'Génération…' : result ? 'Régénérer une autre variation' : 'Générer le post calibré'}
        </Button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          <span className="text-sm">Analyse du style + génération du post… ~10-15 sec</span>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Post calibré pour @{result.handle}
          </p>

          {/* Card Hook — pour le DM */}
          <article className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 shadow-kk-sm">
            <header className="mb-3 flex items-center justify-between">
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-primary"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Hook · à coller dans le DM
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {result.hook.line1.length + result.hook.line2.length} chars · {result.hook.line1.length + result.hook.line2.length < 200 ? '✓ tient en preview Insta' : '⚠️ peut être tronqué'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(hookText, 'Hook')}
                className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-background px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
              >
                <Copy className="h-3.5 w-3.5" />
                Copier hook
              </button>
            </header>
            <p className="mb-1 text-[16px] font-semibold leading-snug text-foreground">
              {result.hook.line1}
            </p>
            <p className="text-[16px] leading-snug text-foreground">
              {result.hook.line2}
            </p>
          </article>

          {/* Card Post complet — pour le 2e DM (si réponse positive) */}
          <article className="rounded-2xl border border-border bg-card p-5 shadow-kk-sm">
            <header className="mb-3 flex items-center justify-between">
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Post complet · à envoyer si "oui"
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {result.post.length} chars · {result.post.length <= 1000 ? '✓ tient dans 1 DM Insta' : '⚠️ split en 2 DMs (limite 1000 chars/msg)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(result.post, 'Post complet')}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background"
              >
                <Copy className="h-3.5 w-3.5" />
                Copier post complet
              </button>
            </header>
            <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-foreground">
              {result.post}
            </pre>
          </article>

          <button
            type="button"
            onClick={() => generate(true)}
            disabled={loading}
            className="mx-auto flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Régénérer une autre variation (même prospect)
          </button>
        </div>
      )}
    </div>
  );
}
