# Startup Roast Arena — Progress

Legend: ✅ done · 🟡 in progress · ⬜ not started · ⛔ blocked (needs input)

Last updated: 2026-11-12 — ALL phases completed and verified (except owner
browser walkthrough and deployment, which need owner input)

> **IMPORTANT:** This file reflects the **actual, verified state of THIS
> workspace only.** Nothing is marked ✅ unless it was actually run and
> checked in this workspace.

---

## Phase 1 — Complete project inspection ✅

- ✅ Read every backend file (index, config, models, routes, controllers, middleware, services, utils)
- ✅ Read every frontend file (main, App, context, services, all 9 components, all 9 pages, both CSS files, configs)
- ✅ Confirmed full implementation exists and matches `PROJECT_GUIDE.md`
- ✅ Confirmed no broken imports (Vite build would fail on unresolved imports)
- ✅ Confirmed frontend ↔ backend wiring (Axios instance, `VITE_API_URL`, JWT interceptor)
- ✅ Security check: found leaked brother's cluster info in `backend/.env.example` → **fixed** (Phase 3)
- ⚠️ Dev-only audit warnings (minimatch inside nodemon/eslint) — intentionally NOT downgraded

## Phase 2 — Dependencies & setup ✅

- ✅ `npm ci` in `backend/` (128 packages) and `frontend/` (173 packages)
- ✅ Compared package.json vs actual imports — no missing, no unnecessary packages
- ✅ No downgrades applied (forbidden without reason)
- ✅ `npm run build` PASS · `npm run lint` PASS (baseline, before any changes)
- ✅ `.gitignore` in both folders ignores `.env` (verified)
- ✅ All existing environment variables preserved (backend/.env untouched)

## Phase 3 — Fixes ✅

- ✅ Fixed broken `backend/.env.example` line (duplicated `MONGO_URI=` + leaked brother's cluster/DB name → placeholder)
- ✅ Restored `frontend/.env` with `VITE_API_URL=http://localhost:5000/api`
- ✅ Backend boots: `/api/health` → `{"status":"ok","database":"connected"}`

## Phase 4 — Complete UI redesign ✅

- ✅ New design identity: **"Pitch Ledger"** — light editorial theme (warm paper `#f4f1ea`, ink text, Georgia serif headings, emerald `#0d6e57` accent, ember `#b4441c` roast accents, 4px corners) — structurally different from the original dark-purple rounded theme
- ✅ Rewrote `index.css` + `App.css` (full new design system)
- ✅ Redesigned all pages: Landing (2-col hero + numbered roster + steps + pitch rows), Register/Login (split-screen), Dashboard (stat strip), Submit (numbered step form), My Ideas (row list), IdeaDetails (2-col + sticky sidebar), Leaderboard (podium + ruled table), NotFound
- ✅ Redesigned all components: Navbar (masthead strip + responsive menu), Footer (3-col), IdeaCard (horizontal row), InvestorReviewCard (big-score verdict row)
- ✅ All functionality and API integrations preserved (same handlers, same endpoints)
- ✅ Responsive breakpoints at 980/900/860/820/760/640 px
- ✅ `npm run build` PASS · `npm run lint` PASS

## Phase 5 — Renames ✅ (4 safe renames)

- ✅ `backend/config/db.js` → `backend/config/database.js` (import in index.js updated)
- ✅ `frontend/src/services/api.js` → `frontend/src/services/apiClient.js` (10 imports updated)
- ✅ `frontend/src/pages/SubmitIdea.jsx` → `SubmitPitch.jsx` (component + App.jsx updated)
- ✅ `frontend/src/pages/MyIdeas.jsx` → `MyPitches.jsx` (component + App.jsx updated)
- ✅ Grep verified ZERO stale references · build PASS · lint PASS
- ✅ URL routes `/submit` and `/my-ideas` **unchanged** (no bookmarks break)
- ✅ Not renamed: package.json, .env, config/tool files

## Phase 6 — MongoDB (Smit-Project) ✅

- ✅ Verified DB name in configured MONGO_URI = **`Smit-Project`** before connecting (URI never printed)
- ✅ Created `backend/scripts/setupDatabase.js` — refuses to run if DB name ≠ Smit-Project; creates collections explicitly; inserts NO data; drops NOTHING
- ✅ Collections verified in `Smit-Project`: **`users`, `ideas`, `reviews`, `votes`**
- ✅ Indexes ensured: `users.email` (unique), `votes.idea_1_user_1` (unique → one-vote rule at DB level)
- ✅ Test data exists only from the smoke test (2 test users, 1 idea/2 versions, 6 reviews, 1 vote) — labelled test accounts, kept for the owner's browser walkthrough

## Phase 7 — Gemini API ✅

- ✅ `GEMINI_API_KEY` loaded from local backend/.env (value never printed)
- ✅ No `GEMINI_MODEL` override → default `gemini-3.5-flash` used (supported, verified)
- ✅ Real AI call tested end-to-end: 3 investors returned, Zod-validated JSON, scores 1–10, funding ≤ 5,000,000, equity 1–30%, every review has an improvement tip
- ✅ Error paths verified: missing key → 503, AI failure handled with clear message (no fake success)

## Phase 8 — Testing ✅

### Backend
- ✅ Startup + MongoDB connection (`/api/health` → database connected)
- ✅ `backend/scripts/smokeTest.js` → **44/44 PASS, exit 0** covering: register/login/me, 400/401/409 validation, ideas CRUD, malformed ids, real Gemini evaluation (3 investors + limits), voting (403 self-vote, 409 duplicate, guest vs logged-in vote state), re-pitch (v1 preserved, v2 created, 6 reviews total), leaderboard 70/30 formula + rank, 404 handler

### Frontend
- ✅ `npm run dev` starts clean (Vite ready, no compile errors in log)
- ✅ Routes serve 200 with `id="root"`: `/`, `/login`, `/leaderboard`, `/ideas/:id`
- ✅ `npm run build` PASS · `npm run lint` PASS (re-run after every phase)

### ⛔ Needs owner (no browser automation available — NOT claimed as tested)
- ⛔ Visual browser walkthrough of all pages
- ⛔ Responsive check on real devices (breakpoints written, but not visually confirmed)
- ⛔ Browser console error check

## Phase 9 — Final report ✅

- ✅ Delivered (structure, bugs fixed, deps, renames, UI summary, features, test results, MongoDB status + collection names, Gemini status, remaining issues, run commands, deployment readiness)

---

## Phase 10 — Deployment preparation (GitHub + Vercel) ✅

### Gitignore & GitHub security
- ✅ Created root `.gitignore` (node_modules, dist/build, coverage, logs, caches, `.vercel/`, IDE + Windows/macOS files)
- ✅ Extended `backend/.gitignore` and `frontend/.gitignore` (`.env.*` + `!.env.example`, `.vercel/`, coverage, `.eslintcache`, OS files)
- ✅ Verified with git: `backend/.env`, `frontend/.env`, `node_modules/`, `frontend/dist/` are ignored; `.env.example` files and all source/package files are tracked
- ✅ Secret scan: no MongoDB URI, no API key, no token and no JWT secret in any tracked file (only `process.env.X` reads and placeholders)

### Backend Vercel compatibility
- ✅ `backend/index.js` now exports the Express app (`export default app`) → fixes Vercel's *"No exports found in module .../index.js"*
- ✅ `app.listen()` runs locally only (`process.env.VERCEL` guard) → no conflict with serverless execution
- ✅ `config/database.js`: connection cached on `globalThis` (reused per warm instance) and **no `process.exit()` on Vercel** (rethrown → clean 503 instead of crashing the function)
- ✅ Added `ensureDatabase` middleware so `/api` routes await the cached connection on Vercel (there is no `startServer()` there)
- ✅ Production CORS via optional `CORS_ORIGIN` allowlist (unset = allow all, unchanged dev behaviour)
- ✅ **No `backend/vercel.json` and no `api/` folder** — Vercel's official zero-config Express detection covers `index.js` at the project root

### Frontend deployment
- ✅ `frontend/vercel.json` with the SPA rewrite `/(.*) → /index.html` (required by Vercel for React Router deep links)
- ✅ `apiClient.js`: production builds use `VITE_API_URL` only; the localhost fallback is dev-only (verified: a prod bundle contains no `localhost:5000`)

### Tests run
- ✅ `node --check` on all 25 backend `.js` files
- ✅ `scripts/serverlessTest.js` → **14/14 PASS** (export present, no self-listener, DB middleware, JSON body parsing, auth, 404, CORS strict + allow-all)
- ✅ `scripts/smokeTest.js` → **45/45 PASS** (real Gemini calls) against the refactored backend
- ✅ `npm run build` PASS · `npm run lint` PASS (frontend)
- ✅ Local `npm start` → `/api/health` = `{"status":"ok","database":"connected"}`
- ✅ Test suite made resilient to transient Gemini 503s (retry) and independent of pre-existing rows (leaderboard expectations derived from the live board)

---

## Blocked — waiting for owner input

- ⛔ Browser walkthrough / responsive / console check (needs a human with a browser)
- ⛔ GitHub push (repo initialized locally with **no commits** — owner pushes via GitHub Desktop)
- ⛔ Vercel project creation + environment variables (owner)
- ⛔ MongoDB Atlas Network Access must allow Vercel's dynamic IPs (`0.0.0.0/0`) — **required or the deployed backend cannot reach the database**
- ⛔ Optional: cleanup of smoke-test data (can be done on request — never done automatically)
