# TUBIKORERE — AI AGENT BUILD BRIEF
## Claude Builder Club Hackathon · Social Impact Track · Governance & Collaboration

> **This document is the single source of truth for building Tubikorere.**
> Read it fully before writing a single line. Every decision here has a reason.

---

## WHAT WE ARE BUILDING AND WHY

Tubikorere (Kinyarwanda: "Let's handle it together") is an AI-powered community governance platform that connects two things in Rwanda that have never been connected:

1. **Community issue reporting** — citizens submit problems (broken roads, water outages, collapsing walls). Currently this happens verbally or in notebooks that get lost.
2. **Umuganda** — Rwanda's mandatory monthly community work day (last Saturday of every month, 8am–11am, 18–65 year-olds). Currently workers show up with no organized task list.

**The loop we are closing:** citizen reports a problem → Claude scores its severity → it gets assigned to the next umuganda session → workers fix it → sector gets an AI-generated report. Right now these are completely disconnected systems. We connect them.

**Primary user:** Cell Executive Secretary. Manages 5–10 villages. Does everything on paper today.
**Secondary user:** Village Coordinator. Takes attendance, organizes workers on umuganda day.
**End beneficiary:** The citizen whose problem actually gets fixed.

---

## RWANDA ADMINISTRATIVE HIERARCHY — UNDERSTAND THIS DEEPLY

Rwanda has a precise 6-level hierarchy. The database must reflect all of it. Do not flatten or simplify.

```
National
  └── Province         (5 total: Kigali City + Northern + Southern + Eastern + Western)
        └── District   (30 total across all provinces)
              └── Sector / Umurenge    (416 total)
                    └── Cell / Utugarri (2,148 total)
                          └── Village / Umudugudu (14,837 total)
```

- **Province** is the top administrative division. Kigali City is a province (not a city in the western sense).
- **District** is where most government services are coordinated.
- **Sector** receives the umuganda reports we are generating.
- **Cell** is our primary operational unit. The Cell Executive Secretary is our primary user.
- **Village** is where citizens live. The Village Coordinator organizes umuganda at this level.

Every user, every issue, every session ties back into this hierarchy. The DB schema must support querying issues by village, cell, sector, district, or province.

---

## TECH STACK — FINAL DECISIONS

These are not suggestions. Use exactly these.

### Frontend
| Package | Version | Why |
|---|---|---|
| React | 19.2.6 | Latest stable |
| Vite | 8.0.14 | Build tool |
| React Router | 7.15.1 | Routing (v7, file-based optional) |
| TailwindCSS | 4.3.0 | v4 — CSS-first, no tailwind.config.js |
| shadcn/ui | latest via CLI | Component system — speeds up UI dramatically |
| Zustand | 5.0.13 | Minimal global state (auth + cell context) |
| TanStack Query | 5.100.14 | Server state, caching, loading states |
| React Hook Form | 7.76.1 | All forms |
| Zod | 4.4.3 | Schema validation (shared with backend) |
| Lucide React | 1.16.0 | Icons (shadcn default) |
| Axios | 1.16.1 | HTTP client |
| date-fns | 4.3.0 | Date formatting |

### Backend
| Package | Version | Why |
|---|---|---|
| Hono | 4.12.23 | Modern, fast, lightweight Express alternative. Edge-ready. Better DX than Express 5. |
| Drizzle ORM | 0.45.2 | Type-safe ORM. Works perfectly with Supabase/Postgres. Much lighter than Prisma. Fast to set up. |
| Drizzle Kit | 0.31.10 | Migrations and schema push |
| postgres | 3.4.9 | Postgres driver for Drizzle |
| @supabase/supabase-js | 2.106.2 | Storage + realtime (not for queries — Drizzle handles those) |
| @anthropic-ai/sdk | 0.99.0 | Claude API |
| Zod | 4.4.3 | Request validation (same schemas as frontend) |
| Twilio | 6.0.2 | WhatsApp webhook |
| dotenv | latest | Env vars |

### Why Hono over Express?
Hono is significantly faster to write, has built-in TypeScript, cleaner middleware API, and runs on any runtime. No configuration overhead. For a hackathon, it means less boilerplate code.

### Why Drizzle over Prisma?
Drizzle is leaner, sets up in minutes (not 15 minutes like Prisma), and the schema lives in TypeScript files that read almost like SQL. For Supabase/Postgres specifically, it's the fastest path to type-safe queries.

### Why TanStack Query?
Replaces manual `useEffect` + `useState` loading patterns entirely. One hook gives you loading states, error states, caching, and refetching. Critical for the dashboard that needs live issue counts.

### Infrastructure
| Service | Purpose | Note |
|---|---|---|
| Supabase | Postgres database + file storage (issue photos) | Use connection string for Drizzle, not Supabase client for queries |
| Vercel | Frontend | Auto-deploys from GitHub |
| Railway | Backend (Hono server) | $5 free credit, instant deploy |
| Twilio | WhatsApp sandbox | Set up sandbox first — takes 10 min |

---

## PROJECT STRUCTURE

```
tubikorere/
├── apps/
│   ├── web/                         # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── routes/              # React Router v7 route files
│   │   │   │   ├── _layout.tsx      # Root layout with nav
│   │   │   │   ├── index.tsx        # Redirects to /dashboard or /login
│   │   │   │   ├── login.tsx
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── issues.tsx
│   │   │   │   ├── issues.$id.tsx   # Issue detail
│   │   │   │   ├── umuganda.tsx     # Session list
│   │   │   │   ├── umuganda.plan.tsx
│   │   │   │   ├── umuganda.$id.attendance.tsx
│   │   │   │   ├── reports.$id.tsx
│   │   │   │   └── submit.tsx       # Public — no auth
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn/ui components live here
│   │   │   │   ├── SeverityBadge.tsx
│   │   │   │   ├── IssueCard.tsx
│   │   │   │   ├── AssignmentGroup.tsx
│   │   │   │   └── ReportDocument.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api.ts           # Axios instance
│   │   │   │   ├── utils.ts         # cn() + helpers
│   │   │   │   └── store.ts         # Zustand: auth + cell context
│   │   │   ├── hooks/
│   │   │   │   ├── useIssues.ts     # TanStack Query hooks
│   │   │   │   ├── useSession.ts
│   │   │   │   └── useReport.ts
│   │   │   └── main.tsx
│   │   ├── components.json          # shadcn config
│   │   ├── index.html
│   │   └── package.json
│   │
│   └── api/                         # Hono backend
│       ├── src/
│       │   ├── index.ts             # Hono app entry, route mounting
│       │   ├── db/
│       │   │   ├── schema.ts        # Drizzle schema (all tables)
│       │   │   ├── client.ts        # Drizzle + postgres connection
│       │   │   └── seed.ts          # Demo data seeding script
│       │   ├── routes/
│       │   │   ├── auth.ts          # POST /auth/login
│       │   │   ├── issues.ts        # CRUD + Claude scoring
│       │   │   ├── umuganda.ts      # Sessions + Claude planning
│       │   │   ├── attendance.ts    # Recording + work completions
│       │   │   ├── reports.ts       # Claude report generation
│       │   │   └── webhook.ts       # Twilio WhatsApp
│       │   ├── services/
│       │   │   ├── claude.ts        # ALL Claude API calls in one file
│       │   │   └── twilio.ts        # SMS/WhatsApp send helper
│       │   └── middleware/
│       │       └── auth.ts          # Cell PIN header check
│       ├── drizzle.config.ts        # Drizzle Kit config
│       └── package.json
│
├── packages/
│   └── shared/                      # Shared Zod schemas + types
│       ├── schemas/
│       │   ├── issue.ts
│       │   ├── session.ts
│       │   └── report.ts
│       └── package.json
│
└── package.json                     # Workspace root (pnpm workspaces)
```

Use **pnpm workspaces** as the monorepo manager. This lets the frontend import from `@tubikorere/shared` and the backend also import from `@tubikorere/shared` — no duplicated Zod schemas.

---

## DATABASE SCHEMA — DRIZZLE ORM

The schema is the most important architectural piece. It must reflect Rwanda's full 6-level hierarchy. The agent should define this in `apps/api/src/db/schema.ts` as Drizzle table definitions.

### Hierarchy tables (read-only reference data)

**provinces** — Rwanda's 5 provinces. Populated once from seed data.
- Fields: id, name, name_kinyarwanda, code

**districts** — 30 districts. Each belongs to a province.
- Fields: id, province_id (FK → provinces), name, name_kinyarwanda, code

**sectors** — 416 imirenge. Each belongs to a district. This is where reports get submitted.
- Fields: id, district_id (FK → districts), name, name_kinyarwanda, code

**cells** — 2,148 utugari. Each belongs to a sector. This is our operational unit.
- Fields: id, sector_id (FK → sectors), name, name_kinyarwanda, executive_name, executive_phone, pin (plain text for demo — note in comments that production would hash this), created_at

**villages** — 14,837 imidugudu. Each belongs to a cell.
- Fields: id, cell_id (FK → cells), name, name_kinyarwanda, coordinator_name, coordinator_phone, created_at

### Application tables

**issues** — The core table. Every community problem submitted.
- id (uuid, pk)
- cell_id (FK → cells) — which cell this issue belongs to
- village_id (FK → villages, nullable) — which village if specified
- raw_text (text) — the exact original text the citizen submitted, never modified
- submission_channel (enum: 'web' | 'whatsapp') — how it came in
- submitter_phone (text, nullable) — optional, anonymous allowed
- language_detected (text, nullable) — 'kinyarwanda' | 'english' | 'mixed' — Claude detects this
- category (enum: 'infrastructure' | 'water' | 'health' | 'education' | 'environment' | 'safety' | 'other')
- severity (integer 1–5) — Claude's score
- severity_reason (text) — Claude's one-sentence justification
- summary (text) — Claude's English summary for officials who may not read Kinyarwanda
- recommended_action (text) — Claude's suggested resolution approach
- estimated_participants (integer) — Claude's estimate of umuganda workers needed
- requires_escalation (boolean) — Claude flags if this needs sector-level intervention, not just umuganda
- escalation_reason (text, nullable) — Claude's reason if requires_escalation = true
- status (enum: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'escalated' | 'closed')
- umuganda_session_id (FK → umuganda_sessions, nullable) — set when assigned to a session
- resolution_notes (text, nullable) — notes after completion
- photo_url (text, nullable) — Supabase storage URL if photo submitted
- created_at, updated_at

**umuganda_sessions** — Each monthly work session.
- id (uuid, pk)
- cell_id (FK → cells)
- session_date (date) — always the last Saturday of a month
- expected_participants (integer) — entered by cell exec during planning
- actual_participants (integer, nullable) — calculated from attendance records
- status (enum: 'planned' | 'active' | 'completed')
- planning_notes (text, nullable) — Claude's overall planning notes
- created_at, updated_at

**session_assignments** — Claude's group assignment plan for a session (separate table, not JSONB).
- id (uuid, pk)
- session_id (FK → umuganda_sessions)
- issue_id (FK → issues)
- group_name (text) — "Group A", "Group B", etc.
- assigned_participants (integer)
- estimated_hours (decimal)
- task_description (text) — Claude's detailed task instructions for the coordinator
- materials_needed (text, nullable)
- display_order (integer) — for rendering groups in priority order

**attendance_records** — Per-village attendance on umuganda day.
- id (uuid, pk)
- session_id (FK → umuganda_sessions)
- village_id (FK → villages)
- attended (integer)
- absent (integer)
- recorded_by (text) — name of coordinator who recorded
- recorded_at (timestamp)

**work_completions** — What actually got done for each assigned issue.
- id (uuid, pk)
- session_id (FK → umuganda_sessions)
- issue_id (FK → issues)
- completion_status (enum: 'resolved' | 'partial' | 'escalated')
- completion_notes (text)
- photo_url (text, nullable)
- recorded_at (timestamp)

**sector_reports** — Claude-generated monthly reports.
- id (uuid, pk)
- session_id (FK → umuganda_sessions, unique) — one report per session
- cell_id (FK → cells)
- report_text (text) — full report, formal Rwandan government style
- key_achievements (text array) — bullet points Claude extracted
- escalations (text array) — issues needing sector follow-up
- attendance_rate (decimal) — calculated percentage
- status (enum: 'draft' | 'approved' | 'submitted')
- generated_at, approved_at (nullable), submitted_at (nullable)

### Key relationships for querying
The agent should set up Drizzle relations so that a query for "all issues in Kimironko Cell" can also resolve village name, and a query for "all sessions in Gasabo District" traverses cell → sector → district correctly.

---

## CLAUDE INTEGRATION — 4 DISTINCT USE CASES

This section defines what Claude does, what inputs it receives, and what structure it must return. The agent building `services/claude.ts` must implement exactly these 4 functions. All 4 use the model `claude-sonnet-4-20250514`.

### 1. scoreIssue(rawText: string, context: { cellName, sectorName })

Called when any issue is submitted (web or WhatsApp). Receives raw citizen text which may be Kinyarwanda, English, or mixed.

**Returns:** category, severity (1–5), severity_reason, summary (English), recommended_action, estimated_participants, requires_escalation (boolean), escalation_reason, language_detected

**Important prompt context to give Claude:**
- Tell it this is Rwanda's community governance system
- Give it the severity rubric (5 = safety risk, 4 = major life impact, 3 = significant inconvenience, 2 = minor, 1 = cosmetic)
- Tell it to respond ONLY in valid JSON, no markdown, no preamble
- Tell it Kinyarwanda is expected and it should process it correctly

### 2. planUmugandaSession(issues: Issue[], expectedParticipants: number, sessionDate: string)

Called when cell exec clicks "Generate Work Plan" on the planning page. Receives the full list of open issues for this cell (already scored by Claude from step 1), plus the expected participant count.

**Returns:** An array of group assignments, each with group_name, issue reference, participant_count, estimated_hours, task_description (detailed instructions for the coordinator, not vague), materials_needed, display_order. Also returns planning_notes (overall advice) and a list of any issues that could NOT be assigned this session with reasons.

**Important prompt context:**
- Prioritize strictly by severity (5 first)
- Each group needs at minimum 20 participants to be useful
- Task descriptions should be actionable, specific, written for a village coordinator (not an engineer)
- Unassigned issues should have clear reasons (not enough people, needs sector intervention, etc.)

### 3. generateReport(sessionData: FullSessionData)

Called after umuganda day is done and attendance + work completions are recorded. Receives all session data assembled from the DB.

**Input data to assemble before calling:** session details, cell + sector + district info, attendance per village with totals, each work completion with the original issue summary and outcome, any escalations flagged.

**Returns:** report_text (full formal report, 350–450 words, Rwandan government official style), key_achievements (array of strings), escalations (array of strings needing sector follow-up), attendance_rate.

**Important prompt context:**
- The report is addressed to the Sector Executive Secretary
- Tone is formal Rwandan government — factual, respectful, structured
- Format: Opening paragraph → Attendance → Work Completed → Outstanding Issues → Escalations → Closing
- Should feel like a real government document, not a chatbot summary

### 4. detectPatterns(recentIssues: Issue[]) — Nice to have

Called on the dashboard to analyze issue patterns across the last 30 days. If 4+ issues in the same category from the same or neighboring villages, Claude flags a systemic issue.

**Returns:** patterns array (each with description, affected villages, recommended escalation level, severity_assessment) or empty array if no patterns.

---

## AUTHENTICATION

Keep it simple. No JWT. No sessions. Cell Executive logs in with their cell name + 4-digit PIN. On success, the backend returns the full cell object (with its id, name, sector, district, and resolved province). Frontend stores this in Zustand and also persists to localStorage so refresh doesn't log them out.

The PIN comparison for the hackathon demo can be plain text. Add a comment in the code noting that production would use bcrypt.

All API routes (except `/webhook/whatsapp` and `POST /issues` which is the public submission) should check for a `x-cell-id` header. Middleware reads this, verifies the cell exists in DB, attaches the cell object to the request context.

---

## UI — DESIGN DIRECTION FOR shadcn/ui

Initialize shadcn with `npx shadcn@latest init --template vite`. Use the **nova** preset (latest default, Base UI primitives, Tailwind v4).

### Color theme: Rwanda green + amber
Override the CSS variables in the global CSS file with:
- Primary: a deep forest green (#1B5E20 family in OKLCH) — Rwanda's landscape, the green on the flag
- Accent: warm amber/gold — the yellow on the Rwanda flag, urgency without alarm
- Destructive (severity 5): standard red
- Background: warm off-white, not pure white — feels more like paper/field report

### shadcn components to install immediately
The agent should install these in one batch at project setup:
`button`, `card`, `badge`, `input`, `textarea`, `select`, `table`, `dialog`, `sheet`, `tabs`, `toast`, `skeleton`, `separator`, `label`, `form`, `avatar`, `progress`, `alert`, `dropdown-menu`

### Severity badge system
This is used throughout the entire app. Build it as a reusable `SeverityBadge` component that takes a severity number (1–5) and returns a colored badge with the right label:
- 5: Red · "Critical"
- 4: Orange · "High"  
- 3: Amber · "Medium"
- 2: Green · "Low"
- 1: Muted grey · "Minimal"

---

## PAGES — WHAT EACH ONE DOES

### Public pages (no auth)

**`/submit`** — Citizen issue submission. Large, simple form. Mobile-first (citizens use phones). A big textarea for the problem description in Kinyarwanda or English. Optional phone number. Village selector dropdown populated from DB. Submit button. On success, show a confirmation with the issue ID and a short message in both English and Kinyarwanda telling them it was received.

### Authenticated pages (cell exec)

**`/login`** — Cell name input + 4-digit PIN. Clean, branded. On success stores cell context to Zustand + localStorage, redirects to dashboard.

**`/dashboard`** — Overview. Four stat cards at top: Open Issues count, Critical Issues (severity 4–5) count, Next Umuganda date, Last Report status. Below: top 3 issues by severity (cards, clickable). Quick action buttons: Plan Umuganda, Record Attendance, Generate Report. If patterns were detected by Claude, show a yellow alert banner at top.

**`/issues`** — Full issue list with filter tabs (All / Open / Assigned / Resolved / Escalated). Each row or card shows: severity badge, category, village, summary, date, status. Click to expand inline or navigate to detail. Bulk actions not needed for demo. The list is sorted server-side by severity descending, then date.

**`/issues/:id`** — Issue detail. Shows: original raw text (the exact Kinyarwanda/English the citizen submitted), Claude's full analysis, current status, which session it was assigned to (if any), resolution notes. "Mark Resolved" and "Escalate to Sector" action buttons.

**`/umuganda`** — Session list. Simple. Shows past and upcoming sessions with their status badges. Button to create a new session (enter date + expected participants).

**`/umuganda/plan`** — The planning page. This is the most important interactive page. Shows: expected participants entered, all open issues listed by severity. Big "Generate AI Work Plan" button. On click, shows a loading state for 3–5 seconds with "Claude is planning your session..." text. Then renders the group assignment cards. Each card shows the group letter, participant count, assigned issue summary, severity, task description, materials. A "Confirm Plan" button saves the assignments to DB and marks issues as "assigned."

**`/umuganda/:id/attendance`** — Attendance recording for a specific session. Table with one row per village. Each row: village name, coordinator name, number attended input, number absent input, save row button. Below the table: work completion section. For each assigned issue, a dropdown (Resolved / Partial / Escalated) + notes textarea. One "Save All" button at bottom.

**`/reports/:sessionId`** — Report page. If no report generated yet: "Generate Report" button, shows what data will be included (attendance summary, issues addressed). On click: loading state "Claude is writing the sector report..." (5–8 seconds). Then: renders the formatted report text in a clean document-like layout. Key achievements listed separately. Escalations highlighted. "Approve & Submit to Sector" button changes status to submitted and shows a timestamp.

---

## WHATSAPP FLOW

The Twilio webhook receives a POST to `/webhook/whatsapp`. The body contains the message text (in the `Body` field) and the sender's phone number (in `From`).

The webhook handler must respond to Twilio within 5 seconds or Twilio will timeout. So the flow is: parse → call Claude for scoring → save to DB → build Twilio TwiML response → send reply to citizen — all within 5 seconds. Claude scoring is the bottleneck; it typically takes 1–3 seconds.

For the demo, hardcode the `cell_id` to the seeded demo cell (Kimironko Cell). In production, you would route by the registered phone number or a keyword prefix.

The WhatsApp reply to the citizen should be in Kinyarwanda. Something like:
"✅ Murakoze! Ikibazo cyanyu cyakiriwe. / Thank you! Your issue was received.
📋 ID: [first 8 chars of UUID]
⚠️ Agaciro: [severity]/5
Tuzakurikirana ibisubizo."

---

## SEED DATA FOR DEMO

The seed script should populate realistic Rwanda data. Use actual geography:

**Province:** Kigali City
**District:** Gasabo
**Sector:** Kimironko
**Cell:** Kimironko Cell (this is the demo login cell, PIN: 1234, Executive: Uwimana Jean Pierre)
**Villages (3):** Rugarama, Kibagabaga, Nyarutarama

Pre-seed 5 issues with realistic Kinyarwanda text already scored by Claude (hardcode the Claude output — don't call the API during seeding):
1. Severity 5 · Infrastructure · Road to school floods
2. Severity 4 · Water · 12 households lost water access  
3. Severity 4 · Infrastructure · Crumbling school wall
4. Severity 3 · Environment · Market waste dump overflowing
5. Severity 3 · Infrastructure · Road eroded 20 meters in Kibagabaga

Pre-seed 1 planned umuganda session for the upcoming last Saturday of the current month.

---

## BUILD ORDER FOR THE AGENT

Do these in strict order. Each phase is independently testable.

**Phase 0 — Setup (no code yet)**
Create Supabase project → copy connection string. Get Anthropic API key → test with a quick curl. Set up Twilio WhatsApp sandbox → note the sandbox number. Initialize the pnpm monorepo → create both apps.

**Phase 1 — Database**
Write the full Drizzle schema. Push to Supabase with `drizzle-kit push`. Run the seed script. Verify data in Supabase table editor before proceeding.

**Phase 2 — Backend Core**
Set up Hono server with CORS, health endpoint. Connect Drizzle. Build `services/claude.ts` with all 4 functions. Build `/api/issues` route (GET list + POST create with Claude scoring). Test: submit an issue via curl and verify it appears in DB with Claude's severity score.

**Phase 3 — The Demo Loop (this is what judges see)**
Build umuganda planning route + Claude planner. Build frontend: Login → Dashboard → Issues → Umuganda Planning → group assignments display. When this works end-to-end, take a backup recording. This is your minimum viable demo.

**Phase 4 — Attendance + Reports**
Attendance recording routes and page. Work completion recording. Report generation route + page. Test the full post-umuganda flow.

**Phase 5 — WhatsApp**
Build webhook. Deploy backend to Railway first (need public URL for Twilio). Configure Twilio webhook URL. Test with actual phone.

**Phase 6 — Deploy + Polish**
Deploy frontend to Vercel. Fix any production environment issues (CORS URL, env vars). Run through the full demo end-to-end in production. Fix issues. Record backup video.

---

## WHAT NOT TO BUILD

Hard stops. Do not build these for the demo.
- Multi-cell / multi-district support in the UI (DB supports it, UI doesn't need to)
- Complex role-based access (executive vs coordinator distinction is fine to ignore)
- Historical analytics / charts
- Fine/penalty tracking for absent umuganda participants
- Real Twilio production numbers (sandbox is sufficient)
- Offline support
- Push notifications
- Anything requiring government API integration

---

## COMMON FAILURE POINTS — GUARD AGAINST THESE

**Claude returns non-JSON:** Always tell Claude in the prompt "respond with valid JSON only, no markdown code blocks, no explanation text." Wrap every JSON.parse in try/catch. Have a fallback object ready (severity: 3, category: 'other', etc.) so a failed Claude call doesn't crash the issue submission.

**Drizzle schema drift:** If you change the schema, always run `drizzle-kit push` again. Don't manually edit Supabase tables after the first push.

**Twilio webhook timeout:** Claude scoring must complete within 4 seconds. If worried, score asynchronously — respond to Twilio first with "received, processing..." then score and update the record. A second message can be sent via `client.messages.create()` after scoring.

**Supabase storage for photos:** Use Supabase Storage (not the DB) for photo uploads. The `photo_url` field in the schema stores the public URL after upload.

**shadcn Tailwind v4 difference:** Tailwind v4 has no `tailwind.config.js`. Configuration is entirely in the global CSS file using `@theme`. Do not try to create a tailwind config file.

**TanStack Query invalidation:** After submitting an issue or recording attendance, invalidate the relevant query keys so the dashboard updates without a manual refresh.

---

## THE DEMO PITCH (For Context — Agent Does Not Need to Build This)

Opening: "In Rwanda, a citizen reports a broken bridge near a school. The cell executive writes it in a notebook. Three months later, the notebook is lost. The bridge is still broken. Children are still crossing a river every morning. This is not because nobody cared. It is because there was no system connecting that report to the 180 people who show up every last Saturday ready to work."

What we built: "Tubikorere — Let's handle it together. Citizens report in Kinyarwanda. Claude scores severity. The most critical issues get assigned to the next umuganda session. Claude generates the sector report. The loop closes. The bridge gets fixed."

Why it matters: "14,837 villages. Every one with the same broken notebook. Umuganda has contributed $60 million to Rwanda's development since 2007 — but it operates blind. Tubikorere gives it eyes."

---

*Hamwe tuzabasha — Together we can do it.*