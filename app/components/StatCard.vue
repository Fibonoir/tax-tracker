<template>
  <SurfaceCard>
    <div class="space-y-2">
      <p class="label-xs">{{ label }}</p>
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
