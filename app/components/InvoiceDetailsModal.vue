<template>
  <UModal
    :open="open"
    :title="title"
    :description="entry?.description || 'Verifica importi, tipo di lavoro e origine della registrazione selezionata.'"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div v-if="entry" class="ui-invoice-detail">
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
      </div>
    </template>

    <template #footer>
      <div class="ui-invoice-detail__actions">
        <UButton color="neutral" variant="soft" class="ui-action-button--ghost" @click="$emit('update:open', false)">
          Chiudi
        </UButton>

        <UButton
          v-if="deletable && entry"
          color="red"
          variant="soft"
          class="ui-action-button--ghost"
          @click="$emit('request-delete', entry.id)"
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
  deletable?: boolean
}>()

defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'request-delete', id: number): void
}>()

const fmt = useFmt()

const title = computed(() => {
  if (!props.entry) return 'Dettaglio registrazione'
  return `Registrazione ${fmt.date(props.entry.date)}`
})

const typeLabel = computed(() => {
  if (!props.entry) return '-'
  return props.entry.type === 'HOURLY' ? 'Orario' : 'Progetto'
})

const gross = computed(() => {
  if (!props.entry) return 0
  return props.entry.type === 'HOURLY'
    ? (props.entry.hours || 0) * (props.hourlyRate || 30)
    : (props.entry.amount || 0)
})
</script>
