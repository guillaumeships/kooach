'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Flame,
  Key,
  Lock,
  LogOut,
  Mail,
  Palette,
  Trash2,
  User,
} from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';

import { AppPageHeader } from '@/components/dashboard/app-page-header';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { clearLocalAuth, getToken, TOKEN_KEY } from '@/lib/storage';
import { formatTimeSaved } from '@/lib/format';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';

interface AccountInfo {
  email: string;
  subscription_active: boolean;
  has_stripe_customer: boolean;
  streak_count: number;
  total_generations: number;
  member_since: string | null;
  token_expires_at: number | null;
}

function authBody(extra: Record<string, unknown> = {}) {
  const t = getToken();
  return t ? { token: t, ...extra } : extra;
}

export default function AccountPage() {
  const router = useRouter();
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsSupabaseAuth(Boolean(user));
      try {
        const res = await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authBody()),
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            router.push('/login');
            return;
          }
          throw new Error('Erreur de chargement');
        }
        const data = (await res.json()) as AccountInfo;
        setInfo(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleLogout() {
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } catch {}
    clearLocalAuth();
    toast.success('Déconnecté·e — à bientôt 👋');
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="kk-page-with-bottom-nav flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement…</p>
        <BottomNav />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="kk-page-with-bottom-nav flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Erreur de chargement.</p>
        <BottomNav />
      </div>
    );
  }

  const initials =
    info.email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('') || 'K';

  const memberSince = info.member_since
    ? new Date(info.member_since).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="kk-page-with-bottom-nav kk-noise min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Desktop : back nav (mobile: header géré par le hero ci-dessous) */}
        <AppPageHeader title="Mon compte" subtitle="Profil, sécurité, abonnement." />

        {/* Hero — refonte 2026 : panneau dark-warm avec mesh subtle + halos + ring */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary-subtle/40 p-5 shadow-kk-lg dark:from-[hsl(220_13%_10%)] dark:via-[hsl(220_13%_8%)] dark:to-[hsl(152_30%_12%)] sm:p-7">
          {/* Mesh halos subtle (pas le gradient flat saturé d'avant) */}
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          {/* Noise overlay */}
          <div className="kk-noise pointer-events-none absolute inset-0" aria-hidden />

          <div className="relative flex items-center gap-4">
            <div className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-primary-hover text-lg font-bold text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold text-foreground">
                {info.email}
              </div>
              {memberSince && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Membre depuis {memberSince}
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <HeroStat
              icon={<Check className="h-3.5 w-3.5" />}
              iconBg="bg-primary/15 text-primary"
              label={info.subscription_active ? 'Actif' : 'Inactif'}
              sub="Abonnement"
            />
            <HeroStat
              icon={<Flame className="h-3.5 w-3.5" />}
              iconBg="bg-amber-500/15 text-amber-600 dark:text-amber-400"
              label={`${info.streak_count}j`}
              sub="Streak"
            />
            <HeroStat
              icon={<FileText className="h-3.5 w-3.5" />}
              iconBg="bg-violet-500/15 text-violet-600 dark:text-violet-400"
              label={String(info.total_generations)}
              sub={info.total_generations > 1 ? 'Contenus' : 'Contenu'}
            />
            <HeroStat
              icon={<Clock className="h-3.5 w-3.5" />}
              iconBg="bg-sky-500/15 text-sky-600 dark:text-sky-400"
              label={info.total_generations === 0 ? '—' : formatTimeSaved(info.total_generations)}
              sub="Temps gagné"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="profile">
              <User className="h-3.5 w-3.5" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-3.5 w-3.5" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-3.5 w-3.5" />
              Abonnement
            </TabsTrigger>
            <TabsTrigger value="danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Avancé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection info={info} onLogout={handleLogout} />
          </TabsContent>
          <TabsContent value="security">
            <SecuritySection info={info} isSupabaseAuth={isSupabaseAuth} />
          </TabsContent>
          <TabsContent value="subscription">
            <SubscriptionSection info={info} />
          </TabsContent>
          <TabsContent value="danger">
            <DangerSection router={router} />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}

// ── Hero stat tile ────────────────────────────────────────────────────────────

function HeroStat({
  icon,
  iconBg,
  label,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-2.5 backdrop-blur-md">
      <div className="mb-1 flex items-center gap-1.5">
        <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-md', iconBg)}>
          {icon}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {sub}
        </span>
      </div>
      <div className="font-display truncate text-lg font-bold leading-none text-foreground">
        {label}
      </div>
    </div>
  );
}

// ── Section : Profil ─────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  highlight,
  last,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: 'success' | 'destructive';
  last?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span
          className={cn(
            'text-[13px] font-semibold',
            highlight === 'success' && 'text-primary',
            highlight === 'destructive' && 'text-destructive'
          )}
        >
          {value}
        </span>
      </div>
      {!last && <Separator />}
    </>
  );
}

function ProfileSection({
  info,
  onLogout,
}: {
  info: AccountInfo;
  onLogout: () => void;
}) {
  const timeSaved = info.total_generations === 0 ? '—' : formatTimeSaved(info.total_generations);

  return (
    <div className="space-y-4">
      <Card className="kk-card-premium kk-noise overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <User className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            Tes informations
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <InfoRow label="Email" value={info.email} />
          <InfoRow
            label="Abonnement"
            value={info.subscription_active ? '✓ Actif' : '✗ Inactif'}
            highlight={info.subscription_active ? 'success' : 'destructive'}
          />
          <InfoRow
            label="Streak actuel"
            value={`🔥 ${info.streak_count} jour${info.streak_count > 1 ? 's' : ''}`}
          />
          <InfoRow
            label="Total créés"
            value={`${info.total_generations} contenu${info.total_generations > 1 ? 's' : ''}`}
          />
          <InfoRow label="Temps économisé" value={timeSaved} last />
        </CardContent>
      </Card>

      <Card className="kk-card-premium kk-noise overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Palette className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            Apparence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="m-0 text-sm font-medium text-foreground">Thème</p>
              <p className="m-0 mt-0.5 text-xs text-muted-foreground">
                Suit ton OS par défaut. Tu peux forcer clair ou sombre.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="kk-card-premium kk-noise overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm leading-relaxed text-muted-foreground">
            Tu peux te déconnecter de cet appareil. Tu pourras te reconnecter à tout moment.
          </p>
          <div className="mt-4">
            <Button variant="secondary" leftIcon={LogOut} onClick={onLogout}>
              Me déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section : Sécurité ───────────────────────────────────────────────────────

function SecuritySection({
  info,
  isSupabaseAuth,
}: {
  info: AccountInfo;
  isSupabaseAuth: boolean;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [emailLoad, setEmailLoad] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoad, setPassLoad] = useState(false);

  if (!isSupabaseAuth) {
    return (
      <Card className="kk-card-premium kk-noise overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Lock className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm leading-relaxed text-muted-foreground">
            Tu utilises un ancien lien d&apos;accès magique. Pour gérer ton mot de passe, migre
            ton compte vers le nouveau système :
          </p>
          <ol className="mt-3 list-decimal pl-5 text-[13.5px] leading-relaxed text-foreground/80">
            <li>
              Va sur{' '}
              <a href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
                Mot de passe oublié
              </a>
            </li>
            <li>Tape ton email ({info.email})</li>
            <li>Tu recevras un mail pour définir un mot de passe</li>
            <li>Reviens te connecter via /login avec email + mot de passe</li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoad(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim().toLowerCase(),
    });
    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      toast.success('Email de confirmation envoyé');
      setNewEmail('');
    }
    setEmailLoad(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8 || newPassword !== confirmPassword) return;
    setPassLoad(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      toast.success('Mot de passe mis à jour');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPassLoad(false);
  }

  return (
    <div className="space-y-4">
      <Card className="kk-card-premium kk-noise overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Mail className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            Changer mon email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email actuel : <strong className="text-foreground">{info.email}</strong>
          </p>
          <form onSubmit={handleChangeEmail} className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Nouvel email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="nouveau@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={emailLoad}
              />
            </div>
            <Button
              type="submit"
              loading={emailLoad}
              disabled={!newEmail.trim()}
              leftIcon={Mail}
            >
              Envoyer le lien de confirmation
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="kk-card-premium kk-noise overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Key className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            Changer mon mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">8 caractères minimum.</p>
          <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                disabled={passLoad}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirme</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                disabled={passLoad}
                autoComplete="new-password"
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">
                Les mots de passe ne correspondent pas.
              </p>
            )}
            <Button
              type="submit"
              loading={passLoad}
              disabled={newPassword.length < 8 || newPassword !== confirmPassword}
              leftIcon={Key}
            >
              Mettre à jour
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section : Abonnement ─────────────────────────────────────────────────────

function SubscriptionSection({ info }: { info: AccountInfo }) {
  const [portalLoad, setPortalLoad] = useState(false);
  const [error, setError] = useState('');

  const days = info.token_expires_at
    ? Math.max(0, Math.ceil((info.token_expires_at - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  async function handlePortal() {
    setPortalLoad(true);
    setError('');
    try {
      const res = await fetch('/api/account/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authBody()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setPortalLoad(false);
    }
  }

  return (
    <Card className="kk-card-premium kk-noise overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <CreditCard className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
          Mon abonnement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          Annule, change de moyen de paiement ou consulte tes factures depuis l&apos;espace
          sécurisé Stripe.
        </p>

        <div className="mt-4">
          <InfoRow
            label="Statut"
            value={info.subscription_active ? '✓ Actif' : '✗ Inactif'}
            highlight={info.subscription_active ? 'success' : 'destructive'}
          />
          <InfoRow label="Plan" value="Kooach Pro · 29 €/mois" />
          {days !== null && (
            <InfoRow
              label="Accès magic link"
              value={days === 0 ? 'Expiré' : `${days} jour${days > 1 ? 's' : ''}`}
              highlight={days <= 3 ? 'destructive' : undefined}
              last
            />
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {info.has_stripe_customer ? (
          <div className="mt-4">
            <Button loading={portalLoad} onClick={handlePortal} rightIcon={ExternalLink}>
              Gérer mon abonnement
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Aucun abonnement Stripe associé à ce compte.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section : Danger zone ────────────────────────────────────────────────────

function DangerSection({ router }: { router: ReturnType<typeof useRouter> }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (confirmText !== 'SUPPRIMER') return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authBody({ confirm: 'SUPPRIMER' })),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      try {
        await createSupabaseBrowserClient().auth.signOut();
      } catch {}
      clearLocalAuth();
      toast.success('Compte supprimé définitivement');
      router.push('/?deleted=1');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="kk-card-premium kk-noise overflow-hidden border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-destructive">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            Zone sensible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm leading-relaxed text-muted-foreground">
            La suppression de ton compte est <strong>définitive</strong>. Toutes tes données
            (profil, contenus générés, historique) seront effacées et ton abonnement Stripe
            sera annulé immédiatement.
          </p>
          <div className="mt-4">
            <Button
              variant="destructiveOutline"
              leftIcon={Trash2}
              onClick={() => setOpen(true)}
            >
              Supprimer mon compte
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer définitivement ?</DialogTitle>
            <DialogDescription>
              Pour confirmer, tape <strong>SUPPRIMER</strong> en majuscules. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="SUPPRIMER"
            autoFocus
          />
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setConfirmText('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={loading}
              disabled={confirmText !== 'SUPPRIMER'}
              leftIcon={Trash2}
              onClick={handleDelete}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
