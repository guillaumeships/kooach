/**
 * Sentry client-side config (browser).
 * Le DSN est lu depuis NEXT_PUBLIC_SENTRY_DSN — si absent, Sentry est no-op.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
  });
}
