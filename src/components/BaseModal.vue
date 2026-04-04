<script setup lang="ts">
import { computed, onBeforeUnmount, watch, type CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  width?: string
  top?: string
  scrollable?: boolean
}>(), {
  width: 'min(520px, 96vw)',
  top: '8%',
  scrollable: true,
})

const emit = defineEmits<{
  close: []
}>()

const modalStyle = computed<CSSProperties>(() => ({
  width: props.width,
  top: props.top,
  maxHeight: props.scrollable ? '88vh' : undefined,
  overflowY: props.scrollable ? 'auto' : undefined,
}))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

watch(() => props.open, (open) => {
  if (open) {
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="bm-backdrop" @click="emit('close')"></div>
    <div v-if="open" class="bm-modal" :style="modalStyle">
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
.bm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.bm-modal {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}
</style>
