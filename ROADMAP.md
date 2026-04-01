# Roadmap

This is the complete roadmap for slowlife, organized by phase. Each phase builds on the previous one. Items are roughly ordered by priority within each phase.

---

## Phase 1 — Foundation

Migrate the validated prototype into a real application.

- [ ] Migrate design tokens (colors, typography, spacing) from prototype
- [ ] Build sidebar component with full navigation tree
- [ ] Build dashboard view with grid layout
- [ ] Build journal write view (editor, mood picker, prompts, tags)
- [ ] Build journal timeline view
- [ ] Build events view
- [ ] Build finances view (accounts, subscriptions, transactions)
- [ ] SQLite schema and migrations (journal_entries, events, accounts, transactions, subscriptions, spaces, categories, projects, pinned)
- [ ] CRUD operations for all entities
- [ ] Keyboard shortcuts (Ctrl+1/2/3, Ctrl+N, Ctrl+S)
- [ ] Floating shortcut help panel

## Phase 2 — Core Experience

Polish the daily-use experience. Make it feel right.

- [ ] Breadcrumb navigation with clickable segments
- [ ] Activity heatmap (20-week contribution grid)
- [ ] Signal cards on dashboard (streak, weekly activity, mood, net worth, sub burn)
- [ ] Pinned projects on dashboard with last-entry and weekly signals
- [ ] Mood trend (7-day visual)
- [ ] Quiet-day nudge (time-aware prompt when no entries today)
- [ ] Add/remove categories and projects from sidebar
- [ ] Pin/unpin projects from within a space view
- [ ] Context-aware writing prompts (casual vs work)
- [ ] Context-aware tag sets (casual vs work)
- [ ] Word count in editor
- [ ] Entry saved feedback

## Phase 3 — Quick Capture

Reduce friction for capturing thoughts.

- [ ] Global quick capture shortcut (system-wide, even when app is minimized)
- [ ] Quick capture modal — write, pick space/category, save, dismiss
- [ ] System tray icon with quick capture trigger
- [ ] Auto-focus editor on capture
- [ ] Default space/category for captures (configurable)

## Phase 4 — Events & Calendar

Build out the events system into a proper calendar.

- [ ] Calendar month view
- [ ] Calendar week view
- [ ] Create/edit/delete events
- [ ] Event types: meeting, agenda, holiday, reminder
- [ ] Recurring events
- [ ] Subscription renewal dates shown on calendar
- [ ] Google Calendar sync (read)
- [ ] Apple Calendar sync (read)
- [ ] Calendar sync conflict handling

## Phase 5 — Financial Tracking

Expand finances beyond basic tracking.

- [ ] Create/edit/delete accounts
- [ ] Create/edit/delete transactions
- [ ] Transaction categories
- [ ] Monthly budget overview
- [ ] Income vs expense trend chart
- [ ] Subscription management (add, edit, cancel tracking)
- [ ] Net worth over time chart
- [ ] Multi-currency support
- [ ] CSV import/export for transactions

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
