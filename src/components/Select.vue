<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'

export interface SelectOption {
  value: string | number | null
  label: string
  color?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  compact?: boolean
}>(), {
  placeholder: 'select',
  disabled: false,
  compact: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(-1)
const menuStyle = ref<CSSProperties>({})

const enabledOptions = computed(() => props.options.filter(option => !option.disabled))
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue))
const selectedOption = computed(() => props.options[selectedIndex.value] ?? null)

watch(isOpen, (open) => {
  if (open) {
    const initialIndex = selectedIndex.value >= 0 && !props.options[selectedIndex.value]?.disabled
      ? selectedIndex.value
      : props.options.findIndex(option => !option.disabled)
    activeIndex.value = initialIndex
    updateMenuPosition()
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleDocumentKeydown)
    window.addEventListener('resize', close)
    document.addEventListener('scroll', handleScroll, true)
  } else {
    activeIndex.value = -1
    removeListeners()
  }
})

onBeforeUnmount(removeListeners)

function removeListeners() {
  document.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('resize', close)
  document.removeEventListener('scroll', handleScroll, true)
}

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function selectOption(option: SelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  close()
  triggerRef.value?.focus()
}

function moveActive(step: number) {
  if (!enabledOptions.value.length) return

  const currentEnabledIndex = enabledOptions.value.findIndex(option => option.value === props.options[activeIndex.value]?.value)
  const nextEnabledIndex = currentEnabledIndex === -1
    ? (step > 0 ? 0 : enabledOptions.value.length - 1)
    : (currentEnabledIndex + step + enabledOptions.value.length) % enabledOptions.value.length
  const nextValue = enabledOptions.value[nextEnabledIndex]?.value
  activeIndex.value = props.options.findIndex(option => option.value === nextValue)
}

function handleTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) {
      isOpen.value = true
      return
    }
    moveActive(event.key === 'ArrowDown' ? 1 : -1)
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
  }
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    triggerRef.value?.focus()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const option = props.options[activeIndex.value]
    if (option) selectOption(option)
  }
}

function updateMenuPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const gap = props.compact ? 2 : 4
  menuStyle.value = {
    top: `${rect.bottom + gap}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function handleScroll(event: Event) {
  if (menuRef.value?.contains(event.target as Node)) return
  close()
}

function handlePointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (!rootRef.value?.contains(target) && !menuRef.value?.contains(target)) {
    close()
  }
}

function handleOptionMouseenter(index: number) {
  activeIndex.value = index
}
</script>

<template>
  <div ref="rootRef" class="sl-select" :class="{ open: isOpen, disabled, compact }">
    <button
      ref="triggerRef"
      type="button"
      class="sl-select-trigger"
      :class="{ placeholder: !selectedOption }"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :disabled="disabled"
      @click="toggle"
      @keydown="handleTriggerKeydown"
    >
      <span class="sl-select-value">
        <span v-if="selectedOption?.color" class="sl-select-dot" :style="{ background: selectedOption.color }"></span>
        {{ selectedOption?.label || placeholder }}
      </span>
      <span class="sl-select-caret">v</span>
    </button>

  </div>

  <Teleport to="body">
    <div v-if="isOpen" ref="menuRef" class="sl-select-menu" role="listbox" :style="menuStyle">
      <button
        v-for="(option, index) in options"
        :key="`${String(option.value)}-${index}`"
        type="button"
        class="sl-select-option"
        :class="{
          active: activeIndex === index,
          selected: modelValue === option.value,
          disabled: option.disabled,
        }"
        :aria-selected="modelValue === option.value"
        :disabled="option.disabled"
        @mouseenter="handleOptionMouseenter(index)"
        @click="selectOption(option)"
      >
        <span class="sl-select-option-main">
          <span v-if="option.color" class="sl-select-dot" :style="{ background: option.color }"></span>
          <span class="sl-select-option-label">{{ option.label }}</span>
        </span>
        <span v-if="modelValue === option.value" class="sl-select-mark">selected</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.sl-select {
  position: relative;
}

.sl-select-trigger {
  width: 100%;
  min-height: 37px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.78rem;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
}

.sl-select-trigger:focus {
  outline: none;
  border-color: var(--accent);
}

.sl-select-trigger.placeholder {
  color: var(--text-dim);
}

.sl-select.disabled .sl-select-trigger {
  opacity: 0.4;
  cursor: default;
}

.sl-select.open .sl-select-trigger {
  border-color: var(--accent);
}

.sl-select.compact .sl-select-trigger {
  min-height: 28px;
  font-size: 0.72rem;
  padding: 4px 8px;
  background: var(--bg-card);
}

.sl-select-value,
.sl-select-option-main {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sl-select-value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sl-select-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 999px;
}

.sl-select-caret {
  flex: 0 0 auto;
  color: var(--text-dim);
  font-size: 0.64rem;
  text-transform: lowercase;
}

.sl-select-menu {
  position: fixed;
  z-index: 140;
  max-height: 220px;
  overflow-y: auto;
  background: var(--bg);
  border: 1px solid var(--border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
}

.sl-select-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: none;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.72rem;
  text-align: left;
  padding: 8px 10px;
  cursor: pointer;
}

.sl-select-option:last-child {
  border-bottom: none;
}

.sl-select.compact .sl-select-option {
  font-size: 0.68rem;
  padding: 6px 8px;
}

.sl-select-option:hover,
.sl-select-option.active {
  background: var(--bg-hover);
}

.sl-select-option.selected {
  color: var(--accent);
}

.sl-select-option.selected .sl-select-mark {
  color: var(--accent);
}

.sl-select-option.disabled {
  color: var(--text-dim);
  cursor: default;
}

.sl-select-option-label,
.sl-select-mark {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sl-select-mark {
  flex: 0 0 auto;
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}

.sl-select.compact .sl-select-mark {
  font-size: 0.54rem;
}
</style>
