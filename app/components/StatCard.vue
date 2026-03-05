<template>
  <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5">
    <div class="space-y-2">
      <p class="label-xs">{{ label }}</p>
      <p class="num-lg text-revolut-text light:text-revolut-light-text" :class="valueClass">{{ value }}</p>
      <p v-if="sub" class="font-mono text-xs text-revolut-muted">{{ sub }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  sub?: string
  valueClass?: string
}>()
</script>
