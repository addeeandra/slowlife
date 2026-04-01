# Roadmap

This is the complete roadmap for slowlife, organized by phase. Each phase builds on the previous one. Items are roughly ordered by priority within each phase.

---

## Phase 1 — Foundation ✓

Migrate the validated prototype into a real application.

- [x] Migrate design tokens (colors, typography, spacing) from prototype
- [x] Build sidebar component with full navigation tree
- [x] Build dashboard view with grid layout
- [x] Build journal write view (editor, mood picker, prompts, tags)
- [x] Build journal timeline view
- [x] Build events view
- [x] Build finances view (accounts, subscriptions, transactions)
- [x] SQLite schema and migrations (journal_entries, events, accounts, transactions, subscriptions, spaces, categories, projects, pinned)
- [x] CRUD operations for all entities
- [x] Keyboard shortcuts (Ctrl+1/2/3, Ctrl+N, Ctrl+S)
- [x] Floating shortcut help panel
- [x] Breadcrumb navigation with clickable segments
- [x] Activity heatmap (20-week contribution grid)
- [x] Signal cards on dashboard (streak, weekly activity, mood, net worth, sub burn)
- [x] Pinned projects on dashboard with last-entry and weekly signals
- [x] Mood trend (7-day visual)
- [x] Quiet-day nudge (time-aware prompt when no entries today)
- [x] Add/remove categories and projects from sidebar
- [x] Context-aware writing prompts (casual vs work)
- [x] Context-aware tag sets (casual vs work)
- [x] Word count in editor
- [x] Entry saved feedback
- [x] First-run seed data (spaces, categories, projects, events, accounts, subscriptions, transactions)
- [x] Mobile-responsive sidebar (overlay + toggle on small screens)

## Phase 2 — Core Experience

Polish the daily-use experience. Make it feel right.

- [x] Pin/unpin projects from the sidebar (CategoryTree)
- [x] Edit/delete journal entries (inline on timeline)
- [x] Edit/delete categories and projects from sidebar (inline, with confirm)
- [x] Drag-to-reorder pinned projects (dashboard, sortable + persistence)
- [x] Smooth animations and transitions (centralized tokens)

## Phase 3 — Quick Capture

Reduce friction for capturing thoughts.

- [x] Global quick capture shortcut (system-wide, even when app is minimized)
- [x] Quick capture modal — write, pick space/category, save, dismiss
- [x] System tray icon with quick capture trigger
- [x] Auto-focus editor on capture

## Phase 4 — Events & Calendar

Build out the events system into a proper calendar.

- [x] Calendar month view
- [x] Calendar week view
- [x] Create/edit/delete events
- [x] Event types: meeting, agenda, holiday, reminder
- [x] Event categories: assign space/category to an event
- [x] Recurring events
- [x] Subscription renewal dates shown on calendar
- [x] Google Calendar sync (read)

## Phase 5 — Financial Tracking

Expand finances beyond basic tracking.

- [ ] Create/edit/delete accounts
- [ ] Create/edit/delete transactions
- [ ] Transaction categories
- [ ] Monthly budget overview
- [ ] Income vs expense trend chart
- [ ] Subscription management (add, edit, cancel tracking)
- [ ] Net worth over time chart
- [ ] Multi-currency support (IDR, USD, SGD, CNY)

## Phase 6 — Search & Insights

Help users find and understand their data.

- [ ] Full-text search across all journal entries
- [ ] Search across events and transactions
- [ ] Command palette (Ctrl+K) for quick navigation and search
- [ ] Weekly reflection summary ("you wrote about X a lot this week")
- [ ] Mood insights (patterns, triggers)
- [ ] Writing frequency analytics
- [ ] Spending pattern insights

## Phase 7 — Data Portability

Users own their data. Make it easy to move.

- [ ] Export journal entries (Markdown, JSON)
- [ ] Export financial data (CSV)
- [ ] Database backup/restore
- [ ] Import from other journaling apps (Day One, Obsidian)

## Phase 8 — Cross-Device Sync

Sync data across devices without a traditional backend.

- [ ] cr-sqlite integration (CRDT-based merge)
- [ ] Sync relay server (minimal — just passes data, no business logic)
- [ ] Conflict resolution UI (if needed)
- [ ] Sync status indicator
- [ ] Selective sync (choose which spaces to sync)

## Phase 9 — Mobile

Take slowlife on the go via Tauri v2 mobile support.

- [ ] Responsive layout adaptations
- [ ] Tauri iOS build
- [ ] Tauri Android build
- [ ] Mobile-optimized quick capture
- [ ] Push notifications for events/reminders

## Phase 10 — Extensibility

Open up the platform for personal customization.

- [ ] Custom spaces (beyond Casual/Work)
- [ ] Custom tag sets per space
- [ ] Theming (light mode, custom color schemes)
- [ ] Plugin system for custom dashboard widgets
- [ ] API for external integrations

---

## Principles

These guide every decision:

1. **Signal over noise** — every metric shown must be actionable or meaningful
2. **Offline-first** — the app must work fully without internet
3. **User-owned data** — no vendor lock-in, export everything
4. **Minimal friction** — writing should be one shortcut away
5. **Desktop-grade** — fast, native, small footprint
