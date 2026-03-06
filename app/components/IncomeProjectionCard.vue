<template>
  <SurfaceCard variant="soft" padding="md" class="ui-projection-summary">
    <div class="ui-projection-summary__row">
      <span class="ui-projection-summary__label">Media mensile</span>
      <span class="ui-projection-summary__value">{{ fmt.eur(avgMonthly) }}/mese</span>
    </div>

    <div class="ui-projection-summary__row">
      <span class="ui-projection-summary__label">Proiezione annuale</span>
      <span class="ui-projection-summary__value">{{ fmt.eur(projectedAnnual) }}/anno</span>
    </div>

    <div v-if="monthlySetAside !== undefined && monthlySetAside !== null" class="ui-projection-summary__row">
      <span class="ui-projection-summary__label">Accantona</span>
      <span class="ui-projection-summary__value text-revolut-red">{{ fmt.eur(monthlySetAside) }}/mese</span>
    </div>
  </SurfaceCard>
</template>

<script setup lang="ts">
defineProps<{
  avgMonthly: number
  projectedAnnual: number
  monthlySetAside?: number | null
}>()

const fmt = useFmt()
</script>
