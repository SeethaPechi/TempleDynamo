---
name: Workflow port forwarding
description: Why the Start application workflow timed out on port 5000 despite the server serving
---
The rule: the `[[ports]]` entry in `.replit` must include `externalPort = 80` for local port 5000; without it the platform never forwards the port and workflow startup times out with "didn't open port 5000" even while logs show "serving on port 5000".

**Why:** Hit this Aug 2026 — server bound 0.0.0.0:5000 correctly, manual `npm run dev` worked, but restarts failed until externalPort was added (via verifyAndReplaceDotReplit; .replit cannot be edited directly).

**How to apply:** If a workflow times out on a port while logs show the server serving, check `.replit` `[[ports]]` for a missing externalPort before debugging the app code.
