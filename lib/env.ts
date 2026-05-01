/**
 * lib/env.ts
 *
 * Validation des variables d'environnement avec zod.
 *
 * - Lazy : on lit la var au moment de l'usage (le build Next ne plante pas
 *   pour une var manquante côté client).
 * - Typed : import { env } from '@/lib/env'; env.ANTHROPIC_API_KEY est string.
 * - Erreur claire : pointe précisément la var manquante avec un message lisible.
 */

import { z } from 'zod';

const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY requise'),
  SUPABASE_URL: z.string().url('SUPABASE_URL doit être une URL valide'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY requise'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET requise'),
  TOKEN_SECRET: z.string().min(32, 'TOKEN_SECRET doit faire au moins 32 caractères (openssl rand -hex 32)'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY requise'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PORTAL_CONFIG_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET doit faire au moins 16 caractères').optional(),
  INTERNAL_API_SECRET: z.string().min(16, 'INTERNAL_API_SECRET doit faire au moins 16 caractères').optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY requise'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

function parseServer(name: keyof ServerEnv): ServerEnv[keyof ServerEnv] {
  const result = serverSchema.shape[name].safeParse(process.env[name]);
  if (!result.success) {
    throw new Error(`[env] ${name}: ${result.error.issues[0]?.message ?? 'invalide'}`);
  }
  return result.data;
}

function parseClient(name: keyof ClientEnv): ClientEnv[keyof ClientEnv] {
  const result = clientSchema.shape[name].safeParse(process.env[name]);
  if (!result.success) {
    throw new Error(`[env] ${name}: ${result.error.issues[0]?.message ?? 'invalide'}`);
  }
  return result.data;
}

/**
 * Server-side env (ne jamais importer dans un composant client).
 * Lazy : la var est lue au moment de l'access.
 */
export const env = {
  get ANTHROPIC_API_KEY() { return parseServer('ANTHROPIC_API_KEY') as string; },
  get SUPABASE_URL() { return parseServer('SUPABASE_URL') as string; },
  get SUPABASE_SERVICE_ROLE_KEY() { return parseServer('SUPABASE_SERVICE_ROLE_KEY') as string; },
  get STRIPE_WEBHOOK_SECRET() { return parseServer('STRIPE_WEBHOOK_SECRET') as string; },
  get TOKEN_SECRET() { return parseServer('TOKEN_SECRET') as string; },
  get RESEND_API_KEY() { return parseServer('RESEND_API_KEY') as string; },
  get STRIPE_SECRET_KEY() { return parseServer('STRIPE_SECRET_KEY') as string | undefined; },
  get STRIPE_PORTAL_CONFIG_ID() { return parseServer('STRIPE_PORTAL_CONFIG_ID') as string | undefined; },
  get SENTRY_DSN() { return parseServer('SENTRY_DSN') as string | undefined; },
  get SENTRY_AUTH_TOKEN() { return parseServer('SENTRY_AUTH_TOKEN') as string | undefined; },
  get CRON_SECRET() { return parseServer('CRON_SECRET') as string | undefined; },
  get INTERNAL_API_SECRET() { return parseServer('INTERNAL_API_SECRET') as string | undefined; },
};

/**
 * Client-side env (NEXT_PUBLIC_* uniquement).
 */
export const clientEnv = {
  get NEXT_PUBLIC_SUPABASE_URL() { return parseClient('NEXT_PUBLIC_SUPABASE_URL') as string; },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return parseClient('NEXT_PUBLIC_SUPABASE_ANON_KEY') as string; },
  get NEXT_PUBLIC_SENTRY_DSN() { return parseClient('NEXT_PUBLIC_SENTRY_DSN') as string | undefined; },
};
