# Kooach

> Un ghost-writer IA pour coachs sportifs FR. **Projet en pause.** Repo laissé public pour montrer ce que j'ai essayé, comment c'est fait, et ce que j'ai appris en le foirant.

kooach.fr sert désormais une page de maintenance. Le code, lui, est ici.

---

## L'histoire courte

Je m'appelle **Guillaume**. J'ai construit Kooach avec **[Claude Code](https://claude.com/claude-code)** — un SaaS complet, en prod, avec Stripe qui tourne, un dashboard qui stream de la génération IA en direct, un blog SEO, deux lead magnets, un funnel trial 7 jours, tout le tralala.

Et j'ai fait **la classique erreur du dev qui code trop et parle pas assez** : j'ai builder un produit avant d'avoir la moindre confirmation que quelqu'un le voulait. Zéro discovery. Zéro conversation client sérieuse. Juste une intuition ("les coachs sportifs galèrent avec Insta") et beaucoup de nuits à builder.

Résultat : produit live, 0 client payant. Pas parce que la tech ne marche pas — elle marche très bien — mais parce que je résolvais un problème que personne ne m'avait vraiment décrit. Une légende Instagram, c'est une vitamine, pas un antidouleur. Et on paie pas 29€/mois pour une vitamine.

Donc **je mets sur pause** au lieu de continuer à pousser dans le vide. Je ne referme pas la porte, je regarde sur quoi ce projet peut basculer. Pas encore de plan précis — juste la certitude que continuer en ligne droite serait pousser dans le mur.

---

## Est-ce que Kooach est un wrapper IA ?

Oui. Assumé.

Le cœur du produit c'est un appel à **Claude Sonnet** (via Vercel AI Gateway) avec un system prompt bien travaillé, un schéma zod partagé client/serveur pour parser la sortie au fil de l'eau, et pas mal d'UX autour pour que l'utilisateur remplisse son profil une fois et retrouve ensuite ses 7 contenus streamés token par token.

Est-ce que ça a de la valeur ? Techniquement oui — le streaming structuré, le rate limit, l'auth, le paiement, l'attribution UTM, les webhooks Stripe idempotents, tout ça c'est du vrai boulot. Est-ce que c'est un moat défendable ? Non. Un wrapper reste un wrapper. Le moat aurait été la **distribution** et la **spécialisation extrême sur un pain point** — deux trucs que je n'avais pas.

---

## Stack

| | |
|---|---|
| **Framework** | Next.js 14.2 (App Router) |
| **UI** | shadcn/ui + Tailwind (CSS vars HSL) + Framer Motion |
| **IA** | Vercel AI SDK + AI Gateway → `claude-sonnet-4-6` (fallback direct Anthropic) |
| **Auth** | Supabase Auth (email/pass + Google OAuth) |
| **Paiement** | Stripe Checkout Session (API, pas Payment Link — cf. gotcha ci-dessous) |
| **DB** | Supabase Postgres avec RLS strict |
| **Email** | Resend (transactional) |
| **Analytics** | Plausible + Sentry |
| **Tests** | Playwright (3 e2e golden path) |
| **Hosting** | Vercel (+ 2 crons quotidien/hebdo) |
| **Validation** | zod (env vars + schéma IA partagé) |

---

## Architecture

```
app/
├── (public)/            # landing conversion-first, blog SSG, lead magnets, mentions légales
├── app/                 # 🔒 dashboard authentifié — profil coach + génération
├── api/
│   ├── generate/            # POST JSON (regen unitaire)
│   ├── generate/stream/     # streamObject Vercel AI SDK (génération complète)
│   ├── stripe/checkout/     # Checkout Session API
│   ├── webhook/             # Stripe events (trial_end, sub deleted/updated)
│   ├── cron/                # weekly-recap + lead-magnet-nurture + trial-J+1
│   └── account/             # info, portal, delete
├── auth/                # callback Supabase + magic link legacy
├── maintenance/         # 🚧 page servie depuis le middleware
└── internal/            # routes founder-only (drafts + hooks) — gated par FOUNDER_EMAILS

components/  ui (shadcn) + dashboard + landing + auth + internal
hooks/       use-generate (streaming + regen) + use-clipboard
lib/         anthropic, env (zod), rate-limit, supabase, email-*, internal-auth
content/blog/*.md         # articles SEO (SSG)
supabase/migrations/      # SQL appliqués manuellement via SQL Editor
middleware.ts             # refresh Supabase session + capture UTM + mode maintenance
```

### Flux génération (le truc central)

1. L'utilisateur remplit son profil coach (ton, sujets, style) sur `/app`
2. `Cmd+Enter` → hook `useGenerate` → POST `/api/generate/stream`
3. Server : vérif auth + rate limit + abonnement actif
4. `streamObject` (Vercel AI SDK) appelle Claude via Gateway avec un schéma zod partagé
5. Côté client, `experimental_useObject` reçoit les 7 contenus **token par token**
6. `onFinish` server : INSERT dans `generations` + UPDATE streak

Regen unitaire d'un contenu = endpoint séparé `/api/generate` (JSON, pas streaming).

### Flux paiement

- Stripe Checkout Session créée par l'API (**pas** un Payment Link statique — cf. gotcha)
- Webhook Stripe persiste `trial_end`, `subscription_status`, `acquisition_source` (UTM)
- Email J-3 avant fin de trial via handler `customer.subscription.trial_will_end`

### Garde-fous prod

- **RLS Supabase strict** : aucun accès client direct, tout passe par `service_role` côté API
- **`lib/env.ts` zod lazy** : le serveur refuse de démarrer si une env var critique manque
- **Webhook Stripe** : URL canonical sans `www` (Stripe ne suit pas les redirects sur les webhooks — ça m'a coûté un après-midi)
- **Crons Vercel** : `dynamic = 'force-dynamic'` + `fetchCache = 'no-store'`, sinon le Data Cache sert du stale
- **RGPD** : rate limit mensuel via `generations`, pas de tracking cross-site, endpoint `/api/account/delete` propre

---

## Ce que j'ai appris (le meilleur bout du projet)

1. **La technique ne compensera jamais l'absence de discovery.** Un produit techniquement propre qui résout un problème inexistant, ça reste un produit qui ne se vend pas.
2. **Un wrapper IA n'a pas de moat par défaut.** Le moat, ce sont les conversations client, la distribution, et la spécialisation profonde — pas le prompt.
3. **Ship rapide c'est bien. Parler aux clients c'est mieux.** Les deux ne s'opposent pas, mais si je dois choisir : parler d'abord.
4. **Claude Code m'a permis de shipper un vrai SaaS sans être senior.** J'ai appris sur le tas — je ne prétends pas comprendre chaque ligne du repo dans le détail. Ce que je comprends, c'est le squelette : où vit la logique, ce qui parle à quoi, où ça peut casser. C'est un vrai savoir-faire à part entière : savoir orchestrer un outil comme Claude Code pour que ça produise du code qui tient debout en prod.
5. **Se planter ne coûte cher que si on refuse de l'admettre.** Le vrai coût, c'était pas les mois de dev — c'était de continuer à défendre une thèse fausse.

---

## Lancer le projet en local

```bash
npm install
cp .env.example .env.local     # remplir avec tes propres clés
npm run dev                     # :3000
npm run typecheck
npm run test:e2e                # Playwright headless
```

Pour désactiver le mode maintenance et retrouver la vraie app : virer le bloc `MAINTENANCE MODE` en tête de [`middleware.ts`](middleware.ts).

---

## Licence

Code sous MIT — pique, étudie, réutilise. Pas de garantie, pas de support (le projet est en pause).

Le nom "Kooach", la marque et le contenu du blog ne sont pas couverts par la licence.

---

*Guillaume — [@guillaumeships](https://x.com/guillaumeships)*
