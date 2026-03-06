<template>
  <div class="ui-section-header">
    <h2 class="ui-section-header__title">{{ props.title }}</h2>

    <p v-if="props.meta && !slots.right" class="label-xs">{{ props.meta }}</p>

    <div v-if="slots.right" class="ui-section-header__right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  meta?: string
}>()

const slots = useSlots()
</script>
