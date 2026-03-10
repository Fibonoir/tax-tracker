<template>
  <UModal
    :open="open"
    :title="title"
    :description="modalDescription"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div v-if="entry" class="ui-invoice-detail">
        <div v-if="editable && isEditing" class="ui-form-stack">
          <div class="ui-form-grid-2 ui-form-grid-2--compact">
            <button
              v-for="option in typeOptions"
              :key="option.value"
              type="button"
              class="ui-segment-btn"
              :class="{ 'is-active': draft.type === option.value }"
              @click="draft.type = option.value"
            >
              <span>{{ option.label }}</span>
              <span class="text-xs leading-6 text-[var(--text-secondary)]">{{ option.copy }}</span>
            </button>
          </div>

          <div class="ui-form-grid-2">
            <div>
              <label class="label-xs ui-field-label">Data</label>
              <AppDateField v-model="draft.date" />
            </div>

            <div v-if="draft.type === 'HOURLY'">
              <label class="label-xs ui-field-label">Ore lavorate</label>
              <UInput
                v-model="draft.hours"
                type="number"
                step="0.25"
                min="0"
                max="12"
                placeholder="7.5"
                :ui="fieldUi"
              />
            </div>

            <div v-else>
              <label class="label-xs ui-field-label">Importo progetto (€)</label>
              <UInput
                v-model="draft.amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                :ui="fieldUi"
              />
            </div>
          </div>

          <div>
            <label class="label-xs ui-field-label">Descrizione</label>
            <UInput
              v-model="draft.description"
              type="text"
              placeholder="Cliente, milestone, call strategica..."
              :ui="fieldUi"
            />
          </div>

          <SurfaceCard variant="soft" padding="md">
            <div class="ui-form-grid-2">
              <div>
                <p class="label-xs">Lordo stimato</p>
                <p class="num-lg text-[var(--text-primary)] mt-3">{{ fmt.eur(draftGross) }}</p>
              </div>

              <div>
                <p class="label-xs">Tipo registrazione</p>
                <p class="num-md text-[var(--text-primary)] mt-3">{{ draftTypeLabel }}</p>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <template v-else>
          <div class="ui-invoice-detail__row">
            <span class="ui-invoice-detail__label">Data</span>
            <span class="ui-invoice-detail__value">{{ fmt.date(entry.date) }}</span>
          </div>

          <div class="ui-invoice-detail__row">
            <span class="ui-invoice-detail__label">Tipo</span>
            <span class="ui-invoice-detail__value">{{ typeLabel }}</span>
          </div>

          <div v-if="entry.type === 'HOURLY'" class="ui-invoice-detail__row">
            <span class="ui-invoice-detail__label">Ore</span>
            <span class="ui-invoice-detail__value">{{ fmt.hours(entry.hours || 0) }}</span>
          </div>

          <div v-if="entry.type === 'HOURLY'" class="ui-invoice-detail__row">
            <span class="ui-invoice-detail__label">Tariffa</span>
            <span class="ui-invoice-detail__value">{{ fmt.eur(hourlyRate || 30) }}/h</span>
          </div>

          <div v-if="entry.type === 'PROJECT'" class="ui-invoice-detail__row">
            <span class="ui-invoice-detail__label">Importo progetto</span>
            <span class="ui-invoice-detail__value">{{ fmt.eur(entry.amount || 0) }}</span>
          </div>

          <div class="ui-invoice-detail__row">
            <span class="ui-invoice-detail__label">Lordo</span>
            <span class="ui-invoice-detail__value ui-invoice-detail__value--strong">{{ fmt.eur(gross) }}</span>
          </div>

          <div class="ui-invoice-detail__block">
            <p class="ui-invoice-detail__label">Descrizione</p>
            <p class="ui-invoice-detail__text">{{ entry.description || 'Nessuna descrizione' }}</p>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="ui-invoice-detail__actions">
        <UButton
          color="neutral"
          variant="soft"
          class="ui-action-button--ghost"
          @click="isEditing ? cancelEditing() : emit('update:open', false)"
        >
          {{ isEditing ? 'Annulla modifica' : 'Chiudi' }}
        </UButton>

        <UButton
          v-if="editable && entry && !isEditing"
          color="neutral"
          variant="soft"
          class="ui-action-button--ghost"
          @click="startEditing"
        >
          Modifica
        </UButton>

        <UButton
          v-if="editable && entry && isEditing"
          color="primary"
          class="ui-action-button--ghost"
          :disabled="!canSave || saving"
          :loading="saving"
          @click="requestSave"
        >
          Salva modifiche
        </UButton>

        <UButton
          v-if="deletable && entry"
          color="red"
          variant="soft"
          class="ui-action-button--ghost"
          @click="emit('request-delete', entry.id)"
        >
          Elimina
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
type InvoiceEntry = {
  id: number
  date: string | Date
  type: 'HOURLY' | 'PROJECT'
  hours?: number | null
  amount?: number | null
  description?: string | null
}

const props = defineProps<{
  open: boolean
  entry: InvoiceEntry | null
  hourlyRate?: number
  editable?: boolean
  deletable?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'request-delete', id: number): void
  (e: 'request-save', payload: {
    id: number
    date: string
    type: 'HOURLY' | 'PROJECT'
    hours: string | null
    amount: string | null
    description: string | null
  }): void
}>()

const fmt = useFmt()
const { fieldUi } = useUiStyles()
const isEditing = ref(false)

const typeOptions = [
  {
    value: 'HOURLY' as const,
    label: 'Sessione oraria',
    copy: 'Call, consulenze e giornate a ore.',
  },
  {
    value: 'PROJECT' as const,
    label: 'Fee progetto',
    copy: 'Milestone, consegne e importi concordati.',
  },
]

const draft = reactive({
  date: '',
  type: 'HOURLY' as 'HOURLY' | 'PROJECT',
  hours: '',
  amount: '',
  description: '',
})

const title = computed(() => {
  if (!props.entry) return 'Dettaglio registrazione'
  return `Registrazione ${fmt.date(props.entry.date)}`
})

const modalDescription = computed(() => {
  if (props.editable && isEditing.value) {
    return 'Correggi data, importo e descrizione prima di salvare le modifiche.'
  }

  return props.entry?.description || 'Verifica importi, tipo di lavoro e origine della registrazione selezionata.'
})

const typeLabel = computed(() => {
  if (!props.entry) return '-'
  return props.entry.type === 'HOURLY' ? 'Orario' : 'Progetto'
})

const draftTypeLabel = computed(() =>
  draft.type === 'HOURLY' ? 'Sessione oraria' : 'Fee progetto'
)

const gross = computed(() => {
  if (!props.entry) return 0
  return props.entry.type === 'HOURLY'
    ? (props.entry.hours || 0) * (props.hourlyRate || 30)
    : (props.entry.amount || 0)
})

const draftGross = computed(() =>
  draft.type === 'HOURLY'
    ? (parseFloat(draft.hours) || 0) * (props.hourlyRate || 30)
    : (parseFloat(draft.amount) || 0)
)

const canSave = computed(() => {
  if (!draft.date) return false
  if (draft.type === 'HOURLY') return parseFloat(draft.hours) > 0
  return parseFloat(draft.amount) > 0
})

function formatInputDate(value: string | Date) {
  return new Date(value).toISOString().split('T')[0]
}

function syncDraft() {
  if (!props.entry) return

  draft.date = formatInputDate(props.entry.date)
  draft.type = props.entry.type
  draft.hours = props.entry.type === 'HOURLY' && props.entry.hours != null ? String(props.entry.hours) : ''
  draft.amount = props.entry.type === 'PROJECT' && props.entry.amount != null ? String(props.entry.amount) : ''
  draft.description = props.entry.description || ''
}

function startEditing() {
  if (!props.entry) return
  syncDraft()
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  syncDraft()
}

function requestSave() {
  if (!props.entry || !canSave.value) return

  emit('request-save', {
    id: props.entry.id,
    date: draft.date,
    type: draft.type,
    hours: draft.type === 'HOURLY' ? draft.hours : null,
    amount: draft.type === 'PROJECT' ? draft.amount : null,
    description: draft.description.trim() || null,
  })
}

watch(
  () => props.entry,
  (entry) => {
    if (!entry) return
    syncDraft()
  },
  { immediate: true },
)

watch(
  () => props.open,
  (open) => {
    if (open && props.entry) {
      syncDraft()
      return
    }

    if (!open) {
      isEditing.value = false
    }
  },
)
</script>
