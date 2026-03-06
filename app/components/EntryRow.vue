<template>
  <div class="ui-entry-row ui-entry-row--interactive" @click="$emit('select', entry)">
    <div class="ui-entry-meta">
      <span
        class="ui-entry-badge"
        :class="entry.type === 'HOURLY'
          ? 'is-hourly'
          : 'is-project'"
      >
        {{ entry.type === 'HOURLY' ? `${entry.hours}h` : 'PRJ' }}
      </span>

      <p class="ui-entry-date">{{ fmt.date(entry.date) }}</p>
    </div>

    <p class="ui-entry-description">{{ entry.description || 'Nessuna descrizione' }}</p>
    <p class="num-md ui-entry-amount">{{ fmt.eur(gross) }}</p>

    <button
      v-if="deletable"
      class="ui-entry-delete"
      @click.stop="$emit('delete', entry.id)"
    >
      <UIcon name="lucide:trash-2" class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: {
    id: number
    date: string | Date
    type: 'HOURLY' | 'PROJECT'
    hours?: number | null
    amount?: number | null
    description?: string | null
  }
  deletable?: boolean
  hourlyRate?: number
}>()

defineEmits(['delete', 'select'])

const fmt = useFmt()

const gross = computed(() =>
  props.entry.type === 'HOURLY'
    ? (props.entry.hours || 0) * (props.hourlyRate || 30)
    : (props.entry.amount || 0)
)
</script>
