<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import type { GoogleCalendar } from '../../core/types'

const props = defineProps<{
  open: boolean
  connected: boolean
  connecting: boolean
  syncing: boolean
  email: string | null
  clientId: string
  clientSecret: string
  calendars: GoogleCalendar[]
  lastSyncedAt: string | null
  lastError: string | null
  dataConfirmDisconnect: boolean | null
}>()

const emit = defineEmits<{
  updateClientId: [value: string]
  updateClientSecret: [value: string]
  connect: []
  save: [calendarIds: string[]]
  requestDisconnect: []
  cancelDisconnect: []
  confirmDisconnect: []
  disconnect: []
  close: []
}>()

const selected = ref<string[]>([])

watch(() => props.open, open => {
  if (!open) return
  selected.value = props.calendars.filter(c => c.selected).map(c => c.calendar_id)
})

const sortedCalendars = computed(() =>
  [...props.calendars].sort((a, b) => Number(b.primary) - Number(a.primary) || a.summary.localeCompare(b.summary))
)

const canConnect = computed(() => props.clientId.trim().length > 0 && props.clientSecret.trim().length > 0 && !props.connecting)
const canSave = computed(() => selected.value.length > 0 && !props.syncing)

function toggle(calendarId: string) {
  if (selected.value.includes(calendarId)) {
    selected.value = selected.value.filter(id => id !== calendarId)
  } else {
    selected.value = [...selected.value, calendarId]
  }
}
</script>

<template>
  <BaseModal :open="open" width="min(560px, 96vw)" top="8%" @close="emit('close')">
    <div class="gs-modal-inner">
      <div class="gs-head">
        <div>
          <div class="gs-title">google calendar sync</div>
          <div class="gs-meta">{{ connected ? (email || 'connected account') : 'not connected' }}</div>
        </div>
        <button class="b-close" type="button" @click="emit('close')">esc</button>
      </div>

      <div class="gs-status">
        <span v-if="lastSyncedAt">last sync: {{ new Date(lastSyncedAt).toLocaleString() }}</span>
        <span v-if="lastError" class="error">{{ lastError }}</span>
      </div>

      <div v-if="!connected" class="gs-connect">
        <div class="gs-label">oauth client id</div>
        <input
          :value="clientId"
          class="gs-input"
          type="text"
          placeholder="paste desktop app client id"
          @input="emit('updateClientId', ($event.target as HTMLInputElement).value)"
        />

        <div class="gs-secret">
          <div class="gs-label">client secret</div>
          <input
            :value="clientSecret"
            class="gs-input"
            type="password"
            placeholder="paste only if google requires it"
            @input="emit('updateClientSecret', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="gs-help">
          <div class="gs-help-title">how to get it</div>
          <ul class="gs-help-list">
            <li>open Google Cloud Console and select or create a project</li>
            <li>enable the Google Calendar API for that project</li>
            <li>configure the OAuth consent screen if prompted</li>
            <li>go to Credentials and create an OAuth client ID</li>
            <li>choose application type `Desktop app`</li>
            <li>copy the generated client ID and paste it here</li>
            <li>do not use a `Web application` client id, it will fail because this flow does not use a client secret</li>
          </ul>
        </div>
      </div>

      <template v-else>
        <div class="gs-label">calendars</div>
        <div class="gs-list">
        <button
          v-for="calendar in sortedCalendars"
          :key="calendar.calendar_id"
          class="gs-row"
          :class="{ active: selected.includes(calendar.calendar_id) }"
          type="button"
          :disabled="syncing"
          @click="toggle(calendar.calendar_id)"
        >
          <span class="gs-dot" :style="{ background: calendar.background_color || 'var(--accent)' }"></span>
          <span class="gs-name">{{ calendar.summary }}</span>
          <span v-if="calendar.primary" class="gs-flag">primary</span>
        </button>
        </div>
      </template>

      <div v-if="$attrs['data-confirm-disconnect']" class="gs-confirm">
        <div class="gs-confirm-text">disconnecting removes all synced google events from slowlife. continue?</div>
        <div class="gs-confirm-actions">
          <button class="btn ghost" type="button" @click="emit('cancelDisconnect')">cancel</button>
          <button class="btn danger" type="button" @click="emit('confirmDisconnect')">confirm disconnect</button>
        </div>
      </div>

      <div class="gs-actions">
        <button v-if="connected" class="btn danger" type="button" :disabled="syncing || !!$attrs['data-confirm-disconnect']" @click="emit('requestDisconnect')">disconnect</button>
        <div v-else></div>
        <div class="gs-right">
          <button class="btn ghost" type="button" @click="emit('close')">cancel</button>
          <button v-if="connected" class="btn" type="button" :disabled="!canSave" @click="emit('save', selected)">{{ syncing ? 'syncing...' : 'save and sync' }}</button>
          <button v-else class="btn" type="button" :disabled="!canConnect" @click="emit('connect')">
            {{ connecting ? 'connecting...' : 'connect google' }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.gs-modal-inner {
  padding: 16px;
}

.gs-head, .gs-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gs-title {
  font-size: 0.9rem;
}

.gs-meta, .gs-status {
  font-size: 0.62rem;
  color: var(--text-dim);
}

.gs-status {
  margin: 10px 0 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.gs-status .error {
  color: var(--red);
}

.gs-label {
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.gs-connect {
  margin-bottom: 12px;
}

.gs-secret {
  margin-top: 12px;
}

.gs-input {
  width: 100%;
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  outline: none;
}

.gs-input:focus {
  border-color: var(--accent);
}

.gs-help {
  margin-top: 12px;
  font-size: 0.58rem;
  color: var(--text-dim);
  line-height: 1.5;
}

.gs-help-title {
  margin-bottom: 4px;
  color: var(--text-mid);
}

.gs-help-list {
  margin: 0;
  padding-left: 16px;
}

.gs-help-list li + li {
  margin-top: 2px;
}

.gs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 48vh;
  overflow-y: auto;
}

.gs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-mid);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.68rem;
  transition: all var(--dur-base) var(--ease);
}

.gs-row:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gs-row:hover {
  border-color: var(--accent);
  color: var(--text);
}

.gs-row:disabled:hover {
  border-color: var(--border);
  color: var(--text-mid);
}

.gs-row:active {
  transform: translateY(1px);
}

.gs-row.active {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
}

.gs-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
}

.gs-name {
  flex: 1;
  text-align: left;
}

.gs-flag {
  font-size: 0.52rem;
  color: var(--text-dim);
}

.gs-actions {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.gs-confirm {
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid var(--red);
  background: var(--red-dim);
}

.gs-confirm-text {
  font-size: 0.64rem;
  color: var(--text);
}

.gs-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.gs-right {
  display: flex;
  gap: 8px;
}

.btn {
  transition: all var(--dur-base) var(--ease);
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
  border-color: var(--accent);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: var(--border);
  color: var(--text-dim);
  background: var(--bg-card);
}

.btn.ghost:hover:not(:disabled) {
  background: var(--bg-hover);
}
</style>
