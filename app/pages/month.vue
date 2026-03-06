<template>
  <AppPageShell>
    <div class="app-period-nav fade-up">
      <button class="app-period-nav__btn" @click="prevMonth">
        <UIcon name="lucide:chevron-left" class="w-5 h-5" />
      </button>

      <h1 class="app-period-nav__title capitalize">{{ monthLabel }}</h1>

      <button
        class="app-period-nav__btn"
        :disabled="isCurrentMonth"
        @click="nextMonth"
      >
        <UIcon name="lucide:chevron-right" class="w-5 h-5" />
      </button>
    </div>

    <StateBlock v-if="loading" type="loading" />

    <template v-else-if="summary">
      <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1">
        <p class="label-xs text-white-muted">Reddito lordo</p>
        <p class="num-display text-white mt-2">{{ fmt.eur(summary.gross) }}</p>
        <p class="font-mono text-sm text-white-soft mt-3">
          {{ fmt.hours(summary.totalHours) }} · {{ summary.entryCount }} registrazioni
        </p>
      </SurfaceCard>

      <div class="app-month-stat-grid fade-up fade-up-2">
        <StatCard label="Orario" :value="fmt.eur(summary.hourlyGross)" />
        <StatCard label="Progetto" :value="fmt.eur(summary.projectGross)" />
        <StatCard
          label="Accantonamento"
          :value="fmt.eur(summary.provision)"
          value-class="text-revolut-red"
        />
        <StatCard
          label="Netto stimato"
          :value="fmt.eur(summary.net)"
          value-class="text-revolut-green"
        />
      </div>

      <IncomeProjectionCard
        v-if="summary.runningAvgMonthly > 0"
        :avg-monthly="summary.runningAvgMonthly"
        :projected-annual="summary.runningProjectedAnnual"
        class="fade-up fade-up-2"
      />

      <AppSection title="Accantonamenti mensili" :delay="3">
        <SurfaceCard padding="none" divided>
          <div v-for="row in taxRows" :key="row.label" class="ui-kv-row">
            <span class="ui-kv-row__label">{{ row.label }}</span>
            <span class="ui-kv-row__value" :class="row.class">{{ row.value }}</span>
          </div>
        </SurfaceCard>
      </AppSection>

      <AppSection title="Registrazioni" :delay="4">
        <SurfaceCard v-if="entries.length === 0" padding="md">
          <StateBlock type="empty" text="Nessuna registrazione" />
        </SurfaceCard>

        <SurfaceCard v-else padding="none">
          <div class="ui-list-shell">
            <EntryRow
              v-for="entry in entries"
              :key="entry.id"
              :entry="entry"
              :hourly-rate="settings?.hourlyRate"
              @select="openInvoiceDetails"
            />
          </div>
        </SurfaceCard>
      </AppSection>
    </template>

    <InvoiceDetailsModal
      :open="detailsOpen"
      :entry="selectedEntry"
      :hourly-rate="settings?.hourlyRate"
      @update:open="detailsOpen = $event"
    />
  </AppPageShell>
</template>

<script setup lang="ts">
const fmt = useFmt()
const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const loading = ref(true)
const entries = ref<any[]>([])
const annualData = ref<any>(null)
const settings = ref<any>(null)
const selectedEntry = ref<any | null>(null)
const detailsOpen = ref(false)

const summary = computed(() => annualData.value?.months[viewMonth.value])

const isCurrentMonth = computed(() =>
  viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth()
)

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1)
    .toLocaleString('it-IT', { month: 'long', year: 'numeric' })
)

const activeMonths = computed(() => annualData.value?.activeMonths ?? 12)

const taxRows = computed(() => {
  if (!summary.value?.projectedTaxes) return []
  const t = summary.value.projectedTaxes
  const n = activeMonths.value
  const rows: { label: string; value: string; class: string }[] = [
    { label: 'IRPEF (imposta sostitutiva)', value: `−${fmt.eur(t.irpef / n)}`, class: 'text-revolut-red' },
  ]
  if (t.inpsExcess > 0) {
    rows.push(
      { label: 'INPS fissi', value: `−${fmt.eur(t.inpsFixed / n)}`, class: 'text-revolut-red' },
      { label: 'INPS eccedenza', value: `−${fmt.eur(t.inpsExcess / n)}`, class: 'text-revolut-red' },
    )
  } else {
    rows.push({ label: 'INPS totale', value: `−${fmt.eur(t.inps / n)}`, class: 'text-revolut-red' })
  }
  rows.push(
    { label: 'Commercialista', value: `−${fmt.eur(t.accountant / n)}`, class: 'text-revolut-red' },
    { label: 'Netto in tasca', value: fmt.eur(summary.value?.net), class: 'text-revolut-green font-semibold' },
  )
  return rows
})

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
  load()
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
  load()
}

function openInvoiceDetails(entry: any) {
  selectedEntry.value = entry
  detailsOpen.value = true
}

async function load() {
  loading.value = true
  const [e, a, s] = await Promise.all([
    $fetch<any[]>(`/api/entries?year=${viewYear.value}&month=${viewMonth.value}`),
    $fetch<any>(`/api/summary/annual?year=${viewYear.value}`),
    $fetch<any>('/api/settings'),
  ])
  entries.value = e
  annualData.value = a
  settings.value = s
  loading.value = false
}

onMounted(load)
</script>
