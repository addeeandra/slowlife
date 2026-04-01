<script setup lang="ts">
import { computed } from 'vue'
import { useSpaces } from '../composables/useSpaces'
import { useQuickCapture } from '../composables/useQuickCapture'
import MoodPicker from './journal/MoodPicker.vue'
import TagRow from './journal/TagRow.vue'
import WritingPrompt from './journal/WritingPrompt.vue'

const { spaces, categories, projects } = useSpaces()
const {
  isOpen,
  text,
  selectedSpace,
  selectedCategory,
  selectedProject,
  selectedMood,
  selectedTags,
  isSaving,
  spaceCategories,
  categoryProjects,
  close,
  save,
} = useQuickCapture()

const canSave = computed(() => !!selectedCategory.value && text.value.trim().length > 0 && !isSaving.value)

function pickSpace(id: string) {
  selectedSpace.value = id
}

function pickCategory(id: string) {
  selectedCategory.value = id
}

function pickProject(id: string | null) {
  selectedProject.value = id
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="qc-backdrop" @click="close"></div>
    <div v-if="isOpen" class="qc-modal">
      <div class="qc-head">
        <div>
          <div class="qc-title">quick capture</div>
          <div class="qc-hint">ctrl+shift+k</div>
        </div>
        <button class="qc-close" @click="close">esc</button>
      </div>

      <div class="space-tabs">
        <button
          v-for="s in spaces"
          :key="s.id"
          class="pill"
          :class="{ active: selectedSpace === s.id }"
          @click="pickSpace(s.id)"
        >
          <span class="dot" :style="{ background: s.color }"></span>
          {{ s.label }}
        </button>
      </div>

      <div class="qc-grid">
        <div class="qc-col">
          <div class="c-t">category</div>
          <div class="pill-list">
            <button
              v-for="c in spaceCategories"
              :key="c.id"
              class="pill"
              :class="{ active: selectedCategory === c.id }"
              @click="pickCategory(c.id)"
            >
              {{ c.label }}
            </button>
          </div>
        </div>
        <div class="qc-col">
          <div class="c-t">project (optional)</div>
          <div class="pill-list">
            <button
              class="pill"
              :class="{ active: selectedProject === null }"
              @click="pickProject(null)"
            >
              none
            </button>
            <button
              v-for="p in categoryProjects"
              :key="p.id"
              class="pill"
              :class="{ active: selectedProject === p.id }"
              @click="pickProject(p.id)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>

      <MoodPicker v-model="selectedMood" />

      <div class="editor-c">
        <textarea
          id="qc-editor"
          v-model="text"
          placeholder="capture a thought..."
          @keydown.escape="close"
          @keydown.meta.enter.prevent="save"
          @keydown.ctrl.enter.prevent="save"
        ></textarea>
        <div class="editor-ft">
          <div class="meta">
            <span class="wc">{{ text.trim().length ? text.trim().split(/\\s+/).length : 0 }} words</span>
            <span class="sp">{{ selectedMood ? 'mood ' + selectedMood : 'no mood' }}</span>
          </div>
          <div class="actions">
            <button class="btn ghost" @click="close">cancel</button>
            <button class="btn" :disabled="!canSave" @click="save">
              {{ isSaving ? 'saving...' : 'save' }}
            </button>
          </div>
        </div>
      </div>

      <div class="c">
        <div class="c-t">tags</div>
        <TagRow :space="selectedSpace" v-model="selectedTags" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.qc-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.qc-modal {
  position: fixed;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  width: min(700px, 96vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.qc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.qc-title {
  font-family: var(--mono);
  font-size: 0.9rem;
}

.qc-hint {
  font-size: 0.68rem;
  color: var(--text-dim);
}

.qc-close {
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 0.7rem;
  padding: 4px 8px;
  cursor: pointer;
}

.qc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.space-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.qc-col {
  border: 1px solid var(--border);
  padding: 10px 10px 8px;
  background: var(--bg-card);
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
  font-size: 0.72rem;
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
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.editor-c {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 14px;
  margin: 12px 0;
}

.editor-c textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--mono);
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--text);
  background: transparent;
  min-height: 140px;
}

.editor-c textarea::placeholder {
  color: var(--text-dim);
}

.editor-ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  gap: 8px;
}

.meta {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--text-dim);
  font-size: 0.6rem;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 5px 12px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  cursor: pointer;
  transition: opacity var(--dur-base) var(--ease);
}

.btn:hover {
  opacity: 0.85;
}

.btn:disabled {
  opacity: 0.25;
  cursor: default;
}

.btn.ghost {
  background: transparent;
  color: var(--text);
}

.c {
  margin-top: 10px;
}

@media (max-width: 720px) {
  .space-tabs {
    flex-wrap: wrap;
  }
  .qc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
