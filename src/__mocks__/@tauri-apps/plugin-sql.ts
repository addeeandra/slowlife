import { vi } from 'vitest'

export const mockDb = {
  select: vi.fn().mockResolvedValue([]),
  execute: vi.fn().mockResolvedValue({ rowsAffected: 0 }),
}

vi.mock('../../core/db', () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}))
