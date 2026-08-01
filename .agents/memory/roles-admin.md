---
name: Roles & Admin System
description: How roles are structured, seeded, and enforced in Tamil Kovil
---

## Role design
- `roles` table is a reference/lookup table (id, name, label, description)
- `users.role` is a plain text column (NOT a FK) with default `'user'`
- Valid slugs: `system_admin`, `temple_admin`, `user`
- Roles are enforced server-side via `requireSystemAdmin` middleware in routes.ts
- Client-side guard in admin.tsx checks `user.role === 'system_admin'`

**Why:** Keeping role as a plain text column avoids join complexity for the common case (reading the current user's role on every request). The roles table exists only for the admin UI reference panel.

**How to apply:** When adding new protected routes, use `requireSystemAdmin` middleware (or create a `requireRole(role)` factory). Always check role server-side — never trust client-side role alone.

## Seeded data
- venkat.thirupathy@gmail.com → system_admin (set via direct SQL on 2026-08-01)
- All other existing users → user (set via UPDATE on 2026-08-01)
- New registrations default to `user` via `{ ...insertUser, role: 'user' }` in createUser()

## Admin API
- GET  /api/admin/users         → all users (no passwords), system_admin only
- PUT  /api/admin/users/:id/role → update role, system_admin only
- GET  /api/admin/roles         → roles reference table, system_admin only

## AuthUser type
- `useAuth()` exposes `user: AuthUser | null` where `AuthUser = Omit<User, 'password'>`
- This includes the `role` field — check `user.role` for role-based UI rendering
- useQuery is typed as `useQuery<Omit<User, 'password'> | null>` to avoid `{}` type inference
