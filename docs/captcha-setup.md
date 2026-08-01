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

## Verification checklist

After configuring the dashboard, complete these checks on the live production domain:

- [ ] Open `https://tamilkovil.com` in an **incognito/private** window
- [ ] Navigate to the **Login** page — the Turnstile widget should appear and spin briefly, then show a checkmark or interactive challenge
- [ ] Complete a test login with valid credentials — it should succeed without any "CAPTCHA verification failed" error
- [ ] Navigate to the **Register** page — the Turnstile widget should appear and complete the same way
- [ ] Attempt a registration (or confirm the widget passes) — no "CAPTCHA verification failed" error should appear
- [ ] Open browser DevTools → Console: confirm there are **no** `[captcha]` error messages and no Turnstile script errors

If any step fails, see the troubleshooting section below.

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
| `CAPTCHA_REQUIRED` | Backend (server runtime) | Set to `false` to disable CAPTCHA verification entirely (default: `true`) |

`VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are already stored as Replit secrets.

## Resilience: how the server handles Cloudflare outages

Two mechanisms ensure a Cloudflare outage cannot permanently lock users out of the site:

### 1. Fail-open on network errors and timeouts

`verifyCaptcha` in `server/routes.ts` wraps the `siteverify` HTTP call in an
`AbortController` with a **5-second timeout**. If the request times out or
encounters any network-level error (DNS failure, TCP reset, etc.) the function
returns `true` — the login or registration is **allowed through**. A `[captcha]`
warning is always logged so the operations team can see the degraded state:

```
[captcha] siteverify timed out after 5000 ms — failing open to prevent Cloudflare outage from locking users out
[captcha] siteverify network error — failing open — <error details>
```

> **Note:** fail-open applies only to network/infrastructure failures.
> If Cloudflare responds but rejects the token (e.g. `hostname-not-allowed`,
> `invalid-input-response`) the request is still rejected — that path is
> unaffected by this change.

### 2. Emergency bypass via `CAPTCHA_REQUIRED=false`

If the Turnstile service has a prolonged outage, an operator can disable CAPTCHA
verification entirely **without a code deploy** by setting the environment
variable:

```
CAPTCHA_REQUIRED=false
```

When set, every call to `verifyCaptcha` returns `true` immediately and logs a
prominent warning:

```
[captcha] CAPTCHA_REQUIRED=false — verification bypassed; re-enable before accepting real traffic
```

**How to set it in Replit:**

1. Open the **Secrets** panel in the Replit sidebar.
2. Add a secret named `CAPTCHA_REQUIRED` with value `false`.
3. Restart the server workflow.

**Remember to remove or reset the variable to `true` once Cloudflare recovers.**
Leaving it off in production permanently defeats bot protection.

## Troubleshooting

### Widget renders but login/register returns "CAPTCHA verification failed"

The widget loaded, but the token was rejected server-side. Most likely cause:
`tamilkovil.com` is not yet listed under **Allowed Hostnames** in the Turnstile
dashboard. Follow the setup steps above, save, and retry.

### Widget never appears / spins forever

- Confirm `VITE_TURNSTILE_SITE_KEY` is set in Replit secrets and that a fresh
  production build was deployed after setting it (it is baked in at build time).
- Check the browser console for `[captcha] VITE_TURNSTILE_SITE_KEY is not set`.
- Confirm the Cloudflare Turnstile JS loads: Network tab → filter for
  `challenges.cloudflare.com` — it should return `200`.

### Widget works on `.replit.dev` but not on `tamilkovil.com`

Add `tamilkovil.com` to **Allowed Hostnames** in the Turnstile dashboard.
The `*.replit.dev` wildcard does not cover the production domain.

### "Too many attempts" error before the CAPTCHA is even shown

This is the rate limiter (`authLimiter` in `server/routes.ts`), not the CAPTCHA.
The limit is 10 requests per 15-minute window per IP. Wait 15 minutes and retry,
or test from a different IP address.

## Server-side error codes

When Cloudflare rejects a token, `verifyCaptcha` logs a structured warning at
the `[captcha]` prefix — for example:

```
[captcha] verification failed — error_codes=["hostname-not-allowed"]
```

Use the table below to diagnose the root cause without exposing any PII or
token values:

| `error-codes` value | Meaning | Fix |
|---|---|---|
| `missing-input-secret` | `TURNSTILE_SECRET_KEY` was not sent | Ensure the secret is set in Replit secrets |
| `invalid-input-secret` | Secret key is wrong or revoked | Re-copy the secret from the Cloudflare Turnstile dashboard |
| `missing-input-response` | No token was included in the request | Client-side bug — token not attached before form submit |
| `invalid-input-response` | Token is malformed, expired, or already used | User waited too long or reused a token; ask them to retry |
| `bad-request` | Request to `siteverify` was malformed | Check server-side payload construction in `verifyCaptcha` |
| `timeout-or-duplicate` | Token has already been verified once | Normal on a retry — ask the user to reload and try again |
| `hostname-not-allowed` | The hostname that issued the token is not in the Allowed Hostnames list | Add the hostname in the Cloudflare Turnstile dashboard (see setup steps above) |
| `internal-error` | Cloudflare-side error | Transient; retry after a short delay |

If the log shows `[captcha] siteverify request failed` (a network-level error
rather than a Cloudflare rejection), the server could not reach
`challenges.cloudflare.com` — check outbound network connectivity from the
server.
