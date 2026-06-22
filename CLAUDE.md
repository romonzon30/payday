# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PayDay is a tax-compliance SaaS for Argentine *monotributistas* (small taxpayers). Users sign in with Google, complete a profile (DNI/CUIT/category), and the app generates and tracks AFIP tax due dates ("vencimientos") on a calendar, with email + in-app reminders. UI text and most identifiers are in Spanish.

It is a two-part app in one repo:
- **Frontend** (`/src`): React 18 + TypeScript + Vite, CSS Modules. SPA, no router.
- **Backend** (`/server`): Express 5 + Mongoose (MongoDB), CommonJS. Lives in its own npm package with its own `node_modules`.

## Commands

Frontend (run from repo root):
```bash
npm install
npm run dev          # Vite dev server; proxies /api -> http://localhost:3001 (see note below)
npm run build        # tsc type-check + vite build
npm run preview
npm test             # vitest run
npm run test:watch
npm run test:coverage
npx vitest run path/to/file.test.tsx        # single test file
npx vitest run -t "name of test"            # single test by name
```

Backend (run from `/server`):
```bash
cd server && npm install
npm run dev          # nodemon index.js
npm start            # node index.js
npm test             # jest --forceExit --detectOpenHandles
npx jest businessDays                        # single backend test file (substring match)
```

Lint (frontend, flat config in `eslint.config.js`): `npx eslint .`

> Node is managed via nvm; the project's default is Node 24 (`.nvm/versions/node/v24.16.0`). If `node`/`npm` aren't on PATH, prefix with that bin dir.

## Important caveats

- **Port mismatch to watch for.** The backend listens on `PORT` (default `5000`), and the frontend defaults `VITE_API_URL` to `http://localhost:5000`. But Vite's dev proxy for `/api` points at `http://localhost:3001`. The frontend calls the API via the full `API_URL` (centralized in `src/config/env.ts`), not the proxy, so set `VITE_API_URL` to match the running backend.
- **Mongoose models vs `dbSchema.json`.** `dbSchema.json` at the repo root documents the intended schema, but the models in `server/models/` have drifted (e.g. `Vencimiento` adds `tipo`, `titulo`, `notif*Enviada`, `notificarEmail`, and `al_dia` estado). **Trust the model files** for what the code actually reads/writes. The `impuestos`/`sesiones`/`DueDate` collections from the old schema are unused by the live code.
- **Email sandbox.** The Resend sandbox sender `onboarding@resend.dev` only delivers to the Resend account owner's address. To email arbitrary recipients you must verify a domain (resend.com/domains) and set `SMTP_FROM` to it. See the email section below.

## Architecture

The codebase is layered. The rule of thumb: **routes wire, controllers adapt HTTP, services hold business logic + DB access, `domain/` is pure (no Express, no Mongoose), `data/` is static config, `config/` is environment/wiring.**

### Backend layering (`/server`)

```
config/      env.js (single env access + validateEnv + isEmailConfigured), db.js (connect + AFIP seed)
data/        afipCategorias.js, taxCalendar2026.js (IMPUESTOS table), holidays2026.js
domain/      businessDays.js, monotributo.js, taxCalendar.js, vencimientoEstado.js   ← PURE, unit-tested
services/    authService, userService, vencimientoService, monotributoService,
             impuestoService, emailService, notificationScheduler                     ← logic + DB
controllers/ authController, userController, impuestoController                        ← req/res only
routes/      auth.js, user.js, impuestos.js                                            ← path -> controller
middleware/  auth.js (JWT -> req.user), errorHandler.js (+ HttpError), asyncHandler.js
app.js       createApp() — builds the Express app (no listen); used by index.js and tests
index.js     boot: validateEnv -> connectDB -> seed -> listen -> (verify SMTP + scheduler)
```

- **Boot** (`index.js` + `config/`): connects to `MONGO_URI` (Atlas) or falls back to in-memory `mongodb-memory-server`; seeds the 11 AFIP categories (A–K, from `data/afipCategorias.js`) into `configuracion_afip`; starts the cron scheduler only if email is fully configured (`isEmailConfigured()` = host + user + pass).
- **Errors**: services throw `HttpError(status, message)` for expected client errors; `asyncHandler` forwards rejections; `errorHandler` maps `HttpError` → status, Mongo `11000` → 409, everything else → 500. All error responses are `{ message }`.
- **Auth** (`middleware/auth.js`): verifies the JWT (payload `{ id }`), loads the `User`, sets `req.user` (the full document). **Standard: use `req.user` / `req.user._id`** everywhere.
- **Tax calendar engine**: the `IMPUESTOS` table (`data/taxCalendar2026.js`) encodes 2026 AFIP rules — each tax maps CUIT-last-digit groups to a `baseDia`. `domain/taxCalendar.js` turns a CUIT + month into a due date; `impuestoService` does `/preview` and `/agregar`. **When editing tax rules, edit `data/taxCalendar2026.js`.**
- **Business days** (`domain/businessDays.js`): the actual due date is the next business day on/after `baseDia`, **skipping weekends AND the national holidays in `data/holidays2026.js`**. All date math is UTC at 12:00 to avoid TZ drift.
- **Monotributo engine** (`domain/monotributo.js` + `services/monotributoService.js`): `calcMontoFinal` applies the inicio-actividad discount (50%/75%) and per-dependent obra-social surcharge; `upsertMonotributoVencimientos` reconciles the 12 monthly docs (paid months untouched, drifted pending docs recreated).
- **Notifications** (`services/notificationScheduler.js`): hourly node-cron job emailing users 48h/24h before and on the day of a pending vencimiento, guarded by `notif48hEnviada`/`notif24hEnviada`/`notifVencidoEnviada` so reminders don't repeat. Emails go through `services/emailService.js` (nodemailer).

### Frontend (`/src`)

```
config/env.ts        single API_URL + GOOGLE_CLIENT_ID
lib/apiClient.ts     api.get/post/put/patch/del — base URL + auth header + 401 logout + typed ApiError
types/index.ts       shared User, Vencimiento, ImpuestoPreview, View
hooks/               useAuth (session), useVencimientos (calendar data), useTheme (single-source)
utils/fecha.ts       MONTH_NAMES, calendar grid, formatMonto, status label
components/ui/        FormField (reusable labelled input)
components/          AppSidebar, AppFooter, NuevoVencimientoModal, LoginCard
pages/               LoginPage, DashboardPage, UserProfilePage, ProfileCompletedPage, CalendarPage, ImpuestosPage
App.tsx              routing only (view state + page render branches)
```

- **No router.** `App.tsx` holds a `view` union and renders one page. To add a screen: add a `View` value (in `types/index.ts`) and a render branch in `App.tsx`, threading nav callbacks through props. (Deliberate non-goal — see determinations.)
- **All HTTP goes through `lib/apiClient.ts`.** Never hand-write `fetch` + `Authorization` headers in a component; call `api.*`. It injects the token, prefixes `API_URL`, throws `ApiError`, and triggers logout on 401.
- **Auth/session** lives in `hooks/useAuth.ts` (bootstrap from token, login, logout). **Theme** is a single shared store in `hooks/useTheme.ts` (`useSyncExternalStore`) — all call sites stay in sync.

### Data model
MongoDB, database `monotributo_saas`. Collections in active use: `users`, `vencimientos`, `notificaciones`, `configuracion_afip` (seeded AFIP table). Field names and enums are Spanish. See the caveat above about model drift.

## Tests

Tooling: **vitest** (frontend) + **jest** with **`mongodb-memory-server`** (backend). Both run with zero external services.

- Backend (`server/__tests__/`): pure-function unit tests (`monotributo`, `businessDays`, `taxCalendar`, `vencimientoEstado`) + supertest integration tests (`upsert`, `userVencimientos`, `impuestos`) that mount the real app via `createApp()`. Shared harness in `__tests__/setup.js` (jest ignores it as a test).
- Frontend (`src/**/*.test.ts`): `utils/fecha` and `lib/apiClient`. `src/test/setup.ts` loads jest-dom (referenced by `vite.config.ts`).
- Write tests against current behavior **before** refactoring; keep them green at each step.

## Architecture determinations

Decisions made deliberately — don't "fix" these without reason:

- **No react-router.** 6 views, no URLs/deep-linking needed. The manual `view` switch in `App.tsx` is intentional. Adding routing is a known, deferred non-goal.
- **Design system = `index.css` CSS custom properties** (consumed via `var(--…)`). There is no TS token object; don't reintroduce one (the old `constants/designSystem.ts` was a divergent dead copy and was removed).
- **Auth via `useAuth` hook, not Context** — fewer moving parts; the apiClient↔logout coupling is handled by `setOnUnauthorized`.
- **`req.user._id` is the standard** for user identity in handlers (not `req.user.id`).
- **Email scheduler gates on full credentials** (`isEmailConfigured`), not just `SMTP_HOST`, so a half-configured SMTP doesn't silently fail hourly.
- **Business-day math is holiday-aware** (`data/holidays2026.js`). Update that list for a new year alongside `data/taxCalendar2026.js`.

## Deployment

- **Frontend**: **Vercel** (Vite build). Set `VITE_API_URL` to the Render backend URL.
- **Backend**: **Render** (`npm start` → `node index.js`). Needs `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `SMTP_*`, and `CORS_ORIGIN` including the Vercel origin.
- **Database**: **MongoDB Atlas** (`monotributo_saas`) via `MONGO_URI`. Without it the backend silently uses in-memory Mongo — confirm `MONGO_URI` is set in prod or data won't persist.
- **Email**: SMTP via nodemailer, configured purely through `SMTP_*` env vars (provider swap is env-only). A health check (`verifyTransporter`) runs at boot and in `scripts/send-test-email.js`. **Resend sandbox** (`onboarding@resend.dev`) only delivers to the account owner; for real recipients verify a domain (SPF/DKIM/DMARC) and set `SMTP_FROM` to it. Send a manual test with:
  ```bash
  node server/scripts/send-test-email.js destino@mail.com [48h|24h|hoy]
  ```

## Environment

Frontend (`.env` at root): `VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL`. `vite.config.ts` also accepts unprefixed `GOOGLE_CLIENT_ID` / `API_URL` for CI/prod builds.

Backend (`server/.env`, see `server/.env.example`): `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CORS_ORIGIN` (comma-separated allowlist; empty = allow all), `PORT`, and `SMTP_*` for email. All read through `config/env.js` (`validateEnv()` warns on missing `JWT_SECRET`/`GOOGLE_CLIENT_ID`). Without `MONGO_URI` the app runs on in-memory Mongo; without full SMTP credentials the reminder scheduler is disabled — both make local dev work with zero external services.
