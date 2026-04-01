<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSpaces } from '../../composables/useSpaces'
import { useJournal } from '../../composables/useJournal'
import InputDialog from '../InputDialog.vue'

const route = useRoute()
const { currentSpace, spaceTree, expandedCategories, toggleCategory, addCategory, addProject } = useSpaces()
const { countEntries } = useJournal()

const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogPlaceholder = ref('')
const dialogTarget = ref<string | null>(null) // null = category, string = project for that category

function isLeafActive(categoryId: string): boolean {
  return (
    route.name === 'journal' &&
    route.params.category === categoryId &&
    !route.params.item
  )
}

function isSubActive(categoryId: string, itemId: string): boolean {
  return (
    route.name === 'journal' &&
    route.params.category === categoryId &&
    route.params.item === itemId
  )
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
</script>

<template>
  <div class="sb-tree">
    <div v-for="node in spaceTree(currentSpace)" :key="node.category.id" style="padding: 0 4px">
      <button class="sb-cat-hdr" @click="toggleCategory(node.category.id)">
        <span class="ch" :class="{ open: expandedCategories.has(node.category.id) }">&#9654;</span>
        {{ node.category.label }}
      </button>
      <div
        class="sb-cat-body"
        :class="{ collapsed: !expandedCategories.has(node.category.id) }"
      >
        <router-link
          class="sb-leaf"
          :class="{ active: isLeafActive(node.category.id) }"
          :to="`/journal/${currentSpace}/${node.category.id}`"
        >
          <span class="dot"></span>all<span class="cnt">{{ countEntries(currentSpace, node.category.id) }}</span>
        </router-link>
        <div v-if="node.projects.length" class="sb-sub">
          <router-link
            v-for="proj in node.projects"
            :key="proj.id"
            class="sb-sub-item"
            :class="{ active: isSubActive(node.category.id, proj.id) }"
            :to="`/journal/${currentSpace}/${node.category.id}/${proj.id}`"
          >
            {{ proj.label }}<span class="sub-cnt">{{ countEntries(currentSpace, node.category.id, proj.id) }}</span>
          </router-link>
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

.sb-cat-hdr {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  width: 100%;
  font-family: var(--mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.sb-cat-hdr:hover {
  color: var(--text-mid);
}

.ch {
  font-size: 0.5rem;
  transition: transform 0.15s;
}

.ch.open {
  transform: rotate(90deg);
}

.sb-cat-body {
  padding-left: 8px;
}

.sb-cat-body.collapsed {
  display: none;
}

.sb-leaf {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  width: 100%;
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--text-dim);
  background: none;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.08s;
}

.sb-leaf:hover {
  color: var(--text);
  background: var(--bg-hover);
}

.sb-leaf.active {
  color: var(--accent);
  background: var(--accent-dim);
}

.cnt {
  margin-left: auto;
  font-size: 0.55rem;
  color: var(--text-dim);
}

.sb-sub {
  padding-left: 10px;
}

.sb-sub-item {
  display: flex;
  align-items: center;
  padding: 1px 6px;
  width: 100%;
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--text-dim);
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.08s;
}

.sb-sub-item::before {
  content: '- ';
  color: var(--text-dim);
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
