<template>
  <SurfaceCard :variant="active ? 'gradient' : 'soft'" padding="md">
    <div class="ui-form-stack">
      <div class="ui-stat-card__head">
        <p class="label-xs">{{ label }}</p>
        <span class="ui-stat-card__dot" :class="active ? 'bg-[var(--warning)]' : 'bg-[var(--border-hover)]'" />
      </div>

      <p class="num-lg" :class="active ? 'text-[var(--stage-text-primary)]' : 'text-[var(--text-primary)]'">{{ date }}</p>
      <p class="font-mono text-xs leading-6" :class="active ? 'text-[var(--stage-text-secondary)]' : 'text-[var(--text-secondary)]'">
        {{ note }}
      </p>
      <p class="font-display text-2xl leading-none tracking-[-0.04em]" :class="active ? 'text-[var(--stage-text-primary)]' : 'text-[var(--danger-text)]'">
        {{ amount }}
      </p>
    </div>
  </SurfaceCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  date: string
  note: string
  amount: string
  active?: boolean
}>()
</script>
