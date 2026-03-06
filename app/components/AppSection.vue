<template>
  <component :is="props.tag" :class="sectionClass">
    <div v-if="props.title || props.subtitle || slots['header-right']" class="app-section__header">
      <div class="app-section__heading">
        <h2 v-if="props.title" class="label-xs">{{ props.title }}</h2>
        <p v-if="props.subtitle" class="app-section__subtitle">{{ props.subtitle }}</p>
      </div>

      <div v-if="slots['header-right']" class="app-section__right">
        <slot name="header-right" />
      </div>
    </div>

    <slot />
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  delay?: 0 | 1 | 2 | 3 | 4 | 5
  tag?: 'section' | 'div'
}>(), {
  delay: 0,
  tag: 'section',
})

const slots = useSlots()

const sectionClass = computed(() => [
  'app-section',
  'fade-up',
  props.delay > 0 ? `fade-up-${props.delay}` : '',
])
</script>
