<template>
  <div class="ui-kv-row">
    <div>
      <span class="ui-kv-row__label">{{ label }}</span>
      <p v-if="detail" class="font-mono text-[11px] leading-5 text-[var(--text-secondary)] mt-1">{{ detail }}</p>
    </div>
    <span class="ui-kv-row__value" :class="valueClass">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string
  detail?: string
  tone?: 'default' | 'accent' | 'danger' | 'info' | 'muted'
}>(), {
  detail: '',
  tone: 'default',
})

const toneMap = {
  default: 'text-[var(--text-primary)]',
  accent: 'text-[var(--accent-text)]',
  danger: 'text-[var(--danger-text)]',
  info: 'text-[var(--info)]',
  muted: 'text-[var(--text-secondary)]',
}

const valueClass = computed(() => toneMap[props.tone])
</script>
