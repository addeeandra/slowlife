<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import { useSpaces } from '../../composables/useSpaces'
import type { AssetContext } from '../../composables/useAssetDialog'
import type { Asset } from '../../core/types'

const props = defineProps<{
  open: boolean
  asset?: Asset | null
  draftContext?: AssetContext | null
}>()

const emit = defineEmits<{
  save: [data: {
    title: string
    url: string
    description: string | null
    tags: string[]
    space_id: string
    category_id: string
    project_id: string | null
  }]
  delete: [id: number]
  close: []
}>()

const { spaces, categories, projects } = useSpaces()

const title = ref('')
const url = ref('')
const description = ref('')
const tagsText = ref('')
const scopeMode = ref<'category' | 'project'>('category')
const confirmDelete = ref(false)

const isEdit = computed(() => !!props.asset)
const contextSpaceId = computed(() => props.draftContext?.space_id || props.asset?.space_id || '')
const contextCategoryId = computed(() => props.draftContext?.category_id || props.asset?.category_id || '')
const contextProjectId = computed(() => props.draftContext?.project_id || props.asset?.project_id || null)
const canChooseProjectScope = computed(() => !!contextProjectId.value)

const spaceLabel = computed(() =>
  spaces.value.find(item => item.id === contextSpaceId.value)?.label || contextSpaceId.value
)

const categoryLabel = computed(() =>
  categories.value.find(item => item.id === contextCategoryId.value && item.space_id === contextSpaceId.value)?.label || contextCategoryId.value
)

const projectLabel = computed(() =>
  contextProjectId.value
    ? projects.value.find(
        item => item.id === contextProjectId.value
          && item.category_id === contextCategoryId.value
          && item.space_id === contextSpaceId.value
      )?.label || contextProjectId.value
    : ''
)

const normalizedUrl = computed(() => normalizeUrl(url.value))

const canSave = computed(() => {
  return !!title.value.trim() && !!normalizedUrl.value && !!contextSpaceId.value && !!contextCategoryId.value
})

const contextLabel = computed(() => {
  const parts = [spaceLabel.value, categoryLabel.value]
  if (contextProjectId.value) parts.push(projectLabel.value)
  return parts.filter(Boolean).join(' / ')
})

watch(() => props.open, open => {
  if (!open) return

  confirmDelete.value = false
  if (props.asset) {
    title.value = props.asset.title
    url.value = props.asset.url
    description.value = props.asset.description || ''
    tagsText.value = props.asset.tags.join(', ')
    scopeMode.value = props.asset.project_id ? 'project' : 'category'
    return
  }

  title.value = ''
  url.value = ''
  description.value = ''
  tagsText.value = ''
  scopeMode.value = props.draftContext?.project_id ? 'project' : 'category'
})

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    return parsed.toString()
  } catch {
    return ''
  }
}

function parseTags(value: string) {
  return [...new Set(
    value
      .split(/[\n,]/)
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean)
  )]
}

function handleSave() {
  if (!canSave.value) return
  emit('save', {
    title: title.value.trim(),
    url: normalizedUrl.value,
    description: description.value.trim() || null,
    tags: parseTags(tagsText.value),
    space_id: contextSpaceId.value,
    category_id: contextCategoryId.value,
    project_id: scopeMode.value === 'project' ? contextProjectId.value : null,
  })
}

function handleDelete() {
  if (!props.asset) return
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  emit('delete', props.asset.id)
}
</script>

<template>
  <BaseModal :open="open" width="min(560px, 96vw)" top="6%" @close="emit('close')">
    <div class="af-modal-inner" @keydown.ctrl.enter.prevent="handleSave" @keydown.meta.enter.prevent="handleSave">
      <div class="af-head">
        <div>
          <div class="af-title">{{ isEdit ? 'edit asset' : 'new asset' }}</div>
          <div class="af-context">{{ contextLabel }}</div>
        </div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="af-field">
        <input v-model="title" type="text" class="af-input" placeholder="asset title" />
      </div>

      <div class="af-field">
        <input v-model="url" type="text" class="af-input" placeholder="https://github.com/org/repo" />
        <div v-if="url.trim() && !normalizedUrl" class="af-hint error">enter a valid http or https url</div>
      </div>

      <div class="af-field">
        <label class="af-label">description (optional)</label>
        <textarea v-model="description" class="af-textarea" rows="3" placeholder="what this link is for..."></textarea>
      </div>

      <div class="af-field">
        <label class="af-label">tags (optional)</label>
        <input v-model="tagsText" type="text" class="af-input" placeholder="code, documents, planning" />
        <div class="af-hint">comma-separated. tags are stored lowercase for filtering.</div>
      </div>

      <div v-if="canChooseProjectScope" class="af-field">
        <label class="af-label">scope</label>
        <div class="af-pills">
          <button class="af-pill" :class="{ active: scopeMode === 'project' }" @click="scopeMode = 'project'">
            this project
          </button>
          <button class="af-pill" :class="{ active: scopeMode === 'category' }" @click="scopeMode = 'category'">
            shared to category
          </button>
        </div>
      </div>

      <div class="af-footer">
        <div>
          <button v-if="isEdit" class="btn danger" @click="handleDelete">
            {{ confirmDelete ? 'confirm delete' : 'delete' }}
          </button>
        </div>
        <div class="af-actions">
          <button class="btn ghost" @click="emit('close')">cancel</button>
          <button class="btn" :disabled="!canSave" @click="handleSave">save</button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.af-modal-inner {
  padding: 16px;
}

.af-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.af-title {
  font-size: 0.9rem;
  color: var(--text);
}

.af-context {
  font-size: 0.62rem;
  color: var(--text-dim);
  margin-top: 3px;
}

.af-field + .af-field {
  margin-top: 12px;
}

.af-label {
  display: block;
  font-size: 0.6rem;
  color: var(--text-dim);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.af-input,
.af-textarea {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 8px 10px;
}

.af-input:focus,
.af-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.af-textarea {
  resize: vertical;
  min-height: 92px;
}

.af-hint {
  margin-top: 5px;
  font-size: 0.58rem;
  color: var(--text-dim);
}

.af-hint.error {
  color: var(--red);
}

.af-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.af-pill {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 0.65rem;
  padding: 5px 8px;
  cursor: pointer;
}

.af-pill.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}

.af-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.af-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .af-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .af-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>
