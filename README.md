# ElevateFit

A multi-page fitness & lifestyle web app built with Next.js 16, React 19, and the App Router — workouts, recipes, daily routines, progress tracking, notifications, and profiles.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + Framer Motion |
| Auth | Firebase Auth + httpOnly JWT session cookie |
| Database | MongoDB via Mongoose |
| Validation | Zod |
| Email / Push | Resend + web-push |
| Charts / 3D | Recharts + React Three Fiber (lazy-loaded) |

## Getting started

```bash
npm install
cp .env.example .env.local
# fill secrets, then optionally:
npm run setup:env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Firebase project with Auth (+ Storage for avatars)
- Optional: Resend, VAPID keys, Upstash Redis, Sentry DSN

Deploy Firebase Storage rules from [`storage.rules`](storage.rules).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build & serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run setup:env` | Generate VAPID keys into `.env.local` |

## Environment

See [`.env.example`](.env.example). Important names used by code:

- `FIREBASE_SERVICE_ACCOUNT` — minified service-account JSON (not split admin vars)
- `VAPID_SUBJECT` — e.g. `mailto:you@example.com` (not `VAPID_EMAIL`)
- `CRON_SECRET` — bearer token for `/api/cron/reminders` (Vercel Cron once daily at 03:00 UTC via [`vercel.json`](vercel.json); Hobby-compatible — use Pro or an external caller for denser schedules)
- Optional: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` for distributed rate limits
- Optional: `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (install `@sentry/nextjs` to activate)

## Auth model

1. Email/password login goes through `POST /api/auth/login` (username resolved server-side — emails are never returned to the client).
2. Google (and registration) still exchange a Firebase ID token via `POST /api/auth/session`.
3. Session is a short-lived HS256 JWT in `ef_session` (httpOnly), bound to `User.sessionVersion` for logout/revocation.
4. `proxy.ts` gates pages and requires a session for protected API routes (allowlist for auth/health/cron/catalog).

## Key API routes

| Endpoint | Notes |
|---|---|
| `POST /api/auth/login` | Username/email + password → session |
| `POST /api/auth/session` | Firebase ID token → session |
| `POST /api/auth/resolve` | Password-reset helper (no email leakage) |
| `GET /api/dashboard` | Aggregated home payload |
| `GET/PUT /api/routine/checklist` | Checklist; PUT also derives `DailyProgress` |
| `GET /api/cron/reminders` | Bearer `CRON_SECRET` |
| `GET /api/health` | Mongo + env health |
| `GET /api/catalog/:type` | `recipes` \| `workouts` \| `routines` |

## PWA note

The app ships a manifest and icons for installability. The service worker ([`public/sw.js`](public/sw.js)) handles **push notifications only** — there is no offline precache shell.

## Docker

```bash
docker compose up --build
```

Requires a populated `.env.local`. Image uses Next `output: "standalone"`.

## License

[MIT](LICENSE)
