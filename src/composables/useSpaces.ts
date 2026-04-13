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

  async function updateCategory(id: string, spaceId: string, label: string) {
    const db = await getDb()
    await db.execute('UPDATE categories SET label = $1 WHERE id = $2 AND space_id = $3', [label, id, spaceId])
    await load()
  }

  async function deleteCategory(id: string, spaceId: string) {
    const db = await getDb()
    await db.execute('DELETE FROM assets WHERE category_id = $1 AND space_id = $2', [id, spaceId])
    await db.execute('DELETE FROM projects WHERE category_id = $1 AND space_id = $2', [id, spaceId])
    await db.execute('DELETE FROM categories WHERE id = $1 AND space_id = $2', [id, spaceId])
    await load()
  }

  async function updateProject(id: string, categoryId: string, spaceId: string, label: string) {
    const db = await getDb()
    await db.execute(
      'UPDATE projects SET label = $1 WHERE id = $2 AND category_id = $3 AND space_id = $4',
      [label, id, categoryId, spaceId]
    )
    await load()
  }

  async function deleteProject(id: string, categoryId: string, spaceId: string) {
    const db = await getDb()
    await db.execute(
      'DELETE FROM assets WHERE project_id = $1 AND category_id = $2 AND space_id = $3',
      [id, categoryId, spaceId]
    )
    await db.execute(
      'DELETE FROM projects WHERE id = $1 AND category_id = $2 AND space_id = $3',
      [id, categoryId, spaceId]
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
    updateCategory,
    deleteCategory,
    updateProject,
    deleteProject,
  }
}
