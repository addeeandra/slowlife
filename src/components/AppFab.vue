<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}


</script>

<template>
  <button class="fab" @click="toggle">?</button>
  <div class="sc-panel" :class="{ open: isOpen }">
    <h3>shortcuts</h3>
    <div class="sc-r"><span class="sc-l">dashboard</span><span class="sc-k">ctrl+1</span></div>
    <div class="sc-r"><span class="sc-l">events</span><span class="sc-k">ctrl+2</span></div>
    <div class="sc-r"><span class="sc-l">finances</span><span class="sc-k">ctrl+3</span></div>
    <div class="sc-r"><span class="sc-l">new entry</span><span class="sc-k">ctrl+n</span></div>
    <div class="sc-r"><span class="sc-l">toggle sidebar</span><span class="sc-k">ctrl+s</span></div>
  </div>
  <Teleport to="body">
    <div v-if="isOpen" class="fab-backdrop" @click="isOpen = false"></div>
  </Teleport>
</template>

<style scoped>
.fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 50;
  width: 32px;
  height: 32px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-dim);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--dur-base) var(--ease);
}

.fab:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.sc-panel {
  display: none;
  position: fixed;
  bottom: 60px;
  right: 20px;
  z-index: 50;
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 12px 14px;
  min-width: 220px;
}

.sc-panel.open {
  display: block;
}

.sc-panel h3 {
  font-family: var(--mono);
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.sc-r {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0;
}

.sc-l {
  font-size: 0.68rem;
  color: var(--text-mid);
}

.sc-k {
  font-size: 0.58rem;
  color: var(--text-dim);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  padding: 0 4px;
}

.fab-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}
</style>
