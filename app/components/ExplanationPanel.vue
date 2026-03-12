<template>
  <SurfaceCard variant="soft" padding="md">
    <details class="ui-explanation-panel" :open="open">
      <summary class="ui-explanation-panel__summary">
        <div>
          <p class="label-xs">{{ title }}</p>
          <p v-if="subtitle" class="font-mono text-xs leading-6 text-[var(--text-secondary)] mt-2">{{ subtitle }}</p>
        </div>
        <UIcon name="lucide:chevron-down" class="w-4 h-4 text-[var(--text-secondary)]" />
      </summary>

      <div class="ui-form-stack mt-4">
        <SurfaceCard v-for="item in items" :key="item.id" padding="md" class="ui-explanation-panel__item">
          <div class="ui-form-stack">
            <div class="ui-kv-row">
              <span class="ui-kv-row__label">{{ item.label }}</span>
              <span class="ui-kv-row__value" :class="valueClass(item.tone)">{{ item.value }}</span>
            </div>
            <p class="font-mono text-xs leading-6 text-[var(--text-secondary)]">{{ item.text }}</p>
          </div>
        </SurfaceCard>
      </div>
    </details>
  </SurfaceCard>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  items: Array<{
    id: string
    label: string
    value: string
    text: string
    tone?: 'default' | 'accent' | 'danger' | 'warning' | 'neutral'
  }>
  open?: boolean
}>()

function valueClass(tone?: string) {
  if (tone === 'accent') return 'text-[var(--accent-text)]'
  if (tone === 'danger') return 'text-[var(--danger-text)]'
  if (tone === 'warning') return 'text-[var(--warning)]'
  return 'text-[var(--text-primary)]'
}
</script>
