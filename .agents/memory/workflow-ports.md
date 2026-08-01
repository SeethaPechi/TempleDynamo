---
name: Workflow port forwarding & dev CORS
description: Two persistent issues that cause "Running" blank page on *.replit.dev — missing externalPort and CORS blocking dev origins
---

## Issue 1 — `externalPort = 80` keeps disappearing from `.replit`

The `[[ports]]` section in `.replit` **must** have both lines:

```toml
[[ports]]
localPort = 5000
externalPort = 80
```

Without `externalPort = 80`, Replit's proxy can't route external traffic to port 5000, so the `.replit.dev` URL shows only "Running" and the workflow startup times out with "didn't open port 5000" — even though the server is actually listening fine.

**Why:** Replit's infrastructure checks that `externalPort` maps to a local port. If absent, the external proxy never connects.

**How to apply:** Any time the workflow fails to start or the preview shows "Running", check `.replit` first. The line gets silently dropped when `.replit` is regenerated. Always use `verifyAndReplaceDotReplit` to restore it — direct edits to `.replit` are blocked.

This has been restored at least 3 times in this project.

---

## Issue 2 — CORS middleware must allow `*.replit.dev` origins in development

The CORS middleware in `server/index.ts` must allow `*.replit.dev` and `*.repl.co` origins when `NODE_ENV=development`, not just `localhost`. When the app is accessed directly via its `.replit.dev` URL in a browser, all API calls are cross-origin and get silently blocked if the CORS headers are missing.

**Why:** Replit proxies the preview through a different subdomain, so even same-project API calls appear as cross-origin to the browser.

**How to apply:** The dev origin check pattern:

```ts
const isDevOrigin = isDev && (
  /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
  /\.replit\.dev$/.test(origin) ||
  /\.repl\.co$/.test(origin)
);
```
