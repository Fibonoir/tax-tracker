<template>
  <SurfaceCard variant="soft" padding="md" class="ui-projection-summary">
    <div class="ui-stat-card__head">
      <p class="label-xs">Ritmo attuale</p>
      <span class="ui-stat-card__dot" />
    </div>

    <div class="ui-projection-summary__row">
      <span class="ui-projection-summary__label">{{ avgLabel || 'Media mensile' }}</span>
      <span class="ui-projection-summary__value">{{ fmt.eur(avgMonthly) }}/mese</span>
    </div>

    <div class="ui-projection-summary__row">
      <span class="ui-projection-summary__label">Stima fine anno</span>
      <span class="ui-projection-summary__value">{{ fmt.eur(projectedAnnual) }}/anno</span>
    </div>

    <div v-if="monthlySetAside !== undefined && monthlySetAside !== null" class="ui-projection-summary__row">
      <span class="ui-projection-summary__label">Da accantonare</span>
      <span class="ui-projection-summary__value text-[var(--danger-text)]">{{ fmt.eur(monthlySetAside) }}/mese</span>
    </div>
  </SurfaceCard>
</template>

<script setup lang="ts">
defineProps<{
  avgMonthly: number
  projectedAnnual: number
  monthlySetAside?: number | null
  avgLabel?: string
}>()

const fmt = useFmt()
</script>
