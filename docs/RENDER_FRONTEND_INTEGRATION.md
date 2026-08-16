# Frontend ↔ Render backends — integration guide

Use this when pointing `hypertron-frontend` at the live Render APIs instead of `localhost:4000` / `localhost:4001`.

**Last verified:** 16 August 2026. Both services answer `GET /` with `{ status: "ok" }`.

| Service | Role | Live URL | Frontend env |
|---|---|---|---|
| **hypertron-core-backend** | Wallet login, business profile, payment links, public checkout | https://hypertron-core-backend.onrender.com | `NEXT_PUBLIC_API_URL` |
| **hypertron-api** | Developer API keys, Payments API `/v1/*`, webhooks | https://hypertron-api.onrender.com | `NEXT_PUBLIC_DEVELOPER_API_URL` |

Do **not** mix these. Dashboard auth and Collect/checkout talk to **core**. Developers page (API keys) talks to **hypertron-api**. Merchant server-to-server calls (`sk_test_` / `sk_live_`) also go to **hypertron-api**, not core.

---

## 1. What to set in the frontend

Copy into `hypertron-frontend/.env.local` (local against Render) **or** Vercel / hosting env (deployed frontend). Next.js only exposes vars prefixed with `NEXT_PUBLIC_` to the browser.

```bash
# ── Live Render APIs (no trailing slash) ───────────────────────────────────
NEXT_PUBLIC_API_URL=https://hypertron-core-backend.onrender.com
NEXT_PUBLIC_DEVELOPER_API_URL=https://hypertron-api.onrender.com

# ── Stellar testnet (checkout / Freighter) ─────────────────────────────────
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Circle USDC on Stellar testnet (required for classic USDC checkout)
NEXT_PUBLIC_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3MNLQUIL
# Optional EURC classic checkout
# NEXT_PUBLIC_EURC_ISSUER=

# Must match core-backend PAYMENT_POOL_ADDRESS on Render (privacy deposit path)
NEXT_PUBLIC_PAYMENT_POOL_ADDRESS=CBNJY2ULVHOSHCTA4ZBMCU7AEVZHK4J5D3UEWIRSUYTIAQXZNTYQAMJQ

# Prover assets are served from this Next app’s /public — leave as-is
NEXT_PUBLIC_DEPOSIT_PK_URL=/keys/deposit.pk.bin
NEXT_PUBLIC_PROVER_WASM_URL=/prover/hypertron_prover_bg.wasm
```

Then restart `next dev` / redeploy. Changing `NEXT_PUBLIC_*` requires a rebuild; a hot reload is not enough.

**Where these are read today**

| Env | Code | Used for |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `src/lib/api.ts` | All `apiFetch()` calls (`credentials: "include"`) |
| `NEXT_PUBLIC_DEVELOPER_API_URL` | `src/lib/developer-api.ts` | API key CRUD (`credentials: "include"`) |
| `NEXT_PUBLIC_STELLAR_*` / issuers / pool | `src/lib/stellar-network.ts` | Freighter checkout on `/pay/{id}` |
| Prover URLs | `src/lib/hypertron-prover.ts` | Privacy deposit WASM + proving key |

---

## 2. Required Render env (or login / payment-link URLs will be wrong)

The frontend origin must be allow-listed on **both** APIs. Payment-link URLs are built by **core**, not by Next.js.

Replace `https://YOUR-FRONTEND-ORIGIN` with the real origin (no path, no trailing slash). Examples: `http://localhost:3000`, `https://hypertron.vercel.app`.

### hypertron-core-backend (Render → Environment)

```bash
CORS_ORIGIN=http://localhost:3000,https://YOUR-FRONTEND-ORIGIN
FRONTEND_URL=https://YOUR-FRONTEND-ORIGIN
# Production already defaults to SameSite=None; Secure. Keep it that way
# while the dashboard is on a different site than this API (Vercel + Render).
COOKIE_SAMESITE=none
```

`FRONTEND_URL` is prepended as `{FRONTEND_URL}/pay/{linkId}` when a merchant creates a Collect link. If this stays `http://localhost:3000`, shared checkout URLs will be unusable.

### hypertron-api (Render → Environment)

```bash
CORS_ORIGINS=http://localhost:3000,https://YOUR-FRONTEND-ORIGIN
CHECKOUT_BASE_URL=https://YOUR-FRONTEND-ORIGIN
APP_URL=https://hypertron-api.onrender.com
```

Note the names: core uses `CORS_ORIGIN` (singular); the Payments API uses `CORS_ORIGINS` (plural). Comma-separated, no spaces preferred.

Redeploy / restart both services after changing these.

---

## 3. Cookies, CORS, and why two hosts matter

```
Merchant browser
  │  Freighter SEP-53 sign-in
  ▼
POST https://hypertron-core-backend.onrender.com/api/auth/verify
  → Set-Cookie: ht_dashboard=…; HttpOnly; Secure; SameSite=None; Path=/
  → cookie is host-only for hypertron-core-backend.onrender.com

Dashboard Collect / settings
  GET/POST  …core-backend…/api/*          ← cookie is sent  ✓

Developers → API keys
  GET/POST  …hypertron-api…/api/developer/*  ← cookie is NOT sent ✗
  (different host; browsers do not share host-only cookies)
```

**What already works against Render with the current frontend code**

- Wallet login / session restore / logout (core)
- Business profile + receive address
- Create / list payment links
- Public checkout `GET /api/payment-link/:id` (no cookie)
- Classic Freighter pay + privacy deposit (chain writes from the browser)

**What needs extra work for a deployed frontend**

- Developers page (`src/lib/developer-api.ts`) — hypertron-api expects the same `ht_dashboard` cookie, signed with the **same** `AUTH_SECRET` as core. The browser will not attach core’s cookie to `hypertron-api.onrender.com`.

Pick one of these (recommended first):

### Option A — Next.js rewrite proxy (best without custom domains)

Browser talks only to the frontend origin. Next.js reverse-proxies to Render, so `Set-Cookie` lands on the frontend host and is sent to both backends.

`hypertron-frontend/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hypertron/prover"],
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/ht-core/:path*",
        destination: "https://hypertron-core-backend.onrender.com/:path*",
      },
      {
        source: "/ht-api/:path*",
        destination: "https://hypertron-api.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
```

Then set:

```bash
NEXT_PUBLIC_API_URL=https://YOUR-FRONTEND-ORIGIN/ht-core
NEXT_PUBLIC_DEVELOPER_API_URL=https://YOUR-FRONTEND-ORIGIN/ht-api
```

For local: `NEXT_PUBLIC_API_URL=http://localhost:3000/ht-core` (same idea).

Also set core `COOKIE_SAMESITE=lax` once the cookie is first-party on the frontend origin.

### Option B — custom domains (same registrable site)

Example: `app.yourdomain.com` (frontend), `core.yourdomain.com`, `api.yourdomain.com`. Same-site cookies with `SameSite=Lax` work across those hosts. Still add each origin to `CORS_ORIGIN` / `CORS_ORIGINS`.

### Option C — local frontend → live Render (no proxy)

This is the fastest way to try Collect + checkout against production data:

```bash
NEXT_PUBLIC_API_URL=https://hypertron-core-backend.onrender.com
NEXT_PUBLIC_DEVELOPER_API_URL=https://hypertron-api.onrender.com
```

Core already allow-lists `http://localhost:3000` (confirmed on Render). Login cookies use `SameSite=None; Secure`. API-key UI against hypertron-api will still 401 until Option A or B is in place.

---

## 4. How the frontend uses each backend

All JSON dashboard calls send `Content-Type: application/json` and `credentials: "include"` except the public checkout GET.

### 4.1 Core — auth (`src/lib/auth.ts`)

Cookie name: **`ht_dashboard`**. Session lasts 7 days. Wallet must be a Stellar **G-address** (56 chars).

| Step | Method | Path | Body | Success |
|---|---|---|---|---|
| 1. Challenge | `POST` | `/api/auth/challenge` | `{ "walletAddress": "G…" }` | `{ challengeId, message, expiresAt }` (10 min TTL) |
| 2. Verify | `POST` | `/api/auth/verify` | `{ challengeId, walletAddress, signedMessage }` | `{ ok: true, walletAddress }` + **Set-Cookie** |
| 3. Restore | `GET` | `/api/auth/me` | — | `{ auth: "wallet", walletAddress }` |
| 4. Logout | `POST` | `/api/auth/logout` | — | `{ ok: true }` + clear cookie |

`GET /api/auth/me` without a cookie returns **401**. The UI treats that as logged out.

Freighter must sign `message` (SEP-53). Do not send the service-account Bearer key from the browser.

### 4.2 Core — business (`src/lib/business.ts`)

Requires `ht_dashboard`.

| Method | Path | Body | Success |
|---|---|---|---|
| `GET` | `/api/business/profile` | — | Profile JSON (see below) |
| `PATCH` | `/api/business/profile` | `{ name?, email?, businessNature? }` | Updated profile |
| `POST` | `/api/business/link` | `{ receiveAddress: "G…" }` | `{ businessId, receiveAddress }` |

Profile shape:

```json
{
  "businessId": "cm…",
  "name": "",
  "email": "",
  "businessNature": "",
  "selectedWidgets": [],
  "selectedTier": null,
  "selectedTierName": null,
  "selectedTierAt": null,
  "receiveAddress": null,
  "viewPub": null,
  "spendPub": null,
  "complianceForm": null
}
```

Onboarding is “complete” when `name` is non-empty (`isBusinessProfileComplete`).

### 4.3 Core — payment links (`src/lib/payment-links.ts`)

**Create** (session) — `POST /api/payment-link`

```json
{
  "businessId": "cm…",
  "amount": "12.50",
  "currency": "USDC",
  "purpose": "Invoice 42",
  "clientName": "Acme",
  "metadata": "{\"privateSettlement\":false}",
  "expiryDays": "7",
  "workflowStage": "collect"
}
```

Privacy ON: `metadata` must include `"privateSettlement": true` (helper: `buildLinkMetadata()`). Private checkout currently supports **XLM only**.

**201** body:

```json
{
  "linkId": "cm…",
  "url": "https://YOUR-FRONTEND-ORIGIN/pay/cm…",
  "qrPayload": "https://YOUR-FRONTEND-ORIGIN/pay/cm…",
  "memo": "hpl_…",
  "amount": "12.50",
  "currency": "USDC",
  "expiresAt": null,
  "paymentMethods": ["wallet", "qr"],
  "destinationAddress": "G… or C…",
  "mode": "direct_receive"
}
```

`mode` is `direct_receive` (classic) or `pool` (privacy). Classic destination is `Business.receiveAddress` (else the login G-address). Pool destination is `PAYMENT_POOL_ADDRESS`.

**List** (session) — `GET /api/payment-link?businessId={id}` → `{ "links": [ … ] }`. Collect table polls this every **12s** while any link is pending.

**Public checkout** (no cookie) — `GET /api/payment-link/:id`

```json
{
  "id": "cm…",
  "amount": "12.50",
  "currency": "USDC",
  "memo": "hpl_…",
  "destinationAddress": "G…",
  "purpose": null,
  "businessName": null,
  "clientName": null,
  "workflowStage": null,
  "metadata": "{\"privateSettlement\":false}",
  "paymentMethods": ["wallet", "qr"],
  "expiresAt": null,
  "paidAt": null,
  "paymentTxHash": null
}
```

| Status | Meaning |
|---|---|
| 200 | Show checkout |
| 404 | Unknown id |
| 410 | Expired (`{ "error": "…", "expired": true }`) |

After Freighter submits, `/pay/{id}` re-fetches this every **5s** until `paidAt` is set. Completion is done by **hypertron-api’s Horizon reconciler** (shared Mongo), not by the frontend.

Payer does **not** call core `POST …/claim` or `…/confirm` in the current UI. Those exist for the private-transfer claim/confirm path.

### 4.4 hypertron-api — developer keys (`src/lib/developer-api.ts`)

Requires `ht_dashboard` (same HMAC secret as core). Raw `secret_key` is returned **once** on create/rotate.

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/developer/api-keys` | — → `{ object: "list", data: [ … ] }` |
| `POST` | `/api/developer/api-keys` | `{ "name": "Dashboard", "environment": "test" \| "live" }` |
| `POST` | `/api/developer/api-keys/:id/rotate` | — |
| `POST` | `/api/developer/api-keys/:id/revoke` | — |

The dashboard does **not** yet call webhook or customer developer routes. They are live on Render if you wire them later:

- `/api/developer/webhook-endpoints`
- `/api/developer/customers`

### 4.5 hypertron-api — merchant Payments API (not called by the Next app today)

For merchant backends / Postman, not the dashboard:

```
https://hypertron-api.onrender.com/v1/payments
https://hypertron-api.onrender.com/v1/customers
https://hypertron-api.onrender.com/v1/checkout-links/:id
```

Auth: `Authorization: Bearer sk_test_…` plus `Idempotency-Key` on `POST /v1/payments`.

Postman: `hypertron-api/postman/Hypertron_Render.postman_collection.json` + `Hypertron_Render.postman_environment.json`.

---

## 5. Request rules (copy into any new client)

1. Base URL has **no trailing slash**. Paths start with `/`.
2. Dashboard fetches: `credentials: "include"` so the session cookie is sent.
3. Public checkout GET: `credentials: "omit"` is fine (`getPublicPaymentLink`).
4. Never put `SERVICE_ACCOUNT_API_KEY` / `INTERNAL_SERVICE_TOKEN` in the frontend. Those are server-to-server only.
5. Never send `sk_*` from the merchant dashboard. Keys are created in the UI, then used by the **merchant’s** backend.
6. Classic USDC/EURC payments need the matching `NEXT_PUBLIC_*_ISSUER`. XLM does not.
7. Privacy notes stay in **browser `localStorage`** (`ht_note_{linkId}`). They must not be posted to Nest.

---

## 6. Smoke tests (frontend origin)

Replace origins as needed. First request after idle may take 30–60s (Render free-tier cold start). Retry once.

```bash
CORE=https://hypertron-core-backend.onrender.com
API=https://hypertron-api.onrender.com
FRONT=http://localhost:3000   # or your deployed frontend origin

# Liveness
curl -sS "$CORE/"
# {"service":"hypertron-core-backend","status":"ok"}

curl -sS "$API/"
# {"service":"hypertron-api","status":"ok"}

curl -sS "$CORE/health"
# database: ok

# CORS preflight from the frontend origin (expect 204 + ACAO)
curl -sS -D - -o /dev/null -X OPTIONS "$CORE/api/auth/me" \
  -H "Origin: $FRONT" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type"

curl -sS -D - -o /dev/null -X OPTIONS "$API/api/developer/api-keys" \
  -H "Origin: $FRONT" \
  -H "Access-Control-Request-Method: GET"

# Session required
curl -sS -o /dev/null -w "%{http_code}\n" "$CORE/api/auth/me"
# 401

# Public checkout — use a real link id from Collect after login
# curl -sS "$CORE/api/payment-link/LINK_ID"
```

**Browser checklist**

1. Freighter on **testnet**.
2. Open the frontend → Connect wallet → challenge + verify → cookie set → `/dashboard` loads profile.
3. Settings: save a G-address receive address (classic checkout).
4. Collect: create a USDC (or XLM) link → URL host is `FRONTEND_URL`, not localhost.
5. Open `/pay/{id}` in a private window → Freighter pays → status flips to paid within ~5–15s (reconciler).
6. Developers: create `sk_test_` only after Option A/B cookie sharing is in place.

---

## 7. Auth planes (do not mix)

| Who | Credential | Where |
|---|---|---|
| Merchant staff (dashboard) | HttpOnly cookie `ht_dashboard` | core `/api/*` and hypertron-api `/api/developer/*` |
| Merchant application | `Authorization: Bearer sk_test_…` / `sk_live_…` | hypertron-api `/v1/*` only |
| Payer on `/pay/{id}` | none (Freighter signs the Stellar tx) | public `GET` on core, then Horizon / Soroban |

---

## 8. Known deploy gotchas

| Issue | What you will see | Fix |
|---|---|---|
| Render cold start | First `fetch` hangs ~30–60s, then works | Retry; consider a paid instance or a warmup ping |
| `FRONTEND_URL` still localhost on core | Created links are `http://localhost:3000/pay/…` | Set `FRONTEND_URL` to the real frontend origin and restart core |
| Frontend origin not in CORS | Browser: blocked by CORS; no `Access-Control-Allow-Origin` | Add origin to core `CORS_ORIGIN` **and** api `CORS_ORIGINS` |
| API keys 401 from dashboard | `GET /api/developer/api-keys` 401 after a successful core login | Cookie is on the core host only — use the rewrite proxy or custom domains |
| Third-party cookie blocked | Login “succeeds” but `/api/auth/me` is 401 on the next load | Same as above; Chrome is dropping cross-site cookies |
| USDC checkout error | “Missing issuer for USDC” | Set `NEXT_PUBLIC_USDC_ISSUER` to the Circle testnet issuer above |
| Privacy checkout | “Private settlement currently supports XLM only” | Use XLM + matching `NEXT_PUBLIC_PAYMENT_POOL_ADDRESS` |
| `GET /health` on hypertron-api | Occasional DB ping timeout on cold Atlas | Use `GET /` for liveness; health is informational |

Live API test reports (contracts, not frontend):

- `hypertron-core-backend/RENDER_API_TEST_REPORT.md`
- `hypertron-api/RENDER_API_TEST_REPORT.md`

---

## 9. Local vs Render cheat sheet

| Mode | `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_DEVELOPER_API_URL` |
|---|---|---|
| All local | `http://localhost:4000` | `http://localhost:4001` |
| Local UI → live Render | `https://hypertron-core-backend.onrender.com` | `https://hypertron-api.onrender.com` |
| Deployed UI, direct | same Render URLs | same (API keys broken until cookie sharing) |
| Deployed UI, rewrite proxy | `https://YOUR-FRONTEND-ORIGIN/ht-core` | `https://YOUR-FRONTEND-ORIGIN/ht-api` |

Architecture background: `HYPERTRON_TECHNICAL_ARCHITECTURE.md` (repo root). Checkout asset setup: `docs/pay-checkout-setup.md`.
