<template>
  <SurfaceCard variant="soft">
    <div class="ui-stat-card">
      <div class="ui-stat-card__head">
        <p class="label-xs">{{ label }}</p>
        <span class="ui-stat-card__dot" />
      </div>

      <p class="num-lg ui-stat-value" :class="valueClass">{{ value }}</p>
      <p v-if="sub" class="font-mono text-xs text-revolut-muted">{{ sub }}</p>
    </div>
  </SurfaceCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  sub?: string
  valueClass?: string
}>()
</script>
