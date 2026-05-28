# TUBYIKORERE — SHADCN DESIGN SYSTEM (REMAKE)

This document replaces the previous design-system spec.
It is now the source of truth for the **Shadcn-first** UI architecture currently implemented in `apps/web`.

---

## 1) System Principles

- **Shadcn-native first**: use Shadcn primitives/components as the base; extend with thin, typed wrappers only when needed.
- **Serious utility UI**: clear hierarchy, restrained color use, no decorative noise.
- **Mobile-first**: design at `375px` first, then scale up.
- **Reusable by composition**: build features by composing atoms + molecules + shell components, not one-off page markup.
- **Token-driven customization**: visual changes should come from CSS variables and config maps, not hardcoded styles in feature screens.

---

## 2) Foundations

### 2.1 Typography

- Display/headings: `DM Sans`
- Body/UI: `Inter`
- Mono: `JetBrains Mono`

### 2.2 Radius + spacing

- Base radius token: `--radius: 0.625rem`
- Supplemental tokens:
  - `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`
- Spacing follows 4px increments.

### 2.3 Color and surface model (current)

Defined in `apps/web/src/index.css`.

- **Page background**: warm off-white (`--background`)
- **Panels/surfaces**: unified `--card` for navbar, sidebar, and cards
- **Popups**: `--popover` (solid, not transparent)
- **Sidebar tokens** are intentionally mapped to card/foreground tokens for consistency:
  - `--sidebar: var(--card)`
  - `--sidebar-foreground: var(--card-foreground)`
  - `--sidebar-border: var(--border)`
  - `--sidebar-accent: var(--muted)`

This avoids mismatched panel colors between sidebar, top bar, and cards.

### 2.4 Theme mode behavior

- Uses `next-themes` with `.dark` class mode.
- Light and dark tokens are explicitly defined in `index.css`.
- Theme toggle is available in `AppNavbar`.

---

## 3) Architecture

### 3.1 Design-system entry points

- `@/components/ds` → exports atoms + molecules
- `@/components/molecules` → reusable layout and composite components
- `@/lib/config/*` → severity/status/category config maps
- `@/lib/types/*` → typed contracts for reusable UI data

### 3.2 App shell pattern (required)

Use the shell stack for portal pages:

1. `AppShell` (layout container)
2. `AppSidebar` (navigation panel)
3. `AppNavbar` (top navigation bar)
4. Page content (`PageHeader` + composed sections)

Avoid directly wiring raw `SidebarProvider`/`SidebarInset` in feature pages unless there is a strong reason.

---

## 4) Reusable Components (Current)

## Atoms

- `SeverityBadge`
- `StatusBadge`
- `CategoryChip`
- `ChannelIcon`
- `LoadingSpinner`
- `EmptyState`

## Molecules

- `TrendBadge`
- `StatCard`, `StatCardGrid`
- `IssueCard`, `IssueCardList`
- `AssignmentGroup`
- `PageHeader`
- `AppNavbar`
- `AppSidebar`
- `AppShell`

All are intended to be reusable and prop-driven.

---

## 5) Navigation System (Current Contract)

### `AppSidebar`

`AppSidebar` accepts structured props:

- `brand`
- `user`
- `navItems`
- `navLabel`
- optional `footer`

Navigation data types live in:

- `apps/web/src/lib/types/nav.ts`

Demo nav data lives in:

- `apps/web/src/lib/demo-nav.ts`

### Active/hover behavior

- Default links are transparent.
- Background appears only:
  - on hover (subtle accent)
  - on explicitly active item (`isActive`)
- Avoid always-on link pills for non-active links.

---

## 6) Component Behavior Rules

### Stat cards

- Must remain responsive via container queries.
- Prefer data display only; action controls belong in navbar/header/section actions.

### Issue cards

- Severity strip on left.
- Metadata line uses subtle typography.
- Escalation state is explicit but restrained.

### Navbar

- Sticky top bar with:
  - sidebar trigger
  - breadcrumbs
  - optional notifications
  - theme toggle
  - contextual actions slot

### Popups / overlays

- Dialog/sheet/dropdown/select surfaces must use `bg-popover` (solid).
- No transparent popups against page background.

---

## 7) Page Composition Template

Feature pages should follow:

1. `<AppShell ...>`
2. `<PageHeader ... />`
3. Main content wrapper (`@container/main`)
4. Sections composed from DS molecules

Do not build standalone page-specific nav variants when `AppShell` + `AppNavbar` + `AppSidebar` already satisfy the need.

---

## 8) Migration Rules (from old spec)

- Do not reintroduce custom visual systems that diverge from Shadcn tokens.
- Do not create one-off dashboard blocks with hardcoded style values.
- Prefer updating token/config maps over editing many component class strings.
- Keep docs synced with implemented components and tokens; this file must reflect reality in code.

---

## 9) Canonical Files

- `apps/web/src/index.css`
- `apps/web/src/components/molecules/AppShell.tsx`
- `apps/web/src/components/molecules/AppSidebar.tsx`
- `apps/web/src/components/molecules/AppNavbar.tsx`
- `apps/web/src/components/molecules/PageHeader.tsx`
- `apps/web/src/components/molecules/StatCard.tsx`
- `apps/web/src/components/molecules/IssueCard.tsx`
- `apps/web/src/lib/config/severity.ts`
- `apps/web/src/lib/config/status.ts`
- `apps/web/src/lib/config/categories.ts`
- `apps/web/src/lib/types/nav.ts`

If this document and code differ, update this document immediately after code is stabilized.

