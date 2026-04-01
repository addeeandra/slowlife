import { ref, computed } from 'vue'
import { getDb } from '../core/db'
import type { Space, Category, Project, CategoryNode } from '../core/types'

const spaces = ref<Space[]>([])
const categories = ref<Category[]>([])
const projects = ref<Project[]>([])
const currentSpace = ref('casual')
const expandedCategories = ref<Set<string>>(new Set())

export function useSpaces() {
  async function load() {
    const db = await getDb()
    spaces.value = await db.select<Space[]>('SELECT * FROM spaces')
    categories.value = await db.select<Category[]>('SELECT * FROM categories ORDER BY sort_order')
    projects.value = await db.select<Project[]>('SELECT * FROM projects ORDER BY sort_order')
    categories.value
      .filter(c => c.space_id === currentSpace.value)
      .forEach(c => expandedCategories.value.add(c.id))
  }

  function spaceTree(spaceId: string): CategoryNode[] {
    return categories.value
      .filter(c => c.space_id === spaceId)
      .map(c => ({
        category: c,
        projects: projects.value.filter(p => p.category_id === c.id && p.space_id === spaceId),
      }))
  }

  function switchSpace(spaceId: string) {
    currentSpace.value = spaceId
    categories.value
      .filter(c => c.space_id === spaceId)
      .forEach(c => expandedCategories.value.add(c.id))
  }

  function toggleCategory(categoryId: string) {
    if (expandedCategories.value.has(categoryId)) {
      expandedCategories.value.delete(categoryId)
    } else {
      expandedCategories.value.add(categoryId)
    }
  }

  async function addCategory(label: string) {
    const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const db = await getDb()
    const order = categories.value.filter(c => c.space_id === currentSpace.value).length
    await db.execute(
      'INSERT INTO categories (id, space_id, label, sort_order) VALUES ($1, $2, $3, $4)',
      [id, currentSpace.value, label, order]
    )
    expandedCategories.value.add(id)
    await load()
  }

  async function addProject(categoryId: string, label: string) {
    const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const db = await getDb()
    const order = projects.value.filter(p => p.category_id === categoryId && p.space_id === currentSpace.value).length
    await db.execute(
      'INSERT INTO projects (id, category_id, space_id, label, sort_order) VALUES ($1, $2, $3, $4, $5)',
      [id, categoryId, currentSpace.value, label, order]
    )
    await load()
  }

  const currentSpaceData = computed(() => spaces.value.find(s => s.id === currentSpace.value))

  return {
    spaces,
    categories,
    projects,
    currentSpace,
    expandedCategories,
    currentSpaceData,
    load,
    spaceTree,
    switchSpace,
    toggleCategory,
    addCategory,
    addProject,
  }
}
