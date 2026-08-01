---
name: Admin Panel Structure
description: How the admin panel is organised — tabs, files, access control
---

## Structure
- Entry: `client/src/pages/admin.tsx` — tabbed shell, system_admin guard, Tabs component
- Each tab is a self-contained component under `client/src/pages/admin/`

| Tab value | File | API used |
|---|---|---|
| users | users-roles-tab.tsx | GET/PUT /api/admin/users, /api/admin/users/:id/role |
| relationship-map | relationship-map-tab.tsx | GET /api/admin/relationship-map |
| relationship | relationship-types-tab.tsx | GET/POST/PUT/DELETE /api/admin/relationship-types |
| temple-members | temple-members-tab.tsx | GET /api/admin/temple-members |
| temple-admin | temple-admin-tab.tsx | GET /api/admin/temple-admins, PUT /api/admin/temple-admins/:templeId |

**Why separate files:** Admin grew to 5 distinct sections; one file would exceed ~300 lines and make it hard to maintain.

**How to apply:** To add a new admin tab, create `admin/<name>-tab.tsx`, add the import to `admin.tsx`, add a `<TabsTrigger>` and `<TabsContent>` entry.

## Access control
- Server: `requireSystemAdmin` middleware on all `/api/admin/*` routes
- Client: guard in `admin.tsx` checks `user.role === 'system_admin'`; non-admins see "Access Denied" card; unauthenticated users see "Authentication Required"
- Nav: Admin link only rendered when `user.role === 'system_admin'`
