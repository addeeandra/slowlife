import { ref, computed } from 'vue'
import { getDb } from '../core/db'
import type { Pinned } from '../core/types'
import { useSpaces } from './useSpaces'
import { useJournal } from './useJournal'

const pinnedItems = ref<Pinned[]>([])

export function usePinned() {
  async function load() {
    const db = await getDb()
    pinnedItems.value = await db.select<Pinned[]>('SELECT * FROM pinned ORDER BY sort_order')
  }

  function matchesPinned(
    p: Pinned,
    space_id: string,
    category_id: string,
    item_id: string | null
  ): boolean {
    if (p.space_id !== space_id || p.category_id !== category_id) return false;
    if (item_id === null) return p.item_id === null || p.item_id === undefined;
    return p.item_id === item_id;
  }

  async function pin(space_id: string, category_id: string, item_id: string | null) {
    const db = await getDb()
    const maxOrder = pinnedItems.value.reduce((max, p) => Math.max(max, p.sort_order), -1)
    await db.execute(
      'INSERT INTO pinned (space_id, category_id, item_id, sort_order) VALUES ($1, $2, $3, $4)',
      [space_id, category_id, item_id, maxOrder + 1]
    )
    await load()
  }

  async function unpin(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM pinned WHERE id = $1', [id])
    await load()
  }

  async function updateSortOrder(orderedIds: number[]) {
    const db = await getDb()
    for (let i = 0; i < orderedIds.length; i++) {
      await db.execute('UPDATE pinned SET sort_order = $1 WHERE id = $2', [i, orderedIds[i]])
    }
    await load()
  }

  function isPinned(space_id: string, category_id: string, item_id: string | null): boolean {
    return pinnedItems.value.some(p => matchesPinned(p, space_id, category_id, item_id))
  }

  function getPinnedId(space_id: string, category_id: string, item_id: string | null): number | null {
    const found = pinnedItems.value.find(p => matchesPinned(p, space_id, category_id, item_id))
    return found ? found.id : null
  }

  const pinnedWithMeta = computed(() => {
    const { spaces, categories, projects } = useSpaces()
    const { entries } = useJournal()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 864e5)

    return pinnedItems.value.map(p => {
      const space = spaces.value.find(s => s.id === p.space_id)
      const cat = categories.value.find(c => c.id === p.category_id && c.space_id === p.space_id)
      const project = p.item_id
        ? projects.value.find(
            pr => pr.id === p.item_id && pr.category_id === p.category_id && pr.space_id === p.space_id
          )
        : null

      const name = project ? project.label : cat ? cat.label : '??'
      const relatedEntries = entries.value.filter(
        e =>
          e.space === p.space_id &&
          e.category === p.category_id &&
          (!p.item_id || e.item === p.item_id)
      )
      const weekCount = relatedEntries.filter(e => new Date(e.created_at) >= weekAgo).length
      const lastEntry = relatedEntries[0]
      let lastStr = '--'
      if (lastEntry) {
        const diff = Math.floor((now.getTime() - new Date(lastEntry.created_at).getTime()) / 864e5)
        lastStr = diff === 0 ? 'today' : diff === 1 ? 'yesterday' : diff + 'd ago'
      }

      return {
        ...p,
        name,
        spaceColor: space?.color || '#c4956a',
        spaceId: p.space_id,
        lastStr,
        weekCount,
      }
    })
  })

  return { pinnedItems, load, pin, unpin, updateSortOrder, isPinned, getPinnedId, pinnedWithMeta }
}
