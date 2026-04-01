# slowlife

![CI](https://github.com/addeeandra/slowlife/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/addeeandra/slowlife/graph/badge.svg)](https://codecov.io/gh/addeeandra/slowlife)

A personal operating system for people who move fast — designed to make everything feel in-place.

slowlife is a desktop-first journaling, events, and financial tracking app built with a brutalist, terminal-inspired aesthetic. It prioritizes signal over noise: no vanity metrics, no bloat — just the information you need to stay grounded.

## Philosophy

- **Signal, not noise** — useful metrics over generic totals
- **Offline-first** — your data lives on your machine, always available
- **Typography-first** — monospace, dense, no decoration for decoration's sake
- **Structured, not scattered** — hierarchical spaces instead of flat tags

## Features

### Journal
- **Dual spaces**: Casual (personal, education, side projects) and Work (companies, freelance clients)
- **Hierarchical navigation**: Space > Category > Project — not flat tags
- **Mood tracking**: per-entry emotional snapshots
- **Writing prompts**: context-aware (reflective for casual, action-oriented for work)
- **Tags**: per-space tag sets for quick categorization

### Dashboard
- **Signal cards**: streak, weekly activity, dominant mood, net worth, subscription burn, open todos
- **Activity heatmap**: 20-week contribution-style grid
- **Pinned projects**: quick access to what matters most, with last-entry and weekly activity signals
- **Mood trend**: 7-day visual
- **Upcoming events**, **subscription renewals**, and **focus todos** at a glance

### Events
- Meetings, agendas, holidays
- Grouped by date with type badges
- List view shows upcoming events from today forward
- Google Calendar sync is available as a one-way, read-only mirror
- Synced Google events open a read-only detail view and link back to the original event

### Todos
- **Priority scoring**: P0 (critical) through P4 (someday)
- **Complexity scoring**: C0 (trivial) through C4 (epic)
- **Status workflow**: open, in progress, done, cancelled
- **Assignable** to any space/category/project
- **Due dates** with overdue detection
- **Filtered views**: group by status, filter by priority, sort by due date

### Finances
- **Accounts** with balances
- **Subscriptions** with renewal countdown and monthly total
- **Transactions** with income/expense tracking
- All amounts in local currency (IDR)

### Desktop Experience
- Native app via Tauri (~5MB, not Electron)
- SQLite database — fast, reliable, local
- Keyboard shortcuts (Ctrl+1/2/3/4 for navigation, Ctrl+N for quick capture)
- System tray support

## Roadmap Preview

See [ROADMAP.md](ROADMAP.md) for the full roadmap. Key upcoming milestones:

- [x] Global quick capture (system-wide shortcut)
- [x] Calendar views and event CRUD
- [x] Calendar sync (Google Calendar, read-only)
- [ ] Todos with priority/complexity scoring
- [ ] Financial CRUD and budget tracking
- [ ] Full-text search and command palette
- [ ] cr-sqlite for cross-device sync
- [ ] Mobile support via Tauri v2

## Tech Stack

| Layer | Choice |
|-------|--------|
| Shell | Tauri v2 |
| Frontend | Vue 3 + TypeScript + Vite |
| Data | SQLite via tauri-plugin-sql |
| Styling | Scoped CSS with design tokens |
| Routing | Vue Router 4 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Tauri v2 system dependencies — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Setup

```bash
git clone https://github.com/addeeandra/slowlife.git
cd slowlife-app
pnpm install
```

### Development

```bash
pnpm tauri:dev
```

Dev and production are intentionally isolated:

- dev app identifier: `com.addeeandra.slowlife.dev`
- prod app identifier: `com.addeeandra.slowlife`
- dev database: `slowlife-dev.db`
- prod database: `slowlife.db`

### Build

```bash
pnpm tauri build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

TBD
