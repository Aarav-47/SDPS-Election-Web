# SDPS Student Council Election — PRD

## Original Problem Statement
School student-council election kiosk for SDPS. Students/teachers authenticate by school ID, confirm identity, vote sequentially across multiple posts. Admin sees stats by category, individual voters, highest votes. Theme: white + royal blue + gold, 3D gradient style. Local DB. Admin manages candidates (name, photo, election symbol), uploads student/teacher Excel, resets stats, uploads school logo, manages categories, locks election window, publishes live results, prints declaration, manipulates results.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT admin auth. bcrypt password. openpyxl for Excel parsing & template generation.
- **Frontend**: React 19 + react-router-dom + Tailwind + Shadcn UI + Recharts + Sonner. Custom 3D-gradient kiosk theme. CSS confetti. CSS @media print.

## User Personas
1. **Student / Teacher voter** — kiosk single-ballot voting.
2. **Election admin (Aarav)** — manages everything: categories, candidates, voter rolls, settings, results, declaration, manipulation.
3. **Public observer** — reads live results screen on a projector.

## Implemented (date: 2026-02-08)

### Iteration 1 — MVP
Kiosk auth → confirm → 5-post sequential vote → thank-you. Admin login + dashboard with stats, candidate CRUD, Excel upload.

### Iteration 2 — roles, categories, branding
- Student/Teacher dual roles with prefixes SDPSS / SDPSE
- Categories CRUD (full editable; delete blocked when votes exist)
- Sample Excel template downloads (student + teacher)
- School logo upload + Settings tab + Reset Votes / Reset All
- Text-shadow drop shadows for readability

### Iteration 3 — backlog (this release)
- **Per-class turnout chart** in admin Overview (horizontal bar: voted vs total per class).
- **Live public results page** (`/results`): no auth, glassmorphic per-post bars, leader gold-tinted, KPI cards, auto-refreshes every 5s with timestamp + animated indicator.
- **Election open/closed lock** in Settings tab → kiosk shows red "Voting CLOSED" banner; backend rejects `POST /api/votes` with 403.
- **Printable Declaration page** (`/admin/declaration`): cover with school logo + double-gold border, winner cards with photos in gold rings + crown badge, full candidate breakdown, `@media print` styles, Print button.
- **Vote manipulation**:
  - (a) Voters tab: edit / delete individual ballots (`PUT /api/admin/votes/{id}`, `DELETE /api/admin/votes/{id}`); edit modal lets admin pick a different candidate per post.
  - (b) Candidates tab: per-candidate `adjustment` field (positive or negative) added to real vote count; results show `Adj: +N` badge.

## Routes
- Kiosk: `/`, `/confirm`, `/vote`, `/thank-you`
- Public: `/results`
- Admin: `/admin/login`, `/admin`, `/admin/declaration`

## API Surface (`/api`)
**Public**: `GET /posts`, `GET /settings`, `GET /results`, `GET /users/{adm}`, `GET /candidates`, `POST /votes` (gated by election_open setting)
**Admin (JWT)**: `POST /admin/login`, `GET/POST/PUT/DELETE /admin/posts`, `GET/POST/PUT/DELETE /admin/candidates`, `GET /admin/users`, `POST /admin/users/upload?role=`, `DELETE /admin/users/{adm}`, `GET /admin/template/{role}`, `GET/PUT /admin/settings`, `PUT/DELETE /admin/votes/{id}`, `POST /admin/reset/votes`, `POST /admin/reset/all`, `GET /admin/stats`

## Test Status
- iteration_1: backend 16/16 ✓, kiosk + admin E2E ✓
- iteration_2: backend 20/20 ✓, kiosk student+teacher E2E ✓, all 8 admin tabs ✓
- iteration_3: backend 10/10 ✓, all backlog features verified end-to-end ✓

## Backlog (P1/P2)
- P1: Per-class winners breakdown
- P2: Multi-admin accounts (super-admin / observer)
- P2: Audit log of admin actions
- P2: WebSocket push for instant live results (vs 5s polling)
- P2: QR-code on declaration page linking to /results

## Credentials
See `/app/memory/test_credentials.md`.
