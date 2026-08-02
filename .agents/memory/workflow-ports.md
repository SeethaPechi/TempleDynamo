---
name: Workflow port forwarding & dev CORS
description: Persistent issues causing "Running" / "this route doesn't exist" on *.replit.dev — missing externalPort, bad CORS, and shutdown handling
---

## Issue 1 — `externalPort = 80` keeps disappearing from `.replit`

The `[[ports]]` section in `.replit` **must** have both lines:

```toml
[[ports]]
localPort = 5000
externalPort = 80
```

Without `externalPort = 80`, Replit's proxy can't route external traffic to port 5000. Symptoms:
- `.replit.dev` URL shows `{"status":"error","message":"this route doesn't exist"}` (Replit proxy JSON)
- Workflow startup times out with "didn't open port 5000" — even though the server logs "serving on port 5000"

**Why:** Replit's infrastructure requires `externalPort` to set up the port-80 → port-1104 → port-5000 forwarding chain. Without it, the workflow port detector never fires and the external proxy has no route to the app.

**How to apply:** Use `verifyAndReplaceDotReplit` — direct `.replit` edits are blocked. The tool DOES accept `externalPort = 80` when the file is written to a `.new` temp path first. The key: write the full `.replit` content to `/home/runner/workspace/.replit.new`, then call `verifyAndReplaceDotReplit({ tempFilePath: "/home/runner/workspace/.replit.new" })`. After any `configureWorkflow` call, always check whether `externalPort = 80` was preserved — it gets silently dropped if the tool rewrites `.replit`.

This line has been stripped and re-added at least 5 times in this project.

---

## Issue 2 — `configureWorkflow` creates a "Project" wrapper and broken TOML order

`configureWorkflow({ outputType: "webview" })` rewrites `.replit` with:
1. A "Project" parallel wrapper workflow that calls "Start application"
2. `[workflows.workflow.metadata] outputType = "webview"` placed AFTER `[[workflows.workflow.tasks]]` — this TOML order can be invalid (sub-table after array-table of same parent)
3. Strips `externalPort = 80`
4. Changes `runButton` to "Project"

**How to apply:** After any `configureWorkflow` call, immediately rewrite `.replit` via `verifyAndReplaceDotReplit` to restore the minimal structure:

```toml
[workflows]
runButton = "Start application"

[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run dev"
waitForPort = 5000

[[ports]]
localPort = 5000
externalPort = 80
```

---

## Issue 3 — CORS must allow ALL origins in dev mode

The CORS middleware in `server/index.ts` must allow any origin when `NODE_ENV=development`. Restricting to just `*.replit.dev` patterns breaks Replit's internal auth gateway which uses internal domains. Fixed pattern:

```ts
if (isDev) {
  if (origin) res.header("Access-Control-Allow-Origin", origin);
} else if (PRODUCTION_ORIGINS.has(origin)) {
  res.header("Access-Control-Allow-Origin", origin);
}
```

---

## Issue 4 — Graceful SIGTERM handler required

Without a SIGTERM handler, `server.close()` on shutdown can leave port 5000 occupied (lingering keep-alive/Vite HMR connections). Add to `server/index.ts`:

```ts
const shutdown = () => {
  if ((server as any).closeAllConnections) (server as any).closeAllConnections();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

`reusePort` should NOT be set — clean SIGTERM handling makes it unnecessary.
