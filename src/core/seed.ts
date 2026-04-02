import type Database from '@tauri-apps/plugin-sql'

export async function seedIfEmpty(db: Database) {
  const result = await db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM spaces')
  if (result[0].count > 0) return

  // spaces
  await db.execute("INSERT INTO spaces (id, label, color) VALUES ('casual', 'casual', '#c4956a')")
  await db.execute("INSERT INTO spaces (id, label, color) VALUES ('work', 'work', '#6a9ec4')")

  // casual categories
  await db.execute("INSERT INTO categories (id, space_id, label, sort_order) VALUES ('personal', 'casual', 'personal', 0)")
  await db.execute("INSERT INTO categories (id, space_id, label, sort_order) VALUES ('education', 'casual', 'education', 1)")
  await db.execute("INSERT INTO categories (id, space_id, label, sort_order) VALUES ('side-projects', 'casual', 'side projects', 2)")
  await db.execute("INSERT INTO categories (id, space_id, label, sort_order) VALUES ('health', 'casual', 'health', 3)")

  if (import.meta.env.DEV) {
    // work categories
    await db.execute("INSERT INTO categories (id, space_id, label, sort_order) VALUES ('company-x', 'work', 'company x', 0)")
    await db.execute("INSERT INTO categories (id, space_id, label, sort_order) VALUES ('freelance-a', 'work', 'freelance a', 1)")
    await db.execute("INSERT INTO categories (id, space_id, label, sort_order) VALUES ('freelance-b', 'work', 'freelance b', 2)")

    // projects
    await db.execute("INSERT INTO projects (id, category_id, space_id, label, sort_order) VALUES ('university', 'education', 'casual', 'university', 0)")
    await db.execute("INSERT INTO projects (id, category_id, space_id, label, sort_order) VALUES ('self-learning-rust', 'education', 'casual', 'self-learning: rust', 1)")
    await db.execute("INSERT INTO projects (id, category_id, space_id, label, sort_order) VALUES ('slowlife-app', 'side-projects', 'casual', 'slowlife app', 0)")
    await db.execute("INSERT INTO projects (id, category_id, space_id, label, sort_order) VALUES ('project-alpha', 'company-x', 'work', 'project alpha', 0)")
    await db.execute("INSERT INTO projects (id, category_id, space_id, label, sort_order) VALUES ('project-beta', 'company-x', 'work', 'project beta', 1)")
    await db.execute("INSERT INTO projects (id, category_id, space_id, label, sort_order) VALUES ('website-redesign', 'freelance-a', 'work', 'website redesign', 0)")

    // pinned
    await db.execute("INSERT INTO pinned (space_id, category_id, item_id, sort_order) VALUES ('work', 'company-x', 'project-alpha', 0)")
    await db.execute("INSERT INTO pinned (space_id, category_id, item_id, sort_order) VALUES ('casual', 'side-projects', 'slowlife-app', 1)")
    await db.execute("INSERT INTO pinned (space_id, category_id, item_id, sort_order) VALUES ('casual', 'education', 'self-learning-rust', 2)")

    // events
    await db.execute("INSERT INTO events (title, date, time, end_time, type, color, space_id, category_id, recurrence_rule) VALUES ('team standup', '2026-04-01', '09:00', '09:30', 'meeting', '#6a9ec4', 'work', 'company-x', '{\"freq\":\"weekly\",\"interval\":1,\"byDay\":[\"mon\",\"wed\",\"fri\"]}')")
    await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('dentist', '2026-04-01', '14:00', 'agenda', '#c4956a')")
    await db.execute("INSERT INTO events (title, date, time, end_time, type, color, space_id, category_id) VALUES ('sprint review', '2026-04-02', '16:00', '17:00', 'meeting', '#6a9ec4', 'work', 'company-x')")
    await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('hari raya', '2026-04-03', '', 'holiday', '#6aaa7a')")
    await db.execute("INSERT INTO events (title, date, time, end_time, type, color, space_id, category_id) VALUES ('1-on-1 w/ manager', '2026-04-03', '10:00', '10:30', 'meeting', '#6a9ec4', 'work', 'company-x')")
    await db.execute("INSERT INTO events (title, date, time, type, color, space_id, category_id) VALUES ('side project hack', '2026-04-05', '13:00', 'agenda', '#c4956a', 'casual', 'side-projects')")
    await db.execute("INSERT INTO events (title, date, time, type, color, description) VALUES ('submit tax docs', '2026-04-10', '09:00', 'reminder', '#c46a6a', 'deadline for annual tax filing')")

    // accounts
    await db.execute("INSERT INTO accounts (name, balance, initial_balance, currency) VALUES ('main account', 4250000, -6410010, 'IDR')")
    await db.execute("INSERT INTO accounts (name, balance, initial_balance, currency) VALUES ('savings', 12800000, 12800000, 'IDR')")
    await db.execute("INSERT INTO accounts (name, balance, initial_balance, currency) VALUES ('cash', 350000, 385000, 'IDR')")

    await db.execute("INSERT OR IGNORE INTO finance_settings (id, base_currency) VALUES (1, 'IDR')")

    // transaction categories
    await db.execute("INSERT INTO transaction_categories (label, kind, color, monthly_budget, sort_order) VALUES ('salary', 'income', '#6aaa7a', NULL, 0)")
    await db.execute("INSERT INTO transaction_categories (label, kind, color, monthly_budget, sort_order) VALUES ('freelance', 'income', '#6a9ec4', NULL, 1)")
    await db.execute("INSERT INTO transaction_categories (label, kind, color, monthly_budget, sort_order) VALUES ('food', 'expense', '#c4956a', 1500000, 0)")
    await db.execute("INSERT INTO transaction_categories (label, kind, color, monthly_budget, sort_order) VALUES ('transport', 'expense', '#c46a6a', 500000, 1)")
    await db.execute("INSERT INTO transaction_categories (label, kind, color, monthly_budget, sort_order) VALUES ('software', 'expense', '#8f7bd6', 400000, 2)")

    // exchange rates
    await db.execute("INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date) VALUES ('USD', 'IDR', 16000, '2026-04-01')")
    await db.execute("INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date) VALUES ('SGD', 'IDR', 11800, '2026-04-01')")
    await db.execute("INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date) VALUES ('CNY', 'IDR', 2200, '2026-04-01')")

    // subscriptions
    await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color, cancelled_at) VALUES ('spotify', 54990, 'IDR', 'monthly', '2026-04-15', '#1DB954', NULL)")
    await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color, cancelled_at) VALUES ('icloud+', 45000, 'IDR', 'monthly', '2026-04-08', '#007AFF', NULL)")
    await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color, cancelled_at) VALUES ('chatgpt plus', 20, 'USD', 'monthly', '2026-04-20', '#10a37f', NULL)")
    await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color, cancelled_at) VALUES ('github pro', 4, 'USD', 'monthly', '2026-04-12', '#333333', NULL)")

    // todos
    await db.execute("INSERT INTO todos (title, description, priority, complexity, space_id, category_id, project_id, due_date) VALUES ('fix login redirect bug', 'users get stuck on callback page after oauth', 'P1', 'C1', 'work', 'company-x', 'project-alpha', '2026-04-04')")
    await db.execute("INSERT INTO todos (title, priority, complexity, space_id, category_id, project_id) VALUES ('write unit tests for auth module', 'P2', 'C2', 'work', 'company-x', 'project-alpha')")
    await db.execute("INSERT INTO todos (title, priority, complexity, space_id, category_id) VALUES ('read rust book ch3', 'P3', 'C2', 'casual', 'education')")
    await db.execute("INSERT INTO todos (title, description, priority, complexity, due_date) VALUES ('renew passport', 'check embassy website for appointment slots', 'P1', 'C1', '2026-04-15')")
    await db.execute("INSERT INTO todos (title, priority, complexity, status) VALUES ('update resume', 'P4', 'C1', 'done')")

    // transactions
    await db.execute("INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode) VALUES (1, 'salary', 8500000, 'income', '2026-03-31', 1, 'manual')")
    await db.execute("INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode) VALUES (1, 'groceries', -285000, 'expense', '2026-03-30', 3, 'manual')")
    await db.execute("INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode) VALUES (3, 'grab ride', -35000, 'expense', '2026-03-29', 4, 'manual')")
    await db.execute("INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode) VALUES (1, 'freelance payment', 2500000, 'income', '2026-03-28', 2, 'manual')")
    await db.execute("INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode) VALUES (1, 'coffee', -54990, 'expense', '2026-03-27', 3, 'manual')")

    await db.execute("INSERT INTO net_worth_snapshots (snapshot_date, net_worth, base_currency) VALUES ('2026-03-27', 12745010, 'IDR')")
    await db.execute("INSERT INTO net_worth_snapshots (snapshot_date, net_worth, base_currency) VALUES ('2026-03-28', 15245010, 'IDR')")
    await db.execute("INSERT INTO net_worth_snapshots (snapshot_date, net_worth, base_currency) VALUES ('2026-03-29', 15210010, 'IDR')")
    await db.execute("INSERT INTO net_worth_snapshots (snapshot_date, net_worth, base_currency) VALUES ('2026-03-30', 14925010, 'IDR')")
    await db.execute("INSERT INTO net_worth_snapshots (snapshot_date, net_worth, base_currency) VALUES ('2026-03-31', 23425010, 'IDR')")
  }
}
