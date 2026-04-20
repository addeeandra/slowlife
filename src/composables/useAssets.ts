import { computed, ref } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener'
import { getDb } from '../core/db'
import { compareNewestFirst } from '../core/constants'
import type { Asset } from '../core/types'
import type { FocusTarget } from './useFocusMode'

interface AssetRow {
  id: number
  title: string
  url: string
  description: string | null
  tags: string
  space_id: string
  category_id: string
  project_id: string | null
  last_opened_at: string | null
  created_at: string
}

export interface AssetInput {
  title: string
  url: string
  description?: string | null
  tags?: string[]
  space_id: string
  category_id: string
  project_id?: string | null
}

const assets = ref<Asset[]>([])

function normalizeTimestamp(value: string | null): string | null {
  if (!value) return null
  if (value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value)) return value
  return value.replace(' ', 'T') + 'Z'
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(tag => String(tag || '').trim().toLowerCase())
      .filter(Boolean)
  } catch {
    return []
  }
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map(tag => tag.trim().toLowerCase()).filter(Boolean))]
}

function mapRow(row: AssetRow): Asset {
  return {
    ...row,
    tags: parseTags(row.tags),
    created_at: normalizeTimestamp(row.created_at) || new Date(0).toISOString(),
    last_opened_at: normalizeTimestamp(row.last_opened_at),
  }
}


export function useAssets() {
  async function load() {
    const db = await getDb()
    const rows = await db.select<AssetRow[]>('SELECT * FROM assets ORDER BY created_at DESC')
    assets.value = rows.map(mapRow)
  }

  async function createAsset(input: AssetInput) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO assets (title, url, description, tags, space_id, category_id, project_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.title,
        input.url,
        input.description ?? null,
        JSON.stringify(normalizeTags(input.tags ?? [])),
        input.space_id,
        input.category_id,
        input.project_id ?? null,
        new Date().toISOString(),
      ]
    )
    await load()
  }

  async function updateAsset(id: number, patch: Partial<AssetInput>) {
    const db = await getDb()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue
      fields.push(`${key} = $${idx}`)
      values.push(key === 'tags' ? JSON.stringify(normalizeTags(value as string[])) : value)
      idx++
    }

    if (!fields.length) return

    values.push(id)
    await db.execute(`UPDATE assets SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await load()
  }

  async function deleteAsset(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM assets WHERE id = $1', [id])
    await load()
  }

  async function touchAsset(id: number) {
    const db = await getDb()
    await db.execute('UPDATE assets SET last_opened_at = $1 WHERE id = $2', [new Date().toISOString(), id])
    await load()
  }

  async function openAsset(asset: Asset) {
    await Promise.all([openUrl(asset.url), touchAsset(asset.id)])
  }

  function assetsForFocus(target: FocusTarget | null): Asset[] {
    if (!target) return []
    return assets.value
      .filter(asset =>
        asset.space_id === target.spaceId &&
        asset.category_id === target.categoryId &&
        (target.kind !== 'project'
          ? asset.project_id === null
          : asset.project_id === null || asset.project_id === target.projectId)
      )
      .sort((a, b) => compareNewestFirst(a.last_opened_at, b.last_opened_at) || compareNewestFirst(a.created_at, b.created_at))
  }

  function uniqueTags(list: Asset[]) {
    return [...new Set(list.flatMap(asset => asset.tags))].sort((a, b) => a.localeCompare(b))
  }

  function recentAssets(count: number = 4): Asset[] {
    return assets.value
      .filter(asset => !!asset.last_opened_at)
      .sort((a, b) => compareNewestFirst(a.last_opened_at, b.last_opened_at))
      .slice(0, count)
  }

  const recentlyOpened = computed(() => recentAssets(4))

  return {
    assets,
    recentlyOpened,
    load,
    createAsset,
    updateAsset,
    deleteAsset,
    openAsset,
    assetsForFocus,
    uniqueTags,
    recentAssets,
  }
}
