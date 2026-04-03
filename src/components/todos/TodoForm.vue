<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import type { Todo, TodoPriority, TodoComplexity, TodoStatus } from '../../core/types'
import { TODO_PRIORITIES, TODO_COMPLEXITIES, TODO_STATUSES } from '../../core/constants'
import { useSpaces } from '../../composables/useSpaces'

const props = defineProps<{
  open: boolean
  todo?: Todo | null
}>()

const emit = defineEmits<{
  save: [data: {
    title: string
    description: string | null
    priority: TodoPriority
    complexity: TodoComplexity
    status: TodoStatus
    space_id: string | null
    category_id: string | null
    project_id: string | null
    due_date: string | null
  }]
  delete: [id: number]
  close: []
}>()

const { spaces, categories, projects } = useSpaces()

const title = ref('')
const description = ref('')
const priority = ref<TodoPriority>('P2')
const complexity = ref<TodoComplexity>('C2')
const status = ref<TodoStatus>('open')
const spaceId = ref<string | null>(null)
const categoryId = ref<string | null>(null)
const projectId = ref<string | null>(null)
const dueDate = ref('')
const confirmDelete = ref(false)

const isEdit = computed(() => !!props.todo)
const canSave = computed(() => title.value.trim().length > 0)

const spaceCategories = computed(() =>
  spaceId.value ? categories.value.filter(c => c.space_id === spaceId.value) : []
)

const categoryProjects = computed(() =>
  categoryId.value && spaceId.value
    ? projects.value.filter(p => p.category_id === categoryId.value && p.space_id === spaceId.value)
    : []
)

const priorityKeys = Object.keys(TODO_PRIORITIES) as TodoPriority[]
const complexityKeys = Object.keys(TODO_COMPLEXITIES) as TodoComplexity[]
const statusKeys = Object.keys(TODO_STATUSES) as TodoStatus[]

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, (open) => {
  if (open) {
    document.addEventListener('keydown', onKeydown)
    confirmDelete.value = false
    if (props.todo) {
      title.value = props.todo.title
      description.value = props.todo.description || ''
      priority.value = props.todo.priority
      complexity.value = props.todo.complexity
      status.value = props.todo.status
      spaceId.value = props.todo.space_id
      categoryId.value = props.todo.category_id
      projectId.value = props.todo.project_id
      dueDate.value = props.todo.due_date || ''
    } else {
      title.value = ''
      description.value = ''
      priority.value = 'P2'
      complexity.value = 'C2'
      status.value = 'open'
      spaceId.value = null
      categoryId.value = null
      projectId.value = null
      dueDate.value = ''
    }
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

function pickSpace(id: string | null) {
  spaceId.value = id
  categoryId.value = null
  projectId.value = null
}

function pickCategory(id: string | null) {
  categoryId.value = id
  projectId.value = null
}

function handleSave() {
  if (!canSave.value) return
  emit('save', {
    title: title.value.trim(),
    description: description.value.trim() || null,
    priority: priority.value,
    complexity: complexity.value,
    status: status.value,
    space_id: spaceId.value,
    category_id: categoryId.value,
    project_id: projectId.value,
    due_date: dueDate.value || null,
  })
}

function handleDelete() {
  if (!props.todo) return
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  emit('delete', props.todo.id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ef-backdrop" @click="emit('close')"></div>
    <div v-if="open" class="ef-modal">
      <div class="ef-head">
        <div class="ef-title">{{ isEdit ? 'edit todo' : 'new todo' }}</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="ef-field">
        <input
          v-model="title"
          type="text"
          placeholder="todo title"
          class="ef-input"
          @keydown.ctrl.enter.prevent="handleSave"
        />
      </div>

      <div class="ef-field">
        <label class="ef-label">description (optional)</label>
        <textarea
          v-model="description"
          class="ef-textarea"
          placeholder="details..."
          rows="3"
        ></textarea>
      </div>

      <div class="ef-field">
        <label class="ef-label">priority</label>
        <div class="pill-list">
          <button
            v-for="p in priorityKeys"
            :key="p"
            class="pill"
            :class="{ active: priority === p }"
            :style="priority === p ? { borderColor: TODO_PRIORITIES[p].color, color: TODO_PRIORITIES[p].color, background: TODO_PRIORITIES[p].dimColor } : {}"
            @click="priority = p"
          >
            <span class="dot" :style="{ background: TODO_PRIORITIES[p].color }"></span>
            {{ p }} {{ TODO_PRIORITIES[p].label }}
          </button>
        </div>
      </div>

      <div class="ef-field">
        <label class="ef-label">complexity</label>
        <div class="pill-list">
          <button
            v-for="c in complexityKeys"
            :key="c"
            class="pill"
            :class="{ active: complexity === c }"
            @click="complexity = c"
          >
            {{ c }} {{ TODO_COMPLEXITIES[c].label }}
          </button>
        </div>
      </div>

      <div v-if="isEdit" class="ef-field">
        <label class="ef-label">status</label>
        <div class="pill-list">
          <button
            v-for="s in statusKeys"
            :key="s"
            class="pill"
            :class="{ active: status === s }"
            @click="status = s"
          >
            {{ TODO_STATUSES[s].label }}
          </button>
        </div>
      </div>

      <div class="ef-field">
        <label class="ef-label">due date (optional)</label>
        <input v-model="dueDate" type="date" class="ef-input" />
      </div>

      <div class="ef-field">
        <label class="ef-label">space (optional)</label>
        <div class="pill-list">
          <button
            class="pill"
            :class="{ active: spaceId === null }"
            @click="pickSpace(null)"
          >
            none
          </button>
          <button
            v-for="s in spaces"
            :key="s.id"
            class="pill"
            :class="{ active: spaceId === s.id }"
            @click="pickSpace(s.id)"
          >
            <span class="dot" :style="{ background: s.color }"></span>
            {{ s.label }}
          </button>
        </div>
      </div>

      <div v-if="spaceId && spaceCategories.length" class="ef-field">
        <label class="ef-label">category</label>
        <div class="pill-list">
          <button
            class="pill"
            :class="{ active: categoryId === null }"
            @click="pickCategory(null)"
          >
            none
          </button>
          <button
            v-for="c in spaceCategories"
            :key="c.id"
            class="pill"
            :class="{ active: categoryId === c.id }"
            @click="pickCategory(c.id)"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <div v-if="categoryId && categoryProjects.length" class="ef-field">
        <label class="ef-label">project</label>
        <div class="pill-list">
          <button
            class="pill"
            :class="{ active: projectId === null }"
            @click="projectId = null"
          >
            none
          </button>
          <button
            v-for="p in categoryProjects"
            :key="p.id"
            class="pill"
            :class="{ active: projectId === p.id }"
            @click="projectId = p.id"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="ef-footer">
        <div class="ef-left">
          <button v-if="isEdit" class="btn danger" @click="handleDelete">
            {{ confirmDelete ? 'confirm delete' : 'delete' }}
          </button>
        </div>
        <div class="ef-actions">
          <button class="btn ghost" @click="emit('close')">cancel</button>
          <button class="btn" :disabled="!canSave" @click="handleSave">save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ef-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.ef-modal {
  position: fixed;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  width: min(560px, 96vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  max-height: 88vh;
  overflow-y: auto;
}

.ef-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.ef-title {
  font-family: var(--mono);
  font-size: 0.9rem;
}

.ef-field {
  margin-bottom: 10px;
}

.ef-label {
  display: block;
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.ef-input {
  width: 100%;
  font-family: var(--mono);
  font-size: 0.78rem;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  outline: none;
}

.ef-input:focus {
  border-color: var(--accent);
}

.ef-textarea {
  width: 100%;
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  resize: vertical;
  line-height: 1.6;
}

.ef-textarea:focus {
  border-color: var(--accent);
}

.pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-mid);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.68rem;
  transition: all var(--dur-base) var(--ease);
}

.pill:hover {
  color: var(--text);
  border-color: var(--accent);
}

.pill.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ef-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.ef-left {
  display: flex;
}

.ef-actions {
  display: flex;
  gap: 8px;
}

.b-close {
  font-family: var(--mono);
  font-size: 0.6rem;
  color: var(--text-dim);
  background: none;
  border: 1px solid var(--border);
  padding: 2px 8px;
  cursor: pointer;
}

@media (max-width: 720px) {
  .pill-list {
    gap: 4px;
  }
}
</style>
