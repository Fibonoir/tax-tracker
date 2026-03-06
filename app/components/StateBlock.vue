<template>
  <div :class="stateClass">
    <template v-if="props.type === 'loading'">
      <UIcon name="lucide:loader-2" class="w-6 h-6 animate-spin text-revolut-muted" />
      <p v-if="props.text" class="ui-state-block__text">{{ props.text }}</p>
    </template>

    <p v-else class="ui-state-block__text">{{ props.text || 'Nessun risultato' }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  type: 'loading' | 'empty'
  text?: string
  delay?: 0 | 1 | 2 | 3 | 4 | 5
}>(), {
  delay: 0,
})

const stateClass = computed(() => [
  'ui-state-block',
  props.type === 'loading' ? 'is-loading' : 'is-empty',
  'fade-up',
  props.delay > 0 ? `fade-up-${props.delay}` : '',
])
</script>
