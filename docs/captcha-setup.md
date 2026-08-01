# Cloudflare Turnstile — Domain Configuration

Cloudflare Turnstile site keys are scoped to specific hostnames in the Turnstile
dashboard. Without the right hostname listed, the widget either won't load on the
production domain or will accept tokens from any domain.

## Required one-time setup in Cloudflare dashboard

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile**.
2. Find the site whose **Site Key** matches `VITE_TURNSTILE_SITE_KEY`.
3. Click **Edit** (⋯ menu → Edit site).
4. Under **Allowed Hostnames**, add:
   - `tamilkovil.com` ← production domain (required)
   - `*.replit.dev` ← dev/preview domain (optional but convenient)
5. Save changes.

Tokens issued on a hostname that is not listed will fail server-side verification
even if the widget renders.

## How replay protection works

Beyond domain-scoping, the server passes the visitor's IP address to the
Cloudflare `siteverify` endpoint via the `remoteip` field (see
`server/routes.ts → verifyCaptcha`). Cloudflare uses this as an additional
signal: a token captured on `tamilkovil.com` and replayed from a different IP
or host will be rejected.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Frontend (Vite build-time) | Public site key used by the widget |
| `TURNSTILE_SECRET_KEY` | Backend (server runtime) | Secret used to call `siteverify` — never expose to the browser |

Both are already stored as Replit secrets.
