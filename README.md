# ProCV — AI Résumé & ATS Optimization

Production-ready, AI-native résumé builder with **live ATS scoring**,
**job-description matching**, and **inline AI polish** on every long-form
field. Authentication and persistence are handled by **Firebase**; AI calls
go through **OpenAI** (server-side only).

---

## ✦ Stack

| Concern         | Choice                                        |
| --------------- | --------------------------------------------- |
| Framework       | Next.js 14 (App Router) + TypeScript strict   |
| Styling         | Tailwind CSS + custom design tokens           |
| Primitives      | Radix UI (accordion, dropdown, tooltip, …)    |
| Animations      | Framer Motion                                 |
| Charts          | Recharts (radial gauge is custom SVG)         |
| State           | Zustand                                       |
| Drag & drop     | dnd-kit                                       |
| Toasts          | Sonner                                        |
| Icons           | Lucide React                                  |
| **Auth + DB**   | **Firebase Auth + Firestore**                 |
| **AI**          | **OpenAI (`gpt-4o-mini` by default)**         |
| **i18n**        | Custom hook + 5 dictionaries (TR / EN / ES / DE / FR) |

---

## ✦ Deploy on Vercel

Step-by-step guide (Turkish): **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)**

Quick checklist: import repo → add all env vars from `.env.example` → Firebase authorized domains → Redeploy.

## ✦ Getting started

### 1. Install

```bash
npm install
```

### 2. Configure secrets

Copy `.env.example` to `.env.local` and fill the values.

```bash
cp .env.example .env.local
```

Required values:

| Variable                                | Notes                                     |
| --------------------------------------- | ----------------------------------------- |
| `OPENAI_API_KEY`                        | Server-side only. Never exposed.          |
| `OPENAI_MODEL`                          | Defaults to `gpt-4o-mini`.                |
| `NEXT_PUBLIC_FIREBASE_*` (6 vars)       | Firebase Web SDK config. Safe to ship.    |
| `FIREBASE_ADMIN_PROJECT_ID`             | From your service-account JSON.           |
| `FIREBASE_ADMIN_CLIENT_EMAIL`           | From your service-account JSON.           |
| `FIREBASE_ADMIN_PRIVATE_KEY`            | Paste the JSON `private_key` (with `\n`). |

### 3. Set up Firebase

1. <https://console.firebase.google.com/> → **Create project**.
2. **Authentication → Sign-in method** → enable **Email/Password** (and
   optionally **Google**).
3. **Firestore Database → Create database** → start in production mode.
4. Paste these rules in **Firestore → Rules**:

   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
         match /resumes/{resumeId} {
           allow read, write: if request.auth != null && request.auth.uid == uid;
         }
       }
     }
   }
   ```

5. **Project settings → Your apps → Web** → register an app and copy the
   `firebaseConfig` values into the `NEXT_PUBLIC_FIREBASE_*` env vars.
6. **Project settings → Service accounts → Generate new private key** →
   open the JSON and copy `project_id`, `client_email`, `private_key`
   into the `FIREBASE_ADMIN_*` env vars (keep the literal `\n` in the
   private key).

### 4. Run

```bash
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build && npm run start
node scripts/verify-firebase.mjs
node scripts/verify-pdf-font.mjs
```

If Firebase isn't configured, the app boots into a "configuration
required" screen that links to the Firebase console — no crashes.

---

## ✦ App map

```
/                 → marketing landing (signed in → /dashboard)
/sign-in          → email + Google sign-in
/sign-up          → email + Google account creation
/dashboard        → KPI tiles + list of the user's résumés
/profile          → account details
/settings         → locale preferences
/editor           → routes to the latest résumé, or creates one
/editor/[id]      → three-column workspace (editor · live preview · ATS rail)
/job-matching     → standalone JD matching workspace
/analytics        → charts (uses persisted ATS scores when available)

/api/ai/polish    → POST  rewrite text via OpenAI
/api/ai/analyze   → POST  score résumé + suggestions via OpenAI
/api/ai/match     → POST  keyword match résumé vs JD via OpenAI
/api/resume/pdf   → POST  export résumé as PDF (Noto Sans, template-aware)
```

All `/api/ai/*` endpoints verify a Firebase ID token from the
`Authorization: Bearer <token>` header. Unauthenticated calls return
`401`.

---

## ✦ Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── _lib/guard.ts             auth guard for route handlers
│   │   └── ai/
│   │       ├── polish/route.ts
│   │       ├── analyze/route.ts
│   │       └── match/route.ts
│   ├── (pages)
│   │   ├── sign-in/page.tsx          /sign-up/page.tsx
│   │   ├── dashboard/page.tsx        /editor/[id]/page.tsx
│   │   ├── job-matching/page.tsx     /analytics/page.tsx
│   │   └── page.tsx                  root redirect
│   ├── layout.tsx                    global providers + metadata
│   └── globals.css                   design tokens
│
├── components/
│   ├── ats/                          gauge, ats-panel, job-match-panel
│   ├── auth/                         auth-shell, sign-in/up form, guard,
│   │                                 config-missing screen
│   ├── brand/                        logo
│   ├── dashboard/                    stats-grid, resume-list
│   ├── editor/                       multi-step forms, dnd, AI polish,
│   │                                 autosave hook
│   ├── layout/                       app-shell, top-nav, locale-switcher
│   ├── preview/                      live A4 preview
│   ├── providers/                    i18n + auth + tooltip + toaster
│   └── ui/                           buttons, cards, inputs, accordion, …
│
├── lib/
│   ├── cn.ts                         clsx + tailwind-merge
│   ├── id.ts                         client-safe uid
│   ├── types.ts                      domain contracts (pure)
│   ├── scoring.ts                    client-side AI façade (fetch /api/ai/*)
│   ├── firebase/
│   │   ├── client.ts                 Web SDK singleton
│   │   ├── admin.ts                  Admin SDK singleton (server-only)
│   │   ├── auth.ts                   sign-in/up + profile helpers
│   │   └── resumes.ts                Firestore CRUD for résumés
│   ├── openai/
│   │   ├── client.ts                 OpenAI singleton (server-only)
│   │   └── prompts.ts                strict-JSON prompt templates
│   └── i18n/
│       ├── index.ts                  locale registry + helpers
│       ├── types.ts                  Dictionary (widened from English)
│       └── dictionaries/             en, tr, es, de, fr
│
└── store/
    └── resume-store.ts               Zustand store + typed actions
```

### Data flow

```
        ┌───────────────────────────┐
        │  React component          │
        │  (e.g. AIPolishButton)    │
        └────┬──────────────────────┘
             │  polishText(value, locale)
             ▼
        ┌───────────────────────────┐
        │  lib/scoring.ts           │  attaches Firebase ID token
        └────┬──────────────────────┘
             │  POST /api/ai/polish
             ▼
        ┌───────────────────────────┐
        │  app/api/ai/polish/route  │  verifies token via firebase-admin
        └────┬──────────────────────┘
             │  OpenAI chat completion
             ▼
        ┌───────────────────────────┐
        │  OpenAI                   │
        └───────────────────────────┘
```

The browser never sees the OpenAI key. Firestore writes go directly from
the client SDK but are gated by Security Rules tied to the user's UID.

---

## ✦ i18n

5 locales ship by default: **Turkish, English, Spanish, German, French**.
Add a new locale in 3 steps:

1. Create `src/lib/i18n/dictionaries/<locale>.ts` (copy the English file).
2. Register it in `src/lib/i18n/index.ts` (`LOCALES`, `LOCALE_LABELS`,
   `LOCALE_FLAGS`, `DICTIONARIES`).
3. Done — the language picker in the top-nav and auth screens picks it up
   automatically.

The active locale persists in `localStorage["procv:locale"]` and, for
signed-in users, mirrors to `users/{uid}.locale` in Firestore so it
follows them across devices.

---

## ✦ Production checklist

- [ ] Rotate the seeded OpenAI key (the one in `.env.local` was shared in
      chat — always treat that as compromised).
- [ ] Restrict the OpenAI key by project + monthly spend limit.
- [ ] Lock Firebase Security Rules to the exact ruleset in this README.
- [ ] Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for distributed
      rate limits (falls back to in-memory per instance otherwise).
- [ ] Deploy with the env vars set in your hosting provider's secret
      manager — never bundle `.env.local`.
- [ ] Enable Firebase App Check to throttle abusive client SDK traffic.
