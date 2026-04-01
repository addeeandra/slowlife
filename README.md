# slowlife

A personal operating system for people who move fast — designed to make everything feel manageable.

slowlife is a desktop-first journaling, events, and financial tracking app built with a brutalist, terminal-inspired aesthetic. It prioritizes signal over noise: no vanity metrics, no bloat — just the information you need to stay grounded.

## Philosophy

> Not actually slow — but helps those who move fast to feel like slowing down and see everything as manageable.

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
- **Signal cards**: streak, weekly activity, dominant mood, net worth, subscription burn
- **Activity heatmap**: 20-week contribution-style grid
- **Pinned projects**: quick access to what matters most, with last-entry and weekly activity signals
- **Mood trend**: 7-day visual
- **Upcoming events** and **subscription renewals** at a glance

### Events
- Meetings, agendas, holidays
- Grouped by date with type badges
- Calendar sync support planned

### Finances
- **Accounts** with balances
- **Subscriptions** with renewal countdown and monthly total
- **Transactions** with income/expense tracking
- All amounts in local currency (IDR)

### Desktop Experience
- Native app via Tauri (~5MB, not Electron)
- SQLite database — fast, reliable, local
- Keyboard shortcuts (Ctrl+1/2/3 for navigation, Ctrl+N for quick capture)
- System tray support planned

## Current Status

Phase 1 (Foundation) is complete. The app is fully functional with:

- [x] All views implemented (dashboard, journal, events, finances)
- [x] SQLite data persistence with seed data on first run
- [x] Sidebar with space switching, collapsible category tree, and entry counts
- [x] Dashboard with signal cards, activity heatmap, pinned projects, mood trend, upcoming events, subscriptions, and recent entries
- [x] Journal with write/timeline tabs, mood picker, writing prompts, tags, word count, and breadcrumb navigation
- [x] Keyboard shortcuts and floating shortcut help panel
- [x] Mobile-responsive layout

## Roadmap Preview

See [ROADMAP.md](ROADMAP.md) for the full roadmap. Key upcoming milestones:

- [ ] Global quick capture (system-wide shortcut)
- [ ] Calendar views and event CRUD
- [ ] Calendar sync (Google Calendar, Apple Calendar)
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
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

TBD
