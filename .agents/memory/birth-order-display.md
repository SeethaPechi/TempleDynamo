---
name: Birth order display — where badges and sort live
description: Which components render birth order number badges and sort children/siblings, and the cache issue that caused stale data.
---

# Birth Order Display

## Rule
Every component that renders Children or Siblings cards must: (1) sort ascending by `birthOrder` (nulls last via `?? Infinity`), and (2) show a small green `w-5 h-5` circle badge with the number when `birthOrder != null`.

**Why:** `birth_order` is set per member by admins. Without sort + badge, the UI looks broken and users can't tell who is eldest.

## How to apply
Components already updated (as of 2026-08-05):
- `elegant-family-tree.tsx` — NodeCard receives `birthOrder={rel.relatedMember.birthOrder}`; siblings and children both sorted
- `family-tree-visualization.tsx` — cards in Children + Siblings groups sorted + badge on avatar
- `comprehensive-family-display.tsx` — cards in Children + Siblings groups sorted + badge inline with name
- `registry.tsx` — search results dropdown shows badge next to member name

If a new component renders children/siblings, apply the same pattern.

## Cache gotcha
Global TanStack Query `staleTime` is **5 minutes** (set in `client/src/lib/queryClient.ts`). Relationships queries must override with `staleTime: 0` or the client serves stale data without `birthOrder` after the field is first populated in the DB.

Queries already fixed:
- `family-tree.tsx` — member relationships query + map relationships query
- `member-details.tsx` — relationships query
