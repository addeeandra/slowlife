# Contributing to slowlife

Thanks for your interest in contributing. This document covers the essentials.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- Tauri v2 system dependencies — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Setup

```bash
git clone https://github.com/addeeandra/slowlife.git
cd slowlife-app
pnpm install
pnpm tauri dev
```

## Project Structure

```
slowlife-app/
  src/                    # Vue frontend
    main.ts               # app entry (async init + seed)
    App.vue               # shell layout + keyboard init
    router/index.ts       # route definitions
    core/
      db.ts               # SQLite abstraction + migrations
      types.ts            # TypeScript interfaces for all entities
      constants.ts        # tags, prompts, moods, currency formatter
      seed.ts             # first-run sample data
    composables/
      useSidebar.ts       # sidebar open/close state
      useSpaces.ts        # spaces/categories/projects tree + CRUD
      useJournal.ts       # journal entries CRUD, streak, heatmap, mood stats
      useEvents.ts        # events CRUD, date grouping
      useFinances.ts      # accounts, transactions, subscriptions
      usePinned.ts        # pinned items with resolved metadata
      useKeyboard.ts      # global ctrl+key shortcuts
    styles/tokens.css     # design tokens
    components/
      AppSidebar.vue      # sidebar with nav, space tabs, category tree
      AppFab.vue          # floating shortcut help button
      PageHeader.vue      # shared title + breadcrumb
      sidebar/            # SpaceTabs, CategoryTree, StreakFooter
      dashboard/          # NudgeCard, SignalRow, ActivityHeatmap, PinnedProjects,
                          # UpcomingEvents, SubscriptionsCard, MoodWeek, RecentEntries
      journal/            # DateBar, MoodPicker, WritingPrompt, EntryEditor, TagRow,
                          # TimelineEntry
      events/             # EventRow
      finances/           # FinanceSummary, AccountRow, SubscriptionRow, TransactionRow
    views/                # DashboardView, JournalView, EventsView, FinancesView
  src-tauri/              # Rust backend (Tauri)
    src/lib.rs            # plugin registration
    src/main.rs           # desktop entry point
    Cargo.toml            # Rust dependencies
    tauri.conf.json       # Tauri app config
    capabilities/         # permission grants
```

## Development Workflow

### Branching

- `main` — stable, release-ready
- `dev` — integration branch
- Feature branches: `feat/short-description`
- Bug fixes: `fix/short-description`

### Commit Messages

Keep them short and descriptive. Use lowercase. Focus on the "what" and "why".

```
add journal write view with mood picker
fix sidebar category collapse animation
remove unused greet command from rust backend
```

### Code Style

**Frontend (Vue + TypeScript):**
- Vue 3 `<script setup lang="ts">` composition API
- Scoped CSS — no global styles outside `tokens.css`
- Keep components small and focused
- Use design tokens from `tokens.css` — don't hardcode colors or fonts
- Composables use module-scoped refs (singleton pattern) — no Pinia
- New entity types go in `core/types.ts`, constants in `core/constants.ts`

**Backend (Rust):**
- Follow standard Rust conventions
- Keep `lib.rs` minimal — register plugins, nothing more
- Database logic belongs in the frontend via `@tauri-apps/plugin-sql`

**General:**
- No unnecessary abstractions — three similar lines > a premature helper
- No comments unless the logic is genuinely non-obvious
- No emojis in code or commit messages

## Design Principles

These are non-negotiable. Every PR should align with them.

1. **Signal over noise** — don't add metrics or UI elements that aren't actionable
2. **Offline-first** — never assume network availability
3. **Typography-first** — monospace, dense, no decoration for decoration's sake
4. **Minimal friction** — fewer clicks, fewer steps
5. **User-owned data** — everything exportable, nothing locked in

## Adding a New Feature

1. Check the [ROADMAP.md](ROADMAP.md) — is it planned?
2. If not, open an issue to discuss before building
3. Create a feature branch from `dev`
4. Implement with tests where applicable
5. Ensure `pnpm build` and `cargo check` pass
6. Open a PR against `dev`

## Adding a New Database Table

1. Add the migration in `src/core/db.ts` inside the `migrate()` function
2. Use `CREATE TABLE IF NOT EXISTS` — migrations must be idempotent
3. Add TypeScript types in `src/core/types.ts`
4. Add seed data in `src/core/seed.ts` if applicable
5. Create a composable in `src/composables/` for CRUD and derived state
6. Document the schema in your PR description

## Adding a New Component

Components are organized by feature area:

- `components/sidebar/` — sidebar sub-components
- `components/dashboard/` — dashboard cards and widgets
- `components/journal/` — journal editor and timeline components
- `components/events/` — event display components
- `components/finances/` — finance display components
- `components/` — shared components (PageHeader, AppFab, AppSidebar)

Each component should be self-contained with scoped styles. Use composables for data access — don't call `getDb()` directly from components.

## Reporting Bugs

Open an issue with:
- What you expected
- What happened
- Steps to reproduce
- OS and app version

## Questions?

Open an issue. Keep it short.
