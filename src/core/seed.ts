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
  await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('team standup', '2026-04-01', '09:00', 'meeting', '#6a9ec4')")
  await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('dentist', '2026-04-01', '14:00', 'agenda', '#c4956a')")
  await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('sprint review', '2026-04-02', '16:00', 'meeting', '#6a9ec4')")
  await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('hari raya', '2026-04-03', '', 'holiday', '#6aaa7a')")
  await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('1-on-1 w/ manager', '2026-04-03', '10:00', 'meeting', '#6a9ec4')")
  await db.execute("INSERT INTO events (title, date, time, type, color) VALUES ('side project hack', '2026-04-05', '13:00', 'agenda', '#c4956a')")

  // accounts
  await db.execute("INSERT INTO accounts (name, balance, currency) VALUES ('main account', 4250000, 'IDR')")
  await db.execute("INSERT INTO accounts (name, balance, currency) VALUES ('savings', 12800000, 'IDR')")
  await db.execute("INSERT INTO accounts (name, balance, currency) VALUES ('cash', 350000, 'IDR')")

  // subscriptions
  await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color) VALUES ('spotify', 54990, 'IDR', 'monthly', '2026-04-15', '#1DB954')")
  await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color) VALUES ('icloud+', 45000, 'IDR', 'monthly', '2026-04-08', '#007AFF')")
  await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color) VALUES ('chatgpt plus', 320000, 'IDR', 'monthly', '2026-04-20', '#10a37f')")
  await db.execute("INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color) VALUES ('github pro', 60000, 'IDR', 'monthly', '2026-04-12', '#333333')")

  // transactions
  await db.execute("INSERT INTO transactions (account_id, description, amount, type, date) VALUES (1, 'salary', 8500000, 'income', '2026-03-31')")
  await db.execute("INSERT INTO transactions (account_id, description, amount, type, date) VALUES (1, 'groceries', -285000, 'expense', '2026-03-30')")
  await db.execute("INSERT INTO transactions (account_id, description, amount, type, date) VALUES (3, 'grab ride', -35000, 'expense', '2026-03-29')")
  await db.execute("INSERT INTO transactions (account_id, description, amount, type, date) VALUES (1, 'freelance payment', 2500000, 'income', '2026-03-28')")
  await db.execute("INSERT INTO transactions (account_id, description, amount, type, date) VALUES (1, 'coffee', -54990, 'expense', '2026-03-27')")
}
