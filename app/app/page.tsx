'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import {
  History as HistoryIcon,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggleCompact } from '@/components/theme-toggle';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import { CardSkeleton, ResultCard } from '@/components/dashboard/result-card';
import { DashboardHero, type DashboardState } from '@/components/dashboard/dashboard-hero';
import { ProfileForm } from '@/components/dashboard/profile-form';

import { CARDS } from '@/lib/cards-config';
import { useClipboard } from '@/hooks/use-clipboard';
import { useGenerate } from '@/hooks/use-generate';
import { getStreakStatus } from '@/lib/retention';
import { authBody, PROFILE_KEY, RELOAD_KEY, TOKEN_KEY } from '@/lib/storage';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';

import type { GenerationResult } from '@/types/database';

type AuthState = 'loading' | 'authorized';

interface SavedProfile {
  specialty: string;
  style: string;
  keywords: string;
  target: string;
  posts: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthState>('loading');
  const [token, setToken] = useState('');
  const [tokenDaysLeft, setTokenDaysLeft] = useState<number | null>(null);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  const [specialty, setSpecialty] = useState('');
  const [style, setStyle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [target, setTarget] = useState('');
  const [posts, setPosts] = useState('');
  const [objectif, setObjectif] = useState('');

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { copiedKey, copy } = useClipboard();
  const {
    genState,
    errorMessage,
    result,
    regenKey,
    streakCount,
    isAnyBusy,
    generate,
    regenerate,
    setResult,
    setGenState,
    setStreakCount,
  } = useGenerate(token);

  const canGenerate =
    specialty.trim().length > 0 &&
    style.trim().length > 0 &&
    keywords.trim().length > 0 &&
    target.trim().length > 0;

  const profilePayload = { specialty, style, keywords, target, posts, objectif };

  // ── Auth flow ────────────────────────────────────────────────────────────
  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      window.history.replaceState({}, '', '/app');
    }
    const stored = localStorage.getItem(TOKEN_KEY);
    const supabase = createSupabaseBrowserClient();

    function loadSavedProfile() {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return;
        const p = JSON.parse(raw) as Partial<SavedProfile>;
        if (p.specialty) setSpecialty(p.specialty);
        if (p.style) setStyle(p.style);
        if (p.keywords) setKeywords(p.keywords);
        if (p.target) setTarget(p.target);
        if (p.posts) setPosts(p.posts);
      } catch {
        /* corrupt */
      }
    }

    function loadAccountData(legacyToken: string | null) {
      fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(legacyToken ? { token: legacyToken } : {}),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (
            d: {
              streak_count?: number;
              total_generations?: number;
              last_generated_at?: string | null;
              trial_end?: string | null;
              has_stripe_customer?: boolean;
              subscription_active?: boolean;
              profile?: {
                specialty?: string | null;
                style?: string | null;
                keywords?: string | null;
                target?: string | null;
                example_posts?: string | null;
              };
            } | null
          ) => {
            if (!d) return;
            // Gate accès (Étape B no-CC trial 2026-05-21, patch 2026-05-21 hotfix) :
            //   Tout user dont subscription_active=false n'a plus accès à /app.
            //   Couvre 2 cas :
            //     1) Trial Kooach expiré sans paiement (cron trial-expired a tourné)
            //     2) Sub Stripe annulée (webhook subscription.deleted a tourné)
            //   Dans les 2 cas → redirect /app/upgrade où l'user peut (re)mettre sa CB.
            //   Note : `?? true` côté API pour les users HMAC legacy sans profil →
            //   ils restent OK, jamais redirigés.
            if (d.subscription_active === false) {
              router.push('/app/upgrade');
              return;
            }
            if (typeof d.streak_count === 'number') setStreakCount(d.streak_count);
            if (typeof d.total_generations === 'number') setTotalGenerations(d.total_generations);
            if (d.last_generated_at !== undefined) setLastGeneratedAt(d.last_generated_at);
            // Trial countdown : on utilise tokenDaysLeft pour réutiliser le même
            // bandeau UI (qui affiche déjà le warning ≤3j).
            if (d.trial_end) {
              const ms   = new Date(d.trial_end).getTime() - Date.now();
              const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
              if (days > 0) setTokenDaysLeft(days);
            }
            if (d.profile) {
              if (d.profile.specialty) setSpecialty((cur) => cur || d.profile!.specialty!);
              if (d.profile.style) setStyle((cur) => cur || d.profile!.style!);
              if (d.profile.keywords) setKeywords((cur) => cur || d.profile!.keywords!);
              if (d.profile.target) setTarget((cur) => cur || d.profile!.target!);
              if (d.profile.example_posts)
                setPosts((cur) => cur || d.profile!.example_posts!);
            }
          }
        )
        .catch(() => {});
    }

    (async () => {
      try {
        const reloadRaw = sessionStorage.getItem(RELOAD_KEY);
        if (reloadRaw) {
          sessionStorage.removeItem(RELOAD_KEY);
          const reloaded = JSON.parse(reloadRaw) as Partial<GenerationResult>;
          setResult(reloaded);
          setGenState('done');
        }
      } catch {}

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setToken('');
          setAuthState('authorized');
          setTokenDaysLeft(null);
          loadSavedProfile();
          loadAccountData(null);
          return;
        }
      } catch {}

      if (stored) {
        try {
          const dot = stored.lastIndexOf('.');
          if (dot > 0) {
            const payload = JSON.parse(
              atob(stored.slice(0, dot).replace(/-/g, '+').replace(/_/g, '/'))
            ) as { exp?: number };
            if (typeof payload.exp === 'number') {
              const days = Math.ceil((payload.exp - Date.now()) / (24 * 60 * 60 * 1000));
              setTokenDaysLeft(days);
            }
          }
        } catch {}

        try {
          const res = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: stored }),
          });
          if (!res.ok) {
            localStorage.removeItem(TOKEN_KEY);
            router.replace('/login');
            return;
          }
          setToken(stored);
          setAuthState('authorized');
          loadSavedProfile();
          loadAccountData(stored);
          return;
        } catch {
          router.replace('/login');
          return;
        }
      }

      router.replace('/login');
    })();
  }, [router, setGenState, setResult, setStreakCount]);

  // ── Cmd+Enter pour générer ───────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (!canGenerate || isAnyBusy) return;
        e.preventDefault();
        handleGenerate();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canGenerate, isAnyBusy]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Detect mobile viewport (responsive sheet behavior) ───────────────────
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  function handleGenerate() {
    setMobileNavOpen(false);
    generate(profilePayload);
  }

  function handleLoadExample() {
    setSpecialty('Coach sportif spécialisé transformation physique');
    setStyle(
      "Direct, bienveillant, pas de bullshit. J'utilise des analogies concrètes et des exemples client réels."
    );
    setKeywords('Force · Constance · Mobilité');
    setTarget(
      'Femmes 35-55 sédentaires qui veulent reprendre confiance dans leur corps après des années sans sport'
    );
    setPosts(
      `Marie, 42 ans, m'a dit hier : "C'est la première fois en 10 ans que je me sens forte." Pas la plus performante. Pas la plus mince. Forte. Et c'est exactement ce que je vise avec mes clientes — pas un corps qu'on impose, mais un corps qu'on habite.

Tu fais 3 séances par semaine et tu progresses pas ? Voilà la variable que 90% des gens ignorent — et qui change tout : la récupération. La progression ne se passe pas pendant l'effort. Elle se passe pendant la récup. Quand tu dors. Quand tu manges.`
    );
    setObjectif('Attirer des DMs');
    setMobileNavOpen(true);
  }

  const [emailSending, setEmailSending] = useState(false);

  async function handleSendEmail() {
    if (!result || emailSending) return;
    setEmailSending(true);
    try {
      const res = await fetch('/api/generate/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authBody(), result }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; sentTo?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Échec de l'envoi");
      }
      toast.success('📩 Envoyé sur ton email', {
        description: data.sentTo ? `Sur ${data.sentTo}` : 'Vérifie ta boîte mail.',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur réseau, réessaye.');
    } finally {
      setEmailSending(false);
    }
  }

  async function handleLogout() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    router.push('/');
    router.refresh();
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="m-0 font-display text-[22px] italic text-primary">Kooach</p>
          <p className="mt-2.5 text-[13px] text-muted-foreground">Chargement…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="kk-app-layout kk-noise bg-background">
        {/* Contenu du panel — partagé entre Vaul Drawer (mobile) et motion.aside (desktop) */}
        {(() => {
          const panelHeader = (
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-display text-[20px] italic tracking-tight text-primary">
                Kooach
              </span>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => router.push('/app/history')} aria-label="Historique" className="h-8 w-8">
                  <HistoryIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => router.push('/app/account')} aria-label="Mon compte" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Déconnexion" className="h-8 w-8">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Fermer"
                  className="h-8 w-8 rounded-full bg-muted md:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );

          const panelBody = (
            <>
              {tokenDaysLeft !== null && tokenDaysLeft <= 3 && tokenDaysLeft > 0 && (
                <button
                  onClick={() => router.push('/app/account')}
                  className="mx-4 mt-2.5 cursor-pointer rounded-md border border-warning/30 bg-warning-subtle px-3 py-2 text-left text-[11px] leading-relaxed text-warning-foreground"
                >
                  ⚠ Ton accès expire dans {tokenDaysLeft} jour{tokenDaysLeft > 1 ? 's' : ''}. Vérifie ton abonnement.
                </button>
              )}

              <ProfileForm
                specialty={specialty}
                style={style}
                keywords={keywords}
                target={target}
                posts={posts}
                objectif={objectif}
                setSpecialty={setSpecialty}
                setStyle={setStyle}
                setKeywords={setKeywords}
                setTarget={setTarget}
                setPosts={setPosts}
                setObjectif={setObjectif}
                errorMessage={genState === 'error' ? errorMessage : undefined}
                canGenerate={canGenerate}
                isGenerating={genState === 'generating'}
                onGenerate={handleGenerate}
              />
            </>
          );

          // ── MOBILE : Vaul Drawer (gère iOS Safari pull-to-refresh, body scroll lock,
          //    drag-to-close natif, touch-action). Pattern utilisé par Vercel, Linear, Resend.
          if (isMobile) {
            return (
              <Drawer.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen} shouldScaleBackground={false}>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" />
                  <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] flex-col rounded-t-[22px] border-t border-border/60 bg-card/95 outline-none backdrop-blur-2xl dark:bg-[hsl(220_13%_12%)]/95">
                    <Drawer.Title className="sr-only">Mon profil</Drawer.Title>
                    <Drawer.Description className="sr-only">Configure ton profil pour générer des contenus calibrés</Drawer.Description>
                    {/* Handle iOS-style — Vaul détecte cette zone comme drag-handle */}
                    <div aria-hidden className="mx-auto mt-2 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/40" />
                    {panelHeader}
                    {panelBody}
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>
            );
          }

          // ── DESKTOP : motion.aside slide-in droit (Vaul est mobile-first)
          return (
            <>
              <AnimatePresence>
                {mobileNavOpen && (
                  <motion.div
                    key="kk-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="kk-sidebar-backdrop"
                    onClick={() => setMobileNavOpen(false)}
                    aria-hidden="true"
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {mobileNavOpen && (
                  <motion.aside
                    key="kk-profile-panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.6 }}
                    className="kk-sidebar relative flex flex-col overflow-hidden border-border"
                  >
                    {panelHeader}
                    {panelBody}
                  </motion.aside>
                )}
              </AnimatePresence>
            </>
          );
        })()}

        {/* Main */}
        <div className="kk-main flex flex-col bg-background">
          <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-5 py-3 backdrop-blur-xl md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="font-display text-[20px] italic tracking-tight text-primary">
                Kooach
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {result && genState !== 'generating' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSendEmail}
                    disabled={emailSending}
                    aria-label="Envoyer par mail"
                    title="Envoyer par mail"
                    className="h-9 w-9"
                  >
                    {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGenerate}
                    disabled={isAnyBusy}
                    aria-label="Tout refaire"
                    title="Tout refaire"
                    className="h-9 w-9"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                </>
              )}
              <ThemeToggleCompact className="h-9 w-9" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-full"
                leftIcon={SlidersHorizontal}
              >
                Profil
              </Button>
            </div>
          </header>

          <div className="kk-main-content mx-auto w-full max-w-3xl">
            {/* Bandeau rétention — streak danger (loss aversion) ou retour
                après inactivité. Rendu uniquement en idle pour ne pas
                polluer pendant la génération. Pattern Duolingo. */}
            {genState === 'idle' && !result && (() => {
              const status = getStreakStatus(streakCount, lastGeneratedAt);
              if (status.kind === 'safe' || status.kind === 'none') return null;
              if (status.kind === 'warning' || status.kind === 'critical') {
                const isCritical = status.kind === 'critical';
                const hours = Math.round(status.hoursLeft);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'mx-5 mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-2.5 md:mx-6',
                      isCritical
                        ? 'border-destructive/30 bg-destructive/5 text-destructive-foreground'
                        : 'border-amber-500/25 bg-amber-500/8 dark:bg-amber-500/12',
                    )}
                  >
                    <span className="text-[16px] leading-none">🔥</span>
                    <span className="font-display text-[13.5px] font-semibold leading-snug tracking-tight text-foreground">
                      {isCritical
                        ? `Ton streak de ${status.streak}j est en danger`
                        : `Ton streak de ${status.streak}j fond`}
                      <span className="ml-1 font-normal text-muted-foreground">
                        — il te reste {hours}h
                      </span>
                    </span>
                  </motion.div>
                );
              }
              if (status.kind === 'broken') {
                return (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mx-5 mt-4 flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary-subtle/60 px-4 py-2.5 md:mx-6"
                  >
                    <span className="text-[16px] leading-none">👋</span>
                    <span className="font-display text-[13.5px] font-semibold leading-snug tracking-tight text-foreground">
                      Pas de contenu depuis {status.daysSince} jours
                      <span className="ml-1 font-normal text-muted-foreground">
                        — reprends ta lancée.
                      </span>
                    </span>
                  </motion.div>
                );
              }
              return null;
            })()}

            {(genState === 'idle' || (genState === 'error' && !result)) && (() => {
              const profileFilled =
                specialty.trim().length > 0 &&
                style.trim().length > 0 &&
                keywords.trim().length > 0 &&
                target.trim().length > 0;
              const dashState: DashboardState = !profileFilled
                ? 'profileEmpty'
                : totalGenerations > 0
                  ? 'returning'
                  : 'ready';
              return (
                <DashboardHero
                  state={dashState}
                  totalGenerations={totalGenerations}
                  canGenerate={canGenerate}
                  isAnyBusy={isAnyBusy}
                  selectedObjectif={objectif}
                  onGenerate={handleGenerate}
                  onObjectifSelect={setObjectif}
                  onLoadExample={!specialty.trim() ? handleLoadExample : undefined}
                  onOpenProfile={() => setMobileNavOpen(true)}
                />
              );
            })()}

            {/* Streaming en cours OU résultat affiché : on rend les cards qui
                se remplissent au fur et à mesure. Si un champ n'est pas encore
                arrivé du stream, on montre un Skeleton pour cette card uniquement. */}
            {(genState === 'generating' || (result && genState === 'done')) && (
              <motion.div className="flex flex-col gap-4 p-6">
                {CARDS.map((card, idx) => {
                  // Une card est "prête" si tous ses fields sont présents et non vides
                  const isReady = card.fields.every(
                    (f) => result && typeof result[f] === 'string' && (result[f] as string).trim().length > 0,
                  );

                  if (!isReady && genState === 'generating') {
                    return <CardSkeleton key={card.only} />;
                  }

                  return (
                    <ResultCard
                      key={card.only}
                      card={card}
                      result={result ?? {}}
                      isRegening={regenKey === card.only}
                      copiedKey={copiedKey}
                      anyBusy={isAnyBusy}
                      onCopy={copy}
                      onRegen={(only) => regenerate(only, profilePayload)}
                      index={idx}
                    />
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
