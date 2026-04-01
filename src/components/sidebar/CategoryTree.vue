<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useSpaces } from '../../composables/useSpaces'
import { useJournal } from '../../composables/useJournal'
import { usePinned } from '../../composables/usePinned'
import InputDialog from '../InputDialog.vue'
import type { Category, Project } from '../../core/types'

const route = useRoute()
const {
  currentSpace, spaceTree, expandedCategories, toggleCategory,
  addCategory, addProject, updateCategory, deleteCategory, updateProject, deleteProject,
} = useSpaces()
const { countEntries } = useJournal()
const { isPinned, getPinnedId, pin, unpin } = usePinned()

const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogPlaceholder = ref('')
const dialogTarget = ref<string | null>(null)

const editingId = ref<string | null>(null)
const editLabel = ref('')
const confirmDeleteId = ref<string | null>(null)
const editInputEl = ref<HTMLInputElement | null>(null)

function isLeafActive(categoryId: string): boolean {
  return route.name === 'journal' && route.params.category === categoryId && !route.params.item
}

function isSubActive(categoryId: string, itemId: string): boolean {
  return route.name === 'journal' && route.params.category === categoryId && route.params.item === itemId
}

function openAddCategory() {
  dialogTarget.value = null
  dialogTitle.value = 'add category'
  dialogPlaceholder.value = 'category name'
  dialogOpen.value = true
}

function openAddProject(categoryId: string) {
  dialogTarget.value = categoryId
  dialogTitle.value = 'add project'
  dialogPlaceholder.value = 'project name'
  dialogOpen.value = true
}

async function onDialogConfirm(name: string) {
  dialogOpen.value = false
  if (dialogTarget.value === null) {
    await addCategory(name)
  } else {
    await addProject(dialogTarget.value, name)
  }
}

function onDialogCancel() {
  dialogOpen.value = false
}

function startEdit(id: string, label: string) {
  confirmDeleteId.value = null
  editingId.value = id
  editLabel.value = label
  nextTick(() => editInputEl.value?.focus())
}

function cancelEdit() {
  editingId.value = null
  editLabel.value = ''
}

async function confirmEditCategory(cat: Category) {
  const label = editLabel.value.trim()
  if (label && label !== cat.label) {
    await updateCategory(cat.id, cat.space_id, label)
  }
  cancelEdit()
}

async function confirmEditProject(proj: Project) {
  const label = editLabel.value.trim()
  if (label && label !== proj.label) {
    await updateProject(proj.id, proj.category_id, proj.space_id, label)
  }
  cancelEdit()
}

function startDelete(id: string) {
  cancelEdit()
  confirmDeleteId.value = id
}

function cancelDelete() {
  confirmDeleteId.value = null
}

async function doDeleteCategory(id: string, spaceId: string) {
  await deleteCategory(id, spaceId)
  cancelDelete()
}

async function doDeleteProject(id: string, categoryId: string, spaceId: string) {
  await deleteProject(id, categoryId, spaceId)
  cancelDelete()
}

async function togglePin(spaceId: string, categoryId: string, itemId: string | null) {
  if (isPinned(spaceId, categoryId, itemId)) {
    const pinnedId = getPinnedId(spaceId, categoryId, itemId)
    if (pinnedId !== null) await unpin(pinnedId)
  } else {
    await pin(spaceId, categoryId, itemId)
  }
}
</script>

<template>
  <div class="sb-tree">
    <div v-for="node in spaceTree(currentSpace)" :key="node.category.id" style="padding: 0 4px">

      <!-- Category header -->
      <div class="sb-cat-row">
        <button class="sb-cat-toggle" @click="toggleCategory(node.category.id)">
          <span class="ch" :class="{ open: expandedCategories.has(node.category.id) }">&#9654;</span>
        </button>
        <input
          v-if="editingId === 'cat-' + node.category.id"
          ref="editInputEl"
          class="sb-edit-input"
          v-model="editLabel"
          @keydown.enter="confirmEditCategory(node.category)"
          @keydown.escape="cancelEdit"
          @blur="confirmEditCategory(node.category)"
        />
        <span v-else class="sb-cat-label">{{ node.category.label }}</span>
        <div class="row-acts">
          <button class="act-btn" @click.stop="startEdit('cat-' + node.category.id, node.category.label)">✎</button>
          <button class="act-btn act-del" @click.stop="startDelete('cat-' + node.category.id)">×</button>
        </div>
      </div>

      <!-- Category delete confirm -->
      <div v-if="confirmDeleteId === 'cat-' + node.category.id" class="confirm-row">
        delete + its projects?
        <button class="cf-yes" @click="doDeleteCategory(node.category.id, node.category.space_id)">yes</button>
        <button class="cf-no" @click="cancelDelete">no</button>
      </div>

      <!-- Category body -->
      <div class="sb-cat-body" :class="{ collapsed: !expandedCategories.has(node.category.id) }">

        <!-- "All" leaf with pin toggle -->
        <div class="sb-leaf-row">
          <router-link
            class="sb-leaf"
            :class="{ active: isLeafActive(node.category.id) }"
            :to="`/journal/${currentSpace}/${node.category.id}`"
          >
            <span class="dot"></span>all<span class="cnt">{{ countEntries(currentSpace, node.category.id) }}</span>
          </router-link>
          <button
            class="pin-btn"
            :class="{ pinned: isPinned(currentSpace, node.category.id, null) }"
            @click.stop="togglePin(currentSpace, node.category.id, null)"
          >{{ isPinned(currentSpace, node.category.id, null) ? '★' : '☆' }}</button>
        </div>

        <!-- Projects -->
        <div v-if="node.projects.length" class="sb-sub">
          <div v-for="proj in node.projects" :key="proj.id" class="sb-proj-wrap">

            <!-- Project edit input row -->
            <div v-if="editingId === 'proj-' + proj.id" class="sb-sub-row">
              <input
                ref="editInputEl"
                class="sb-edit-input"
                v-model="editLabel"
                @keydown.enter="confirmEditProject(proj)"
                @keydown.escape="cancelEdit"
                @blur="confirmEditProject(proj)"
              />
            </div>

            <!-- Project normal row -->
            <div v-else class="sb-sub-row">
              <router-link
                class="sb-sub-item"
                :class="{ active: isSubActive(node.category.id, proj.id) }"
                :to="`/journal/${currentSpace}/${node.category.id}/${proj.id}`"
              >- {{ proj.label }}<span class="sub-cnt">{{ countEntries(currentSpace, node.category.id, proj.id) }}</span></router-link>
              <div class="row-acts">
                <button
                  class="pin-btn"
                  :class="{ pinned: isPinned(currentSpace, node.category.id, proj.id) }"
                  @click="togglePin(currentSpace, node.category.id, proj.id)"
                >{{ isPinned(currentSpace, node.category.id, proj.id) ? '★' : '☆' }}</button>
                <button class="act-btn" @click.stop="startEdit('proj-' + proj.id, proj.label)">✎</button>
                <button class="act-btn act-del" @click.stop="startDelete('proj-' + proj.id)">×</button>
              </div>
            </div>

            <!-- Project delete confirm -->
            <div v-if="confirmDeleteId === 'proj-' + proj.id" class="confirm-row">
              delete project?
              <button class="cf-yes" @click="doDeleteProject(proj.id, proj.category_id, proj.space_id)">yes</button>
              <button class="cf-no" @click="cancelDelete">no</button>
            </div>
          </div>
        </div>

        <button class="sb-add" @click="openAddProject(node.category.id)">+ add</button>
      </div>
    </div>

    <div style="padding: 2px 8px">
      <button class="sb-add" @click="openAddCategory">+ add category</button>
    </div>
  </div>

  <InputDialog
    :open="dialogOpen"
    :title="dialogTitle"
    :placeholder="dialogPlaceholder"
    @confirm="onDialogConfirm"
    @cancel="onDialogCancel"
  />
</template>

<style scoped>
.sb-tree {
  padding: 4px 0;
  flex: 1;
  overflow-y: auto;
}

.sb-cat-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
}

.sb-cat-toggle {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.ch {
  font-size: 0.5rem;
  color: var(--text-dim);
  transition: transform var(--dur-mid) var(--ease);
}

.ch.open {
  transform: rotate(90deg);
}

.sb-cat-label {
  flex: 1;
  font-family: var(--mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sb-cat-row:hover .sb-cat-label {
  color: var(--text-mid);
}

.row-acts {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}

.sb-cat-row:hover .row-acts,
.sb-sub-row:hover .row-acts {
  opacity: 1;
}

.act-btn {
  padding: 0 2px;
  font-family: var(--mono);
  font-size: 0.6rem;
  color: var(--text-dim);
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  transition: color var(--dur-fast) var(--ease);
}

.act-btn:hover {
  color: var(--text);
}

.act-del:hover {
  color: var(--red);
}

.pin-btn {
  font-size: 0.55rem;
  color: var(--text-dim);
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
  transition: opacity var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}

.sb-leaf-row:hover .pin-btn,
.sb-sub-row:hover .pin-btn {
  opacity: 1;
}

.pin-btn.pinned {
  opacity: 1;
  color: var(--accent);
}

.pin-btn:hover {
  color: var(--accent);
}

.sb-edit-input {
  flex: 1;
  background: var(--bg-hover);
  border: 1px solid var(--accent-dim);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.65rem;
  padding: 1px 4px;
  outline: none;
  min-width: 0;
}

.sb-cat-body {
  padding-left: 8px;
}

.sb-cat-body.collapsed {
  display: none;
}

.sb-leaf-row {
  display: flex;
  align-items: center;
}

.sb-leaf {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  flex: 1;
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--text-dim);
  background: none;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition: all var(--dur-fast) var(--ease);
  min-width: 0;
}

.sb-leaf:hover {
  color: var(--text);
  background: var(--bg-hover);
}

.sb-leaf.active {
  color: var(--accent);
  background: var(--accent-dim);
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.cnt {
  margin-left: auto;
  font-size: 0.55rem;
  color: var(--text-dim);
}

.sb-sub {
  padding-left: 10px;
}

.sb-proj-wrap {
  display: flex;
  flex-direction: column;
}

.sb-sub-row {
  display: flex;
  align-items: center;
  padding: 1px 0;
}

.sb-sub-item {
  display: flex;
  align-items: center;
  padding: 1px 6px;
  flex: 1;
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--text-dim);
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition: all var(--dur-fast) var(--ease);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sb-sub-item:hover {
  color: var(--text-mid);
}

.sb-sub-item.active {
  color: var(--accent);
}

.sub-cnt {
  margin-left: auto;
  font-size: 0.5rem;
  color: var(--text-dim);
  flex-shrink: 0;
}

.confirm-row {
  padding: 2px 6px;
  font-family: var(--mono);
  font-size: 0.58rem;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--red-dim);
}

.cf-yes, .cf-no {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.58rem;
  padding: 0 2px;
}

.cf-yes {
  color: var(--red);
}

.cf-no {
  color: var(--text-dim);
}

.cf-yes:hover, .cf-no:hover {
  color: var(--text);
}

.sb-add {
  display: block;
  padding: 1px 6px;
  font-family: var(--mono);
  font-size: 0.6rem;
  color: var(--text-dim);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  opacity: 0.5;
}

.sb-add:hover {
  opacity: 1;
  color: var(--accent);
}
</style>
