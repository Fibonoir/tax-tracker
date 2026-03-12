<template>
  <SurfaceCard :variant="strong ? 'gradient' : 'soft'" :padding="compact ? 'md' : 'lg'" class="ui-decision-metric">
    <div class="ui-form-stack">
      <div class="ui-stat-card__head">
        <p class="label-xs">{{ label }}</p>
        <span class="ui-stat-card__dot" :class="dotClass" />
      </div>

      <p class="num-display" :class="valueClass">{{ value }}</p>

      <p v-if="note" class="font-mono text-xs leading-6 text-[var(--text-secondary)]">
        {{ note }}
      </p>
    </div>
  </SurfaceCard>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string
  note?: string
  tone?: 'default' | 'accent' | 'danger' | 'info'
  strong?: boolean
  compact?: boolean
}>(), {
  note: '',
  tone: 'default',
  strong: false,
  compact: false,
})

const toneMap = {
  default: 'text-[var(--text-primary)]',
  accent: 'text-[var(--accent-text)]',
  danger: 'text-[var(--danger-text)]',
  info: 'text-[var(--info)]',
}

const dotMap = {
  default: 'bg-[var(--border-hover)]',
  accent: 'bg-[var(--accent)]',
  danger: 'bg-[var(--danger)]',
  info: 'bg-[var(--info)]',
}

const valueClass = computed(() => toneMap[props.tone])
const dotClass = computed(() => dotMap[props.tone])
</script>
