import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDb } from '../../__mocks__/@tauri-apps/plugin-sql'

const openUrl = vi.fn().mockResolvedValue(undefined)

vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl,
}))

describe('useAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('loads assets and parses tags', async () => {
    mockDb.select.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Repo',
        url: 'https://github.com/org/repo',
        description: 'Main source',
        tags: '["code","github"]',
        space_id: 'work',
        category_id: 'company',
        project_id: 'alpha',
        last_opened_at: '2026-04-03 03:00:00',
        created_at: '2026-04-01 08:00:00',
      },
    ])

    const { useAssets } = await import('../useAssets')
    const assets = useAssets()

    await assets.load()

    expect(assets.assets.value).toHaveLength(1)
    expect(assets.assets.value[0].tags).toEqual(['code', 'github'])
    expect(assets.assets.value[0].created_at).toBe('2026-04-01T08:00:00Z')
  })

  it('returns shared and project assets in project focus', async () => {
    mockDb.select.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Shared docs',
        url: 'https://docs.google.com/document/d/shared',
        description: null,
        tags: '["documents"]',
        space_id: 'work',
        category_id: 'company',
        project_id: null,
        last_opened_at: '2026-04-03 03:00:00',
        created_at: '2026-04-01 08:00:00',
      },
      {
        id: 2,
        title: 'Alpha repo',
        url: 'https://github.com/org/alpha',
        description: null,
        tags: '["code"]',
        space_id: 'work',
        category_id: 'company',
        project_id: 'alpha',
        last_opened_at: '2026-04-03 04:00:00',
        created_at: '2026-04-01 09:00:00',
      },
      {
        id: 3,
        title: 'Other project',
        url: 'https://jira.example.com/other',
        description: null,
        tags: '["planning"]',
        space_id: 'work',
        category_id: 'company',
        project_id: 'beta',
        last_opened_at: null,
        created_at: '2026-04-01 10:00:00',
      },
    ])

    const { useAssets } = await import('../useAssets')
    const assets = useAssets()

    await assets.load()

    const focused = assets.assetsForFocus({
      kind: 'project',
      spaceId: 'work',
      categoryId: 'company',
      projectId: 'alpha',
    })

    expect(focused.map(asset => asset.id)).toEqual([2, 1])
  })

  it('only returns shared assets in category focus', async () => {
    mockDb.select.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Shared docs',
        url: 'https://docs.google.com/document/d/shared',
        description: null,
        tags: '["documents"]',
        space_id: 'work',
        category_id: 'company',
        project_id: null,
        last_opened_at: null,
        created_at: '2026-04-01 08:00:00',
      },
      {
        id: 2,
        title: 'Alpha repo',
        url: 'https://github.com/org/alpha',
        description: null,
        tags: '["code"]',
        space_id: 'work',
        category_id: 'company',
        project_id: 'alpha',
        last_opened_at: null,
        created_at: '2026-04-01 09:00:00',
      },
    ])

    const { useAssets } = await import('../useAssets')
    const assets = useAssets()

    await assets.load()

    const focused = assets.assetsForFocus({
      kind: 'category',
      spaceId: 'work',
      categoryId: 'company',
      projectId: null,
    })

    expect(focused.map(asset => asset.id)).toEqual([1])
  })

  it('normalizes tags on create and update', async () => {
    const { useAssets } = await import('../useAssets')
    const assets = useAssets()

    await assets.createAsset({
      title: 'Repo',
      url: 'https://github.com/org/repo',
      description: null,
      tags: ['Code', ' code ', 'Github'],
      space_id: 'work',
      category_id: 'company',
      project_id: 'alpha',
    })

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO assets'),
      expect.arrayContaining([
        'Repo',
        'https://github.com/org/repo',
        null,
        '["code","github"]',
        'work',
        'company',
        'alpha',
      ])
    )

    await assets.updateAsset(1, { tags: ['Docs', 'docs', 'Wiki'] })

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE assets SET tags = $1 WHERE id = $2',
      ['["docs","wiki"]', 1]
    )
  })

  it('opens an asset and updates recency', async () => {
    mockDb.select.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Repo',
        url: 'https://github.com/org/repo',
        description: null,
        tags: '["code"]',
        space_id: 'work',
        category_id: 'company',
        project_id: 'alpha',
        last_opened_at: null,
        created_at: '2026-04-01 08:00:00',
      },
    ]).mockResolvedValueOnce([
      {
        id: 1,
        title: 'Repo',
        url: 'https://github.com/org/repo',
        description: null,
        tags: '["code"]',
        space_id: 'work',
        category_id: 'company',
        project_id: 'alpha',
        last_opened_at: '2026-04-03 06:00:00',
        created_at: '2026-04-01 08:00:00',
      },
    ])

    const { useAssets } = await import('../useAssets')
    const assets = useAssets()
    await assets.load()

    await assets.openAsset(assets.assets.value[0])

    expect(openUrl).toHaveBeenCalledWith('https://github.com/org/repo')
    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE assets SET last_opened_at = $1 WHERE id = $2',
      [expect.any(String), 1]
    )
  })

  it('returns recent assets ordered by last open time', async () => {
    mockDb.select.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Repo',
        url: 'https://github.com/org/repo',
        description: null,
        tags: '["code"]',
        space_id: 'work',
        category_id: 'company',
        project_id: 'alpha',
        last_opened_at: '2026-04-03 06:00:00',
        created_at: '2026-04-01 08:00:00',
      },
      {
        id: 2,
        title: 'Docs',
        url: 'https://docs.google.com/document/d/shared',
        description: null,
        tags: '["documents"]',
        space_id: 'work',
        category_id: 'company',
        project_id: null,
        last_opened_at: '2026-04-03 07:00:00',
        created_at: '2026-04-01 09:00:00',
      },
      {
        id: 3,
        title: 'Old',
        url: 'https://example.com/old',
        description: null,
        tags: '["misc"]',
        space_id: 'work',
        category_id: 'company',
        project_id: null,
        last_opened_at: null,
        created_at: '2026-04-01 10:00:00',
      },
    ])

    const { useAssets } = await import('../useAssets')
    const assets = useAssets()
    await assets.load()

    expect(assets.recentAssets().map(asset => asset.id)).toEqual([2, 1])
    expect(assets.uniqueTags(assets.assets.value)).toEqual(['code', 'documents', 'misc'])
  })
})
