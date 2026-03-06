<template>
  <component :is="props.as" :class="shellClass">
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  as?: string
  spaced?: boolean
}>(), {
  as: 'div',
  spaced: true,
})

const shellClass = computed(() => [
  'app-page-shell',
  props.spaced ? 'app-page-shell--spaced' : '',
])
</script>
