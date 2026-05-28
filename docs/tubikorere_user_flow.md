# TUBIKORERE — USER FLOWS & PAGE MAP
## What every user sees, in order, with purpose.

---

## HOW TO READ THIS DOCUMENT

Each portal section lists:
- The user's mental model (what they think about when they open the app)
- Their pages in navigation order
- What's on each page — content, not layout
- Key actions on each page
- What they never see (scope guard)

---

## PORTAL 1 — CITIZEN
### Route prefix: /submit (no login, no portal)

**Mental model:** "I have a problem. I want someone to know about it.
I don't trust it will be fixed but I'm trying anyway."

**Entry point:** WhatsApp link, QR code posted in the village, or
word of mouth. They land directly on the submission form. No home page.
No navigation. One job.

---

### Page: /submit
**Purpose:** Report a community issue in their own words.

Content:
- App name + one-line explanation in Kinyarwanda and English
- Village selector (dropdown — only villages in the demo cell for now)
- Large free-text field — "Describe the problem / Sobanura ikibazo"
  No character limit. No categories. No severity. Just their words.
- Optional phone number field — clearly labeled as optional,
  explained as "so we can notify you when it's resolved"
- Submit button

On success — same page transforms into confirmation:
- Checkmark
- Issue reference ID (short — first 8 chars)
- What happens next: "The cell executive will review this issue.
  If you left your number, we will contact you."
- In both Kinyarwanda and English

**Actions:** Submit, (implicit) start over

**They never see:** Severity scores, other people's issues,
the dashboard, any admin interface.

---

### Page: /track/:issueId (nice to have, not MVP)
**Purpose:** Check the status of a submitted issue using the reference ID.

Content:
- Issue reference ID
- Status (plain language — not enum values. "Being reviewed",
  "Assigned to next umuganda", "Resolved on [date]")
- Village + category
- Resolution notes if resolved

**Actions:** None — read only.

---

## PORTAL 2 — VILLAGE COORDINATOR
### Route prefix: /coordinator
### Login: phone number + PIN

**Mental model:** "What do I need to do for umuganda this Saturday?
Who showed up? Did we finish the work?"

**They use this app in two moments:**
1. The day before umuganda — to see their assignment
2. Umuganda morning — to record attendance and work outcomes
The rest of the month they barely open it.

**Navigation (mobile bottom tabs):** Home · Attendance · Done

---

### Page: /coordinator/home
**Purpose:** Everything they need to know for the next umuganda.

Content:
- Their name + village name at top
- Next session date prominently
- Their group assignment for that session (if plan has been generated):
  Which issue, how many people, the task description from Claude,
  materials needed
- If no plan yet: "The cell executive hasn't generated the plan yet.
  Check back Friday."
- Their village's open issues (submitted from their village) — simple
  list, status only, not actionable here

**Actions:** Go to attendance recording

---

### Page: /coordinator/attendance
**Purpose:** Record who showed up on umuganda day. Field use, 8am,
possibly slow network.

Content:
- Session date (large, clear)
- Their village only — not other villages
- Two big number inputs: Attended / Absent
- Total auto-calculated
- Save button — large, full width, hard to miss
- Saved state is clearly shown — green confirmation, timestamp

After attendance saved, a second section appears:
- Work outcome for their assigned issue
- Dropdown: Resolved / Partially resolved / Needs more work
- Notes field
- Optional photo (camera button)
- Submit outcome button

**Actions:** Save attendance, submit work outcome, take photo

**Design note:** This page must work on a cheap Android with 3G.
Minimal JS. Save each section independently.

---

### Page: /coordinator/village
**Purpose:** Overview of their village — issues, history.

Content:
- Village name + coordinator name
- All issues ever submitted from this village, sorted by date
- Each issue shows: category, status, date, short summary
- No actions — read only

**Actions:** None — informational only.

---

## PORTAL 3 — CELL EXECUTIVE SECRETARY
### Route prefix: /exec
### Login: cell name + PIN

**Mental model:** "What are the most urgent problems in my cell?
Is umuganda prepared? Did I send the sector report?"

**They use this throughout the month:**
- Daily/weekly: check new issues, update statuses
- Thursday before last Saturday: plan umuganda
- Last Saturday afternoon: review attendance and outcomes
- Sunday after umuganda: generate and submit sector report

**Navigation (mobile bottom tabs):** Home · Issues · Umuganda · Reports · More
**Navigation (desktop sidebar):** same items + Settings at bottom

---

### Page: /exec/dashboard
**Purpose:** Instant situational awareness. What needs attention today.

Content:
- 4 stat cards: Open Issues / Critical Issues (sev 4–5) /
  Next Umuganda date / Last Report status
- Escalation alert banner (if any issues flagged requires_escalation=true):
  "X issues need sector attention" — dismissible
- Top 3 issues by severity — IssueCards, clickable
- "View all issues" link
- Upcoming umuganda card: date + days away + planning status
  (Not planned / Plan ready / In progress)
- Quick actions: Plan Umuganda, Record Attendance, Generate Report

**Actions:** Navigate to issues, navigate to planning, navigate to report

---

### Page: /exec/issues
**Purpose:** Full issue backlog. The working list.

Content:
- Filter tabs: All / Open / Assigned / Resolved / Escalated
- Count per tab
- Issue list sorted by severity DESC — IssueCards
- Each card: severity, category, village, summary, channel, time ago, status
- Issues flagged for escalation have amber indicator
- Search bar (client-side filter on summary text)
- Empty state per tab

**Actions:** Click issue to view detail, filter by tab, search

---

### Page: /exec/issues/:id
**Purpose:** Full detail on one issue. Understand it. Act on it.

Content:
- Top: severity badge (large) + status badge + category
- "Submitted [X days ago] from [Village] via [WhatsApp/Web]"
- Original text block: the exact words the citizen used —
  Kinyarwanda or English, in a blockquote-style container.
  Labeled "Original report"
- Claude analysis section:
  English summary / Severity reason / Recommended action /
  Estimated participants / If escalation flagged: escalation reason
  in an amber alert
- If assigned to a session: which session, which group
- If resolved: resolution notes + resolved date
- Activity: simple timeline — Submitted → Assigned → Resolved

**Actions:**
- Mark Resolved (opens dialog: resolution notes required)
- Escalate to Sector (opens dialog: confirm + add escalation note)
- If open: Assign to Session (select from planned sessions)

---

### Page: /exec/umuganda
**Purpose:** List of all sessions. Navigate to planning or attendance.

Content:
- Upcoming sessions (sorted soonest first)
- Past sessions (collapsed section)
- Each session: date, status badge, attendance count (if done),
  issues assigned count
- "Create new session" button

**Actions:** Create session, click session to go to detail/planning

---

### Page: /exec/umuganda/plan (or /exec/umuganda/:id/plan)
**Purpose:** The most important exec page. Plan the work session.

Content — three states:

STATE A (no session yet):
- "Next umuganda: [calculated date]"
- Form: expected participants (number input)
- Create session button

STATE B (session exists, no plan):
- Session date + expected participants
- Open issues list — all unresolved issues sorted by severity
  Each issue shows: severity, summary, estimated participants needed
  This is the input Claude will use
- "Generate Work Plan" — the primary action
  Loading state with branded animation while Claude thinks

STATE C (plan generated):
- Claude's planning notes at top (subtle, not dominant)
- Group assignment cards — AssignmentGroup components
- Unassigned issues section (if any) — with Claude's reason
- "Confirm Plan" button — saves and notifies coordinators (or just saves for demo)

**Actions:** Create session, generate plan, confirm plan

---

### Page: /exec/umuganda/:id/attendance
**Purpose:** Record attendance across all villages after umuganda.

Content:
- Session date + status
- Section 1 — Attendance by village:
  Table: village, coordinator, attended input, absent input, save per row
  Running total at bottom
- Section 2 — Work outcomes (unlocks after at least one village saved):
  Per assigned issue: what was the result?
  Dropdown + notes + optional photo per issue
- "Go to Report" button — appears after all outcomes recorded

**Actions:** Save attendance per village, record work outcomes, navigate to report

---

### Page: /exec/reports/:sessionId
**Purpose:** Generate, review, and submit the official sector report.

Content:
- Session summary at top: date, attendance total, issues addressed count
- If no report: "Generate Report" button with explanation of what
  Claude will use to write it
  Loading state: branded, ~8 seconds
- If report exists:
  Full report document — ReportDocument component
  Key achievements list
  Escalations list (if any) highlighted
  Status: Draft / Approved / Submitted
  If Draft: "Approve & Submit to Sector" button
  If Submitted: green confirmation with timestamp

**Actions:** Generate report, approve, submit

---

### Page: /exec/settings (under "More" on mobile)
**Purpose:** Cell exec profile + cell info. Minimal.

Content:
- Cell name, sector, district, province
- Executive name + phone
- Change PIN form
- Villages in this cell (list — no edit, admin does that)

**Actions:** Change PIN

---

## PORTAL 4 — SECTOR OFFICIAL
### Route prefix: /sector
### Login: sector name + PIN

**Mental model:** "Are my cells performing? What issues have been
escalated to me? Did I receive all the monthly reports?"

**They use this once a month** — primarily to review reports
submitted by cell executives and track escalations.

**Navigation (mobile tabs):** Overview · Reports · Escalations · Cells

---

### Page: /sector/overview
**Purpose:** Sector-level health at a glance.

Content:
- Sector name + district + province
- Stat cards: Total cells / Reports received this month /
  Open escalations / Total issues resolved this month
- Cell-by-cell status table:
  Cell name / Open issues / Last report status / Last umuganda date
  Color-coded rows: green (report submitted), amber (draft), red (no report)
- Escalated issues from all cells — consolidated list

**Actions:** Click cell to see cell detail (read-only), click escalation to view

---

### Page: /sector/reports
**Purpose:** All submitted reports across all cells.

Content:
- Month selector (default: current month)
- List of cells with their report status for selected month
- Click any submitted report → opens ReportDocument (read-only)
- Download/print button on report view

**Actions:** View report, print/download

---

### Page: /sector/escalations
**Purpose:** Issues that cells have flagged as needing sector intervention.

Content:
- All escalated issues from all cells, sorted by severity
- Each shows: cell, village, issue summary, escalation reason,
  how long it's been escalated
- Status: Pending / Acknowledged / Resolved at sector level

**Actions:** Acknowledge escalation, mark resolved at sector level,
add sector-level note

---

### Page: /sector/cells
**Purpose:** View cells in this sector.

Content:
- List of cells with: name, executive name, phone, village count,
  last activity date
- Click cell: read-only view of that cell's dashboard data

**Actions:** View cell (read-only) — no edit, that's admin

---

## PORTAL 5 — SYSTEM ADMIN
### Route prefix: /admin
### Login: admin credentials (not PIN — username + password)

**Mental model:** "Set up and maintain the system.
Create the Rwanda hierarchy. Manage users."

**They use this during initial setup and when things change:**
new cell exec appointed, new village created, PIN reset needed.

**Navigation (desktop sidebar — this portal is desktop-first):**
Dashboard · Hierarchy · Users · Activity

---

### Page: /admin/dashboard
**Purpose:** System health overview.

Content:
- Total counts: Provinces / Districts / Sectors / Cells / Villages / Users
- Recent activity log: last 20 actions (user created, issue submitted, etc.)
- Any system errors or anomalies

**Actions:** Navigate to management pages

---

### Page: /admin/hierarchy
**Purpose:** Manage Rwanda administrative structure.

Content:
- Cascading selector: Province → District → Sector → Cell → Village
- Select any level to see its children and edit
- Add new entity at any level
- Edit names (Kinyarwanda + English), codes
- Each cell shows: executive name, PIN (masked), village count

**Actions:**
- Add province / district / sector / cell / village
- Edit any entity's details
- Reset a cell executive's PIN
- Reset a village coordinator's PIN
- Deactivate (soft delete) any entity

---

### Page: /admin/users
**Purpose:** All users across all portals.

Content:
- Table: name, role, entity (cell name or sector name), phone,
  last login, status
- Filter by role: cell_executive / village_coordinator /
  sector_official / admin
- Create new user form

**Actions:** Create user, edit user, reset PIN/password, deactivate user

---

### Page: /admin/activity
**Purpose:** Full audit log.

Content:
- Chronological log of all significant actions in the system
- Filter by: date range, user, action type, cell/sector
- Each entry: timestamp, user, action, entity affected

**Actions:** Filter, export (CSV — nice to have)

---

## SHARED PAGES (all portals)

### /login
Single login page. Role is determined by credentials returned from backend.
On success, backend returns role + entity context.
Frontend redirects to correct portal root based on role.

### /unauthorized
If a user somehow hits a route they shouldn't.
Simple message + redirect to their correct portal.

### /not-found
404 — simple, branded.

---

## PAGE COUNT SUMMARY

| Portal | Pages | Priority |
|---|---|---|
| Citizen | 1 (+ 1 nice-to-have) | P0 — demo critical |
| Village Coordinator | 3 | P1 — demo important |
| Cell Executive | 7 | P0 — demo critical |
| Sector Official | 4 | P2 — show exists |
| System Admin | 4 | P2 — show exists |
| Shared | 3 | P0 |

**Total: 22 pages across 5 portals**

Build order: Citizen → Cell Exec → Coordinator → Sector → Admin