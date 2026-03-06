<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'soft' | 'gradient'
  divided?: boolean
}>(), {
  padding: 'md',
  variant: 'default',
  divided: false,
})

const cardClass = computed(() => [
  'ui-surface',
  `ui-surface--${props.variant}`,
  `ui-surface--pad-${props.padding}`,
  props.divided ? 'ui-surface--divided' : '',
])
</script>
