<template>
  <div class="flex items-center gap-3 py-4 border-b border-revolut-border light:border-revolut-light-border last:border-0">
    <span
      class="font-mono text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 tracking-wider font-medium"
      :class="entry.type === 'HOURLY'
        ? 'bg-revolut-green/10 text-revolut-green light:text-revolut-green-dark'
        : 'bg-revolut-blue/10 text-revolut-blue'"
    >
      {{ entry.type === 'HOURLY' ? `${entry.hours}h` : 'PRJ' }}
    </span>

    <div class="flex-1 min-w-0">
      <p class="text-[11px] font-mono text-revolut-muted tracking-wider">{{ fmt.date(entry.date) }}</p>
      <p class="text-sm text-revolut-text light:text-revolut-light-text truncate mt-0.5">{{ entry.description || 'Nessuna descrizione' }}</p>
    </div>

    <p class="num-md text-revolut-text light:text-revolut-light-text shrink-0">{{ fmt.eur(gross) }}</p>

    <button
      v-if="deletable"
      class="text-revolut-muted hover:text-revolut-red transition-colors shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-revolut-card"
      @click="$emit('delete', entry.id)"
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

defineEmits(['delete'])

const fmt = useFmt()

const gross = computed(() =>
  props.entry.type === 'HOURLY'
    ? (props.entry.hours || 0) * (props.hourlyRate || 30)
    : (props.entry.amount || 0)
)
</script>
