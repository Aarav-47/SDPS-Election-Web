# SDPS Student Council Election — PRD

## Original Problem Statement
Build a school student council election web app for SDPS. Students/teachers authenticate by school ID, confirm identity, vote sequentially across multiple posts (Head Boy, Head Girl, Sports Skipper, Cultural Head, Discipline Head). Show Thank You + "Next student to vote" button. Admin (private credentials) sees stats by category, individual voters, highest votes. Theme: white + royal blue + gold, 3D gradient style. Local database. Admin can manage candidates (name, photo, election symbol), upload student/teacher Excel, reset stats, upload school logo, fully manage categories.

## Architecture
- **Backend**: FastAPI + MongoDB (async motor), JWT for admin auth (12-hour tokens), bcrypt for password, openpyxl for Excel parsing & template generation.
- **Frontend**: React 19 + react-router-dom 7 + Tailwind + Shadcn UI + Recharts + Sonner toasts. Custom 3D-gradient kiosk theme (royal blue + gold), glassmorphic candidate cards, confetti on Thank You.

## User Personas
1. **Student / Teacher voter** — uses kiosk to cast a single ballot covering all active categories.
2. **Election admin (Aarav)** — manages categories, candidates, voter rolls (Excel upload), monitors live stats, resets the system between mock + real elections, brands the kiosk with school logo.

## Implemented (date: 2026-02-08)
- **Kiosk flow**: Auth (role toggle Student/Teacher with prefilled prefixes SDPSS / SDPSE) → Confirm identity (role-aware: students show father's name + class, teachers show subject + designation) → Sequential voting across N posts → Thank You with confetti and "Next Student to Vote" CTA.
- **Backend endpoints** (`/api`):
  - Public: `GET /posts`, `GET /settings`, `GET /users/{adm}`, `GET /candidates?post=`, `POST /votes`
  - Admin (JWT): `POST /admin/login`, `GET/POST/PUT/DELETE /admin/posts`, `GET/POST/PUT/DELETE /admin/candidates`, `GET /admin/users`, `POST /admin/users/upload?role=`, `DELETE /admin/users/{adm}`, `GET /admin/template/{role}`, `GET/PUT /admin/settings`, `POST /admin/reset/votes`, `POST /admin/reset/all`, `GET /admin/stats`
- **Admin dashboard** (8 tabs): Overview (turnout pie + leaders), Results (per-post bar charts), Voters (audit table), Candidates (CRUD with photo URL or upload), Categories (full CRUD; delete blocked when votes exist), Students, Teachers (Excel upload + sample template download), Settings (school logo + Reset Votes / Reset All danger zone).
- **Theme**: Gradient white/blue/gold, 3D drop-shadow text for readability, glass cards with gold ring on selection, floating blurred orbs, confetti.
- **Seed data**: 8 students (SDPSS001-008), 3 teachers (SDPSE01-03), 5 default categories, 4 candidates per category, admin Aarav/Krish@2026.

## Test Status
- iteration_1: backend 16/16 ✓, kiosk + admin E2E ✓
- iteration_2: backend 20/20 ✓, kiosk student+teacher E2E ✓, all 8 admin tabs ✓, categories CRUD ✓, reset endpoints ✓

## Backlog (P0/P1/P2)
- P1: Per-class vote breakdown chart (turnout by class)
- P1: Real-time live results screen (auto-refresh)
- P2: Print-friendly results page for declaration ceremony
- P2: Multiple admin accounts + role separation (super-admin / observer)
- P2: Audit log of admin actions
- P2: Lock/unlock voting window (election open/closed switch)

## Known Limitations
- Photos stored as base64 in MongoDB when uploaded locally (≤1.5 MB) — fine for ~50 candidates; for larger scale switch to object storage.
- Category `key` is auto-slugified from title; renaming title doesn't change key (intentional, preserves vote integrity).
- Reset All preserves posts + admin only; candidates/users must be re-uploaded.

## Credentials
See `/app/memory/test_credentials.md`.
