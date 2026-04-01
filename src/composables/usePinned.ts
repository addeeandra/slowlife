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

  async function unpin(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM pinned WHERE id = $1', [id])
    await load()
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

  return { pinnedItems, load, unpin, pinnedWithMeta }
}
