# Roadmap

Organized by phase. Each phase builds on the previous one.

---

## Phase 1 — Foundation ✓

- [x] Design tokens, sidebar, and all core views (dashboard, journal, events, finances)
- [x] SQLite schema, migrations, and CRUD for all entities
- [x] Dashboard signal cards, activity heatmap, pinned projects, mood trend
- [x] Keyboard shortcuts, floating shortcut help, breadcrumb navigation
- [x] First-run seed data

## Phase 2 — Core Experience ✓

- [x] Edit/delete entries, categories, and projects inline
- [x] Pin/unpin and drag-to-reorder pinned projects
- [x] Collapsible sidebar: auto-open on desktop, overlay on mobile (Ctrl+S)
- [x] Smooth animations and transitions

## Phase 3 — Quick Capture ✓

- [x] System-wide quick capture shortcut (Ctrl+N), works when minimized
- [x] Quick capture modal with space/category picker
- [x] System tray trigger

## Phase 4 — Events & Calendar ✓

- [x] Month and week calendar views
- [x] Event CRUD with types (meeting, agenda, holiday, reminder) and recurrence
- [x] Google Calendar sync (read-only)
- [x] Subscription renewal dates on calendar

## Phase 5 — Todos & Task Tracking ✓

- [x] Todo CRUD with priority (P0–P4), complexity (C0–C4), status workflow, and due dates
- [x] Views: status grouping, filtering, sorting
- [x] Focus rate tracking: inattentive task detection with R = i/(a+i) metric
- [x] Focus mode: context-locked panel (journal + todos + events) for a category or project (Ctrl+0)

## Phase 6 — Financial Tracking ✓

- [x] Account, transaction, and subscription CRUD
- [x] Monthly budgets, income/expense trend, net worth history
- [x] Multi-currency support (IDR, USD, SGD, CNY)

## Phase 7 — Search & Insights

- [x] Full-text search and command palette (Ctrl+K)
- [ ] Writing frequency analytics
- [ ] Spending pattern insights

## Phase 8 — Data Portability

- [ ] Export journal (Markdown, JSON) and finances (CSV)
- [ ] Database backup/restore
- [ ] Import from Day One, Obsidian

## Phase 9 — Cross-Device Sync

- [ ] cr-sqlite (CRDT-based merge)
- [ ] Minimal sync relay server
- [ ] Conflict resolution UI and sync status indicator

## Phase 10 — Mobile

- [ ] Tauri iOS and Android builds
- [ ] Responsive layout and mobile-optimized quick capture
- [ ] Push notifications

## Phase 11 — Extensibility

- [ ] Custom spaces and tag sets
- [ ] Theming (light mode, custom colors)
- [ ] Plugin system and external API

---

## Principles

1. **Signal over noise** — every metric shown must be actionable or meaningful
2. **Offline-first** — the app must work fully without internet
3. **User-owned data** — no vendor lock-in, export everything
4. **Minimal friction** — writing should be one shortcut away
5. **Desktop-grade** — fast, native, small footprint
