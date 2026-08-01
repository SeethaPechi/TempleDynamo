# Tamil Kovil — Complete Application Overview
> Feed this document to Claude (or any LLM) for improvement suggestions.
> It covers every screen, every API, the full database schema, the tech stack, known issues, and open gaps.

---

## 1. Purpose & Users

**Tamil Kovil** is a bilingual (English + Tamil) temple-community management platform for Tamil diaspora families. It lets community administrators register members, record family relationships, manage temples, and broadcast messages via WhatsApp.

**Target users:**
- Temple administrators – register/edit members and temples, manage the community directory
- Community members – browse the family directory and family tree
- Public visitors – learn about the app (About section), register, sign in

**Production URL:** `tamilkovil.com` (autoscale deployment on Replit)

---

## 2. Tech Stack

### Runtime & Server
| Layer | Technology |
|---|---|
| Runtime | Node.js (via `tsx` for TypeScript execution) |
| HTTP framework | Express 4.21 |
| Language | TypeScript 5.6 (shared between server and client) |
| Session management | `express-session` 1.18 + `connect-pg-simple` (PostgreSQL session store) |
| Auth strategy | Passport.js 0.7 with `passport-local`; passwords stored as **base64** (not bcrypt — a security gap) |
| WebSocket | `ws` 8.18 |
| WhatsApp bridge | `whatsapp-web.js` 1.23 |
| QR code generation | `qrcode` + `qrcode-terminal` |

### Database
| Layer | Technology |
|---|---|
| Database | PostgreSQL (Neon serverless, accessed via `pg` 8.16) |
| ORM | Drizzle ORM 0.39 |
| Schema validation | Drizzle-Zod → Zod 3.24 |
| Migrations | `drizzle-kit` 0.30 (`drizzle.config.ts` → `./migrations/`) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18.3 + Vite 5.4 |
| Routing | Wouter 3.3 |
| State / data fetching | TanStack Query v5 (`@tanstack/react-query`) |
| Forms | React Hook Form 7.55 + Zod validation |
| Component library | shadcn/ui (full Radix UI primitive set) |
| Styling | Tailwind CSS 3.4 + `tailwindcss-animate` + `@tailwindcss/typography` |
| Animations | Framer Motion 11 |
| Charts | Recharts 2.15 |
| Internationalisation | i18next 25 + `react-i18next` 15 + `i18next-browser-languagedetector` |
| Icons | Lucide React 0.453 + React Icons 5.4 |
| Date handling | `date-fns` 3.6 |

### Build & Dev
- Vite with `@vitejs/plugin-react` and `@replit/vite-plugin-cartographer`
- `esbuild` for server bundling in production
- Single Express server serves both API (`/api/*`) and Vite-built SPA
- Dev: Vite middleware injected into Express; Prod: `serveStatic()` serves `/dist/public`
- Port: **5000** (only open port)

### Deployment
- Replit Autoscale deployment
- `DATABASE_URL`, `PGHOST/PORT/USER/PASSWORD/DATABASE`, `SESSION_SECRET` injected as secrets
- CORS headers applied globally (wildcard `*`) — over-permissive for production

---

## 3. Database Schema

### Table: `members`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `full_name` | text | NOT NULL | English |
| `full_name_ta` | text | nullable | Tamil (new) |
| `phone` | text | nullable | |
| `email` | text | nullable | |
| `gender` | text | `'Male'\|'Female'` | |
| `birth_city` | text | NOT NULL | English |
| `birth_city_ta` | text | nullable | Tamil (new) |
| `birth_state` | text | NOT NULL | |
| `birth_country` | text | NOT NULL | |
| `current_city` | text | NOT NULL | English |
| `current_city_ta` | text | nullable | Tamil (new) |
| `current_state` | text | NOT NULL | |
| `current_country` | text | NOT NULL | |
| `father_name` | text | NOT NULL | English |
| `father_name_ta` | text | nullable | Tamil (new) |
| `mother_name` | text | NOT NULL | English |
| `mother_name_ta` | text | nullable | Tamil (new) |
| `spouse_name` | text | nullable | English |
| `spouse_name_ta` | text | nullable | Tamil (new) |
| `marital_status` | text | NOT NULL, default `'Single'` | `Single\|Married\|Divorced\|Widowed` |
| `temple_id` | integer | FK → temples.id, nullable | |
| `profile_picture` | text | nullable | base64 or URL |
| `photos` | text[] | default `[]` | array of base64 or URLs |
| `created_at` | timestamp | defaultNow() | |

### Table: `relationships`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `member_id` | integer | NOT NULL, FK → members.id | subject |
| `related_member_id` | integer | NOT NULL, FK → members.id | object |
| `relationship_type` | text | NOT NULL | stored in **English** (e.g. "Father", "Son") — not translated |
| `created_at` | timestamp | defaultNow() | |

### Table: `users` (authenticated app accounts)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `first_name` | text | NOT NULL | |
| `last_name` | text | NOT NULL | |
| `email` | text | NOT NULL, UNIQUE | |
| `phone` | text | NOT NULL | |
| `country_code` | text | NOT NULL, default `'+1'` | |
| `password` | text | NOT NULL | **base64-encoded** (not hashed) |
| `password_hint` | text | nullable | stored in plaintext |
| `is_active` | text | default `'true'` | string, not boolean |
| `created_at` | timestamp | defaultNow() | |

### Table: `temples`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text NOT NULL | |
| `deity` | text | |
| `address` | text | |
| `city` | text | |
| `state` | text | |
| `country` | text | |
| `phone` | text | |
| `email` | text | |
| `website` | text | |
| `description` | text | |
| `established_year` | text | |
| `image` | text | base64 or URL |
| `created_at` | timestamp | |

> **Gap:** temples table has no Tamil-language columns.

---

## 4. API Endpoints

### Authentication (all public)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account. Body: `{firstName, lastName, email, phone, countryCode, password, passwordHint}`. Returns user (no password). Errors: 400 duplicate email, 400 validation, 500. |
| POST | `/api/auth/login` | Public | Body `{email, password}`. Sets `session.userId`. Returns user. Errors: 400 validation, 401 bad credentials. |
| POST | `/api/auth/logout` | Public | Destroys session. |
| GET | `/api/auth/me` | Session | Returns current user or 401. |

### Members
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/members` | ✅ Required | Create member. Full `insertMemberSchema` body. |
| GET | `/api/members` | ✅ Required | List/search members. Query: `search`, `city`, `state`, `lang`. `lang=ta` coalesces `*_ta` columns when non-null. |
| GET | `/api/members/search` | Public | Search by `term`, `city`, `state`. Min 2 chars. |
| GET | `/api/members/cities` | Public | Distinct city list. |
| GET | `/api/members/states` | Public | Distinct state list. |
| GET | `/api/members/:id` | ✅ Required | Member by ID. |
| PUT | `/api/members/:id` | ✅ Required | Full update (all fields required). |
| PATCH | `/api/members/:id` | ⚠️ Public | Partial update — **auth not enforced**. |
| DELETE | `/api/members/:id` | ✅ Required | Delete member. |
| GET | `/api/members/search/:term` | Public | Path-based search. |

### Relationships
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/relationships` | ✅ Required | Create relationship. Body: `{memberId, relatedMemberId, relationshipType}`. |
| GET | `/api/relationships/:memberId` | ✅ Required | Get all relationships for a member, joins related member details. |
| DELETE | `/api/relationships/:id` | ✅ Required | Delete relationship by relationship ID. |

### Temples
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/temples` | ✅ Required | Create temple. Supports multipart with image. |
| GET | `/api/temples` | Public | List all temples. Query: `search`. |
| GET | `/api/temples/:id` | Public | Temple by ID. |
| PUT | `/api/temples/:id` | ✅ Required | Full update. Supports multipart for image upload. |
| DELETE | `/api/temples/:id` | ✅ Required | Delete temple (fails if members assigned). |

### WhatsApp
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/whatsapp/templates` | ✅ Required | Return available message templates. |
| POST | `/api/whatsapp/process-template` | ✅ Required | Replace template variables with values. |
| POST | `/api/whatsapp/broadcast-urls` | ✅ Required | Generate `wa.me` click-to-chat URLs for recipients. |

### Utility
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | DB health probe. Returns `{status, database, timestamp}`. |

### Known API Issues
1. **`PATCH /api/members/:id` is unauthenticated** — any visitor can edit any member.
2. **Duplicate route**: `GET /api/members/search` is defined twice; the second handler is unreachable.
3. **`GET /api/members/search/:term`** (path-based) and `GET /api/members/search` (query-based) serve the same purpose — redundant.
4. **Health check** uses `getAllMembers` (full table scan) — expensive for a health probe.
5. **No pagination** on `GET /api/members` — full table returned every time.

---

## 5. Screens & User Flows

### 5.1 Public Screens (no login required)

#### `/` — Home / Landing Page (`home.tsx` → `WelcomePage` component)
**Sections:**
1. **Hero** — Full-screen gradient (saffron/temple-red), temple logo, tagline, "Join Our Community" + "Sign In" CTAs
2. **Features** — 3 icon cards: Family Registry, Temple Network, Community Connect
3. **About** (`#about`) — Narrative about Tamil Kovil, 4 highlight cards (Members, Temples, Families, Languages), 3 pillar cards (Heritage, Connections, Community)
4. **CTA strip** — Final register/sign-in prompt

**Behaviour:** When user is already authenticated, renders the authenticated dashboard instead (member count, temple count, quick-action cards, recent members list).

#### `/signin` — Sign In (`signin.tsx`)
- Email + password form + captcha field
- Link to `/register`
- Uses `useAuth().login()`

#### `/register` — Create Account (`register.tsx`)
- 3 sections: Personal info (first/last name), Contact (country code + phone, email), Security (password, confirm password, password hint)
- Country-code dropdown
- Captcha
- Link to `/signin`
- Uses `useAuth().register()`

---

### 5.2 Protected Screens (login required; redirects to `/signin` if not authenticated)

#### `/family-registry` — Register a Member (`registry.tsx`)
**Purpose:** Add a new community member to the database.

**Form sections:**
1. Personal Identity — full name, gender, marital status, profile picture upload
2. Birth Location — city, state, country
3. Current Location — city, state, country
4. Temple — select from dropdown (`GET /api/temples`)
5. Family — father name, mother name, spouse name (if married)
6. Linked Relatives — search for existing members (`GET /api/members/search`), select relationship type, link (creates a `relationships` record)
7. Photos — upload multiple photos (stored as base64)

**APIs called:** `GET /api/temples`, `GET /api/members/search`, `POST /api/members`, `POST /api/relationships`

---

#### `/members` — Member Directory (`members.tsx`)
**Purpose:** Browse and search all registered members.

**UI:**
- Search/filter toolbar: text search (name/email/phone), city filter, state filter
- Paginated member cards (name, location, temple, family info, photo)
- Each card links to `/member-details/:id`
- Language-aware: passes `?lang=ta` to API when Tamil mode is active; `i18n.language` in TanStack Query key triggers refetch on language switch

**APIs called:** `GET /api/members?lang=&search=&city=&state=`, `GET /api/members/cities`, `GET /api/members/states`

---

#### `/member-details/:id` — Member Profile (`member-details.tsx`)
**Purpose:** Full profile view for a single member.

**UI sections:**
- Profile photo, name, contact details
- Birth and current location
- Family info (father, mother, spouse)
- Temple affiliation
- Photo gallery
- Family relationships (rendered via `RelationshipCounters` and `ComprehensiveFamilyDisplay` components)

**APIs called:** `GET /api/members/:id`, `GET /api/relationships/:memberId`

---

#### `/family-tree` — Interactive Family Tree (`family-tree.tsx`)
**Purpose:** Visualise and explore family connections as a graph/tree.

**UI:**
- Member search/select sidebar
- Visual tree rendered in `FamilyTreeVisualization` component (SVG/canvas-based node graph)
- `RelationshipCounters` panel — counters per relationship group (Parents, Spouse, Children, etc.)
- `ComprehensiveFamilyDisplay` — tabbed grouped relationship display
- `MemberListModal` — modal with scrollable member list for selecting a member

**APIs called:** `GET /api/members?lang=`, `GET /api/relationships/:memberId`

**i18n:** All group names (Parents, Spouse, Children, Siblings, Grandparents, Grandchildren, Uncles/Aunts, Nieces/Nephews, Cousins, In-laws) translated via `translateGroupName()` helper.

---

#### `/temples` — Temple Directory (`temples.tsx`)
**Purpose:** Browse, edit, and delete temples; assign members to temples.

**UI:**
- Search bar
- Temple cards with image, deity, location, member count
- Edit dialog (full temple form)
- Image upload/replace
- Delete with confirmation
- Member assignment panel

**APIs called:** `GET /api/temples`, `GET /api/members`, `PUT /api/temples/:id`, `DELETE /api/temples/:id`

---

#### `/temple-registry` — Register a Temple (`temple-registry.tsx`)
**Purpose:** Add a new temple.

**Form sections:**
1. Identity — name, deity
2. Address — street, city, state, country
3. Establishment — year founded, contact phone/email, website
4. Description — free text
5. Image — upload

**APIs called:** `GET /api/temples` (check duplicate), `POST /api/temples`

---

#### `/temple-members` — Temple ↔ Member Association (`temple-members.tsx`)
**Purpose:** View members filtered by temple.

**UI:**
- Temple selector dropdown
- Member grid filtered by selected temple and optional city/state filters
- Read-only member cards

**APIs called:** `GET /api/members`, `GET /api/temples`, `GET /api/members/cities`, `GET /api/members/states`

---

#### `/temple-details/:id` — Temple Profile (`temple-details.tsx`)
**Purpose:** Full detail page for a single temple.

**UI:** Temple image, name, deity, location, description, contact info, member list for that temple.

**APIs called:** `GET /api/temples/:id`, `GET /api/members?templeId=`

---

#### `/whatsapp` — WhatsApp Broadcast (`whatsapp.tsx`)
**Purpose:** Generate WhatsApp broadcast message links for community messaging.

**UI:**
- Template selector (`GET /api/whatsapp/templates`)
- Variable substitution form (fills template placeholders)
- Recipient selector (individual members or by temple)
- Preview pane showing generated message
- List of generated `wa.me/?text=...` click-to-open links

**APIs called:** `GET /api/members`, `GET /api/whatsapp/templates`, `GET /api/temples`, `POST /api/whatsapp/process-template`, `POST /api/whatsapp/broadcast-urls`

---

### 5.3 Error & Utility Screens
- `/not-found` — 404 page
- Loading spinner shown during auth state resolution on app boot

---

## 6. Authentication & Session

- **Strategy:** Passport.js local strategy with `express-session`
- **Session store:** PostgreSQL via `connect-pg-simple` (persistent sessions)
- **Session duration:** 24 hours cookie
- **Auth context:** `AuthProvider` wraps the app; `useAuth()` hook exposes `{user, isAuthenticated, isLoading, login, logout, register}`
- **Route guard:** `Router` component checks `isAuthenticated`; protected routes render only when authenticated, otherwise redirect to `/signin`
- **Password storage:** `btoa()` / base64 encoding — **NOT cryptographic hashing** (critical security gap)
- **CAPTCHA:** Frontend renders a captcha input field on sign-in and register, but there is no server-side captcha verification

---

## 7. Internationalisation (i18n)

**Supported languages:** English (`en`), Tamil (`ta`)

**Framework:** `i18next` + `react-i18next` + `i18next-browser-languagedetector`

**Translation files:**
- `client/src/i18n/locales/en.json` (~546 lines)
- `client/src/i18n/locales/ta.json` (~565 lines)

**Namespace structure (top-level keys):**
```
nav        → navigation labels (home, members, familyTree, temples, templeRegistry, whatsapp)
home       → landing page copy
members    → directory page
registry   → member registration form
whatsapp   → broadcast page
familyTree → tree page + group names (parents, spouse, children, siblings, grandparents,
             grandchildren, unclesAunts, niecesNephews, cousins, inLaws)
common     → shared labels (notProvided, loading, error, save, cancel, delete, edit…)
memberDetails → profile page
temples    → temple directory
templeRegistry → temple registration form
```

**Language switching:** `LanguageSwitcher` component in nav bar; changes `i18n.language` which triggers TanStack Query key invalidation for member lists.

**Tamil data:** 6 `_ta` columns exist in `members` table (`full_name_ta`, `father_name_ta`, `mother_name_ta`, `spouse_name_ta`, `birth_city_ta`, `current_city_ta`). API coalesces these when `?lang=ta` is passed and the value is non-null. **All values currently NULL** — no UI for entering Tamil member data yet.

**Known i18n gaps:**
- Relationship type values in DB are English strings (e.g. "Father", "Son") — not translated
- Temple names/descriptions have no Tamil columns
- Some hardcoded English strings remain on WhatsApp, Temple, and Member Detail pages
- `ta.json` has some keys not present in `en.json` (mismatch)

---

## 8. Component Architecture

### Key Shared Components
| Component | Path | Purpose |
|---|---|---|
| `Navigation` | `components/navigation.tsx` | Sticky top nav; adapts for public (Home + About) vs authenticated (full menu) state |
| `LanguageSwitcher` | `components/language-switcher.tsx` | EN/TA toggle |
| `ComprehensiveFamilyDisplay` | `components/comprehensive-family-display.tsx` | Tabbed grouped relationship display; `translateGroupName()` |
| `RelationshipCounters` | `components/relationship-counters.tsx` | Clickable counters per relationship group; modal detail |
| `FamilyTreeVisualization` | `components/family-tree-visualization.tsx` | SVG/canvas family tree graph |
| `MemberListModal` | `components/member-list-modal.tsx` | Scrollable member picker modal |

### State Management
- **Server state:** TanStack Query v5 — all API data fetched and cached here
- **Form state:** React Hook Form + Zod schemas (derived from Drizzle schemas via `drizzle-zod`)
- **Auth state:** React Context (`AuthProvider`)
- **UI state:** Local `useState` within components; one case uses a cookie for persistence

---

## 9. Data Flow Examples

### Registering a Member
```
User fills form → react-hook-form validates (Zod)
→ POST /api/members (auth required)
  → Server validates with insertMemberSchema
  → db.insert(members)
  → returns member object
→ If relative linked:
  → POST /api/relationships
    → db.insert(relationships)
→ TanStack Query invalidates ['members'] cache
→ Members page refetches
```

### Viewing Family Tree in Tamil
```
User switches to Tamil via LanguageSwitcher
→ i18n.language = 'ta'
→ TanStack Query key ['members', 'ta'] triggers refetch
→ GET /api/members?lang=ta
  → applyLangCoalesce() replaces fullName/fatherName/etc with *_ta values (if non-null)
  → returns member array (still English for most, since _ta cols are NULL)
→ FamilyTreeVisualization re-renders
→ Group labels translated via translateGroupName(name, t)
```

---

## 10. Known Issues & Security Gaps

### Critical
1. **Passwords stored as base64** (`btoa(password)`) — trivially reversible. Must use bcrypt/argon2.
2. **`PATCH /api/members/:id` is unauthenticated** — any anonymous user can edit any member record.
3. **CORS set to wildcard `*`** — production should restrict to `tamilkovil.com`.
4. **CAPTCHA not server-verified** — the frontend captcha field is decorative only.

### High Priority
5. **No pagination** on member list — full table returned; will degrade with scale.
6. **Images stored as base64 in DB columns** — profile pictures and temple images stored inline in text columns; should use object storage (S3/R2/Cloudinary).
7. **`is_active` is a text column** (`'true'`/`'false'`), not boolean — inconsistent and error-prone.
8. **`password_hint` stored in plaintext** alongside the user record.

### Medium Priority
9. **Relationship types stored as English strings** — cannot be translated without data migration or a lookup table.
10. **All Tamil name columns (`_ta`) are NULL** — no UI to enter Tamil data.
11. **Duplicate route handler** for `GET /api/members/search` (second one unreachable).
12. **Health endpoint** does a full table scan (`getAllMembers`) — should use a lightweight `SELECT 1`.
13. **No role-based access control** — any authenticated user can delete members, temples, and relationships.
14. **No email verification** — anyone can register with any email address.
15. **Session secret** stored as an env var but no rotation mechanism.

### Low Priority / UX
16. **No member edit UI** — there is a PUT endpoint but no edit form screen.
17. **Family tree visualisation** has no zoom/pan controls documented.
18. **WhatsApp integration** uses `wa.me` link generation only — no real-time WhatsApp API integration.
19. **Temple details page** — no Tamil translations.
20. **`nav.home` etc. not translated** consistently across all protected pages.

---

## 11. File Structure (key paths)

```
/
├── client/
│   └── src/
│       ├── App.tsx                        # Router, AuthProvider
│       ├── pages/
│       │   ├── home.tsx                   # Landing + authenticated dashboard
│       │   ├── signin.tsx                 # Sign in
│       │   ├── register.tsx               # Create account
│       │   ├── registry.tsx               # Register member
│       │   ├── members.tsx                # Member directory
│       │   ├── member-details.tsx         # Member profile
│       │   ├── family-tree.tsx            # Family tree explorer
│       │   ├── temples.tsx                # Temple directory
│       │   ├── temple-registry.tsx        # Register temple
│       │   ├── temple-members.tsx         # Temple → member view
│       │   ├── temple-details.tsx         # Temple profile
│       │   ├── whatsapp.tsx               # WhatsApp broadcast
│       │   └── not-found.tsx              # 404
│       ├── components/
│       │   ├── navigation.tsx
│       │   ├── language-switcher.tsx
│       │   ├── comprehensive-family-display.tsx
│       │   ├── relationship-counters.tsx
│       │   ├── family-tree-visualization.tsx
│       │   ├── member-list-modal.tsx
│       │   └── ui/                        # shadcn/ui primitives
│       ├── hooks/
│       │   ├── useAuth.tsx                # Auth context + hook
│       │   └── use-toast.ts
│       ├── i18n/
│       │   └── locales/
│       │       ├── en.json                # English translations
│       │       └── ta.json                # Tamil translations
│       └── lib/
│           └── queryClient.ts             # TanStack Query client
├── server/
│   ├── index.ts                           # Express bootstrap
│   ├── routes.ts                          # All API routes + session middleware
│   ├── storage.ts                         # DB query functions (Drizzle)
│   └── vite.ts                            # Vite dev/prod middleware
├── shared/
│   └── schema.ts                          # Drizzle schema + Zod schemas (shared client/server)
├── scripts/
│   └── check-i18n-dupes.cjs              # i18n duplicate key guard
├── migrations/                            # Drizzle migration SQL files
├── drizzle.config.ts                      # Drizzle Kit config
├── vite.config.ts                         # Vite config
├── tailwind.config.ts                     # Tailwind config (saffron, temple-red, temple-brown custom colours)
└── package.json
```

---

## 12. Custom Tailwind Colours

```
saffron-50 … saffron-900  (orange/saffron scale)
temple-red                 (deep red, used for primary actions)
temple-brown               (dark brown, used for text)
temple-gold                (gold, used for nav border)
```

---

## 13. Suggested Improvement Areas (starter prompts for Claude)

Use this document and ask Claude to elaborate on any of these:

**Security**
- Replace base64 password encoding with bcrypt/argon2
- Add `requireAuth` to `PATCH /api/members/:id`
- Restrict CORS to production domain
- Implement server-side captcha (e.g. hCaptcha or Cloudflare Turnstile)
- Add rate limiting to auth endpoints

**Data & Performance**
- Implement pagination on `GET /api/members` (cursor-based or offset)
- Move image storage out of DB (Cloudflare R2, AWS S3, Cloudinary)
- Add indexing on `members.full_name`, `members.temple_id`, `relationships.member_id`
- Fix `is_active` to boolean column

**Features**
- Member edit screen (UI for `PUT /api/members/:id`)
- Admin UI to enter Tamil name data (`_ta` columns)
- Role system: admin vs viewer
- Email verification on registration
- Relationship type translation (enum table or frontend mapping)
- Temple Tamil translations (`name_ta`, `description_ta`)
- Real-time WhatsApp API integration (replace link-generation approach)
- Member deactivation instead of hard delete

**UX / Frontend**
- Family tree zoom/pan/minimap controls
- Mobile-responsive family tree
- Skeleton loading states on member cards
- Empty state illustrations
- Deep-link support for family tree (URL reflects selected member)
- Progressive profile completion prompt

**Code Quality**
- Remove duplicate `GET /api/members/search` route
- Fix health endpoint (use `SELECT 1` instead of full table scan)
- Unify PUT vs PATCH member update endpoints
- Add input sanitisation middleware
- TypeScript strict mode
- End-to-end test coverage (Playwright)
