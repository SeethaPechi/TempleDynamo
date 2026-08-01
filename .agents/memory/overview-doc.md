---
name: Overview Doc Maintenance
description: TAMIL_KOVIL_APP_OVERVIEW.md must be kept current with every change
---

## Rule
`TAMIL_KOVIL_APP_OVERVIEW.md` in the project root is a living document intended to be fed to external LLMs for improvement suggestions. It must be updated whenever:
- A new DB table or column is added
- A new API endpoint is added or changed
- A new screen/page is added
- Auth or role logic changes
- Known issues are fixed or discovered

**Why:** The user explicitly requested this as a standing requirement (2026-08-01). Failing to update it makes the doc stale and useless for LLM consultation.

**How to apply:** After completing any meaningful code change, edit the relevant section(s) of TAMIL_KOVIL_APP_OVERVIEW.md before finishing the task.

## Structure of the doc (section map)
1. Purpose & Users
2. Tech Stack
3. Database Schema  ← update when schema changes
4. API Endpoints    ← update when routes change
5. Screens          ← update when pages change
6. Authentication & Session  ← update when auth/role logic changes
7. i18n
8. Component Architecture
9. Data Flow Examples
10. Known Issues & Security Gaps  ← update as issues are fixed/found
11. File Structure  ← update when files are added/removed
12. Custom Tailwind Colours
13. Suggested Improvement Areas
