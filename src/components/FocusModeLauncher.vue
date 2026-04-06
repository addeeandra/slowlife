<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import Select from './Select.vue'
import { useSpaces } from '../composables/useSpaces'
import { useFocusMode, type FocusTarget } from '../composables/useFocusMode'

const { spaces, categories, projects } = useSpaces()
const { isLauncherOpen, lastTarget, closeLauncher, enter } = useFocusMode()

const kind = ref<FocusTarget['kind']>('category')
const spaceId = ref('')
const categoryId = ref('')
const projectId = ref<string | null>(null)

const spaceCategories = computed(() =>
  categories.value.filter(item => item.space_id === spaceId.value)
)

const categoryProjects = computed(() =>
  projects.value.filter(item => item.space_id === spaceId.value && item.category_id === categoryId.value)
)

const spaceOptions = computed(() => spaces.value.map(s => ({ value: s.id, label: s.label })))
const categoryOptions = computed(() => spaceCategories.value.map(c => ({ value: c.id, label: c.label })))
const projectOptions = computed(() => categoryProjects.value.map(p => ({ value: p.id, label: p.label })))

const canEnter = computed(() => {
  if (!spaceId.value || !categoryId.value) return false
  if (kind.value === 'project') return !!projectId.value
  return true
})

watch(isLauncherOpen, (open) => {
  if (open) {
    const fallbackSpace = spaces.value[0]?.id || ''
    const fallbackCategory = categories.value.find(item => item.space_id === fallbackSpace)?.id || ''
    kind.value = lastTarget.value?.kind || 'category'
    spaceId.value = lastTarget.value?.spaceId || fallbackSpace
    categoryId.value = lastTarget.value?.categoryId || categories.value.find(item => item.space_id === spaceId.value)?.id || fallbackCategory
    projectId.value = lastTarget.value?.projectId || projects.value.find(
      item => item.space_id === spaceId.value && item.category_id === categoryId.value
    )?.id || null
  }
})

watch(spaceId, () => {
  if (!spaceCategories.value.some(item => item.id === categoryId.value)) {
    categoryId.value = spaceCategories.value[0]?.id || ''
  }
})

watch(categoryId, () => {
  if (!categoryProjects.value.some(item => item.id === projectId.value)) {
    projectId.value = categoryProjects.value[0]?.id || null
  }
})

async function submit() {
  if (!canEnter.value) return
  await enter({
    kind: kind.value,
    spaceId: spaceId.value,
    categoryId: categoryId.value,
    projectId: kind.value === 'project' ? projectId.value : null,
  })
}
</script>

<template>
  <BaseModal :open="isLauncherOpen" width="min(520px, 94vw)" top="10%" @close="closeLauncher">
    <div class="fm-modal-inner" @keydown.ctrl.enter.prevent="submit" @keydown.meta.enter.prevent="submit">
      <div class="fm-head">
        <div>
          <div class="fm-title">enter focus mode</div>
          <div class="fm-sub">choose what this session is for</div>
        </div>
        <button type="button" class="b-close" @click="closeLauncher">esc</button>
      </div>

      <div class="fm-field">
        <div class="fm-label">scope</div>
        <div class="fm-pills">
          <button class="fm-pill" :class="{ active: kind === 'category' }" @click="kind = 'category'">category</button>
          <button class="fm-pill" :class="{ active: kind === 'project' }" @click="kind = 'project'">project</button>
        </div>
      </div>

      <div class="fm-field">
        <div class="fm-label">space</div>
        <Select v-model="spaceId" :options="spaceOptions" placeholder="select space" />
      </div>

      <div class="fm-field">
        <div class="fm-label">category</div>
        <Select v-model="categoryId" :options="categoryOptions" placeholder="select category" />
      </div>

      <div v-if="kind === 'project'" class="fm-field">
        <div class="fm-label">project</div>
        <Select v-model="projectId" :options="projectOptions" placeholder="select project" />
      </div>

      <div class="fm-note">
        focus mode hides the sidebar and keeps journal, todos, and events centered on this context.
      </div>

      <div class="fm-actions">
        <button class="btn ghost" @click="closeLauncher">cancel</button>
        <button class="btn" :disabled="!canEnter" @click="submit">enter</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.fm-modal-inner {
  padding: 18px;
}

.fm-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.fm-title {
  font-size: 0.92rem;
}

.fm-sub {
  font-size: 0.65rem;
  color: var(--text-dim);
  margin-top: 3px;
}

.fm-field {
  margin-bottom: 12px;
}

.fm-label {
  display: block;
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 5px;
}

.fm-pills {
  display: flex;
  gap: 8px;
}

.fm-pill {
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-mid);
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 7px 10px;
  cursor: pointer;
}

.fm-pill.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);
}

.fm-note {
  padding: 10px 12px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-mid);
  font-size: 0.68rem;
  line-height: 1.6;
}

.fm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
