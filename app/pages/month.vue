<template>
  <AppPageShell>
    <StateBlock v-if="loading" type="loading" text="Sto preparando il riepilogo del mese selezionato..." />

    <template v-else-if="summary">
      <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1">
        <div class="ui-form-stack">
          <div class="app-period-nav">
            <button class="app-period-nav__btn" @click="prevMonth">
              <UIcon name="lucide:chevron-left" class="w-5 h-5" />
            </button>

            <h1 class="app-period-nav__title capitalize">{{ monthLabel }}</h1>

            <button class="app-period-nav__btn" :disabled="isCurrentMonth" @click="nextMonth">
              <UIcon name="lucide:chevron-right" class="w-5 h-5" />
            </button>
          </div>

          <div class="app-stage">
            <div class="app-stage__header">
              <p class="app-stage__eyebrow">Quadro del mese</p>
              <p class="app-stage__metric-label">Disponibile stimato</p>
              <p class="app-stage__metric">{{ fmt.eur(summary.net) }}</p>
              <p class="app-stage__summary">
                Disponibile stimato · incassato {{ fmt.eur(summary.gross) }} · accantona {{ fmt.eur(summary.provision) }}
              </p>
              <p class="app-stage__lead">
                Questa vista comprime il mese in una lettura sola: quanto entra, quanto esce dal
                spendibile e come si distribuisce il lavoro tra ore e fee progetto.
              </p>
            </div>

            <div class="app-stage__signals">
              <div class="app-stage__signal app-stage__signal--strong">
                <p class="app-stage__signal-label">Incassato</p>
                <p class="app-stage__signal-value">{{ fmt.eur(summary.gross) }}</p>
                <p class="app-stage__signal-note">Lordo del mese osservato.</p>
              </div>

              <div class="app-stage__signal">
                <p class="app-stage__signal-label">Da accantonare</p>
                <p class="app-stage__signal-value">{{ fmt.eur(summary.provision) }}</p>
                <p class="app-stage__signal-note">Quota fiscale distribuita sul mese.</p>
              </div>

              <div class="app-stage__signal">
                <p class="app-stage__signal-label">Registrazioni</p>
                <p class="app-stage__signal-value">{{ summary.entryCount }}</p>
                <p class="app-stage__signal-note">{{ fmt.hours(summary.totalHours) }} di lavoro gia caricato.</p>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div class="app-month-stat-grid fade-up fade-up-2">
        <StatCard label="Lordo totale" :value="fmt.eur(summary.gross)" sub="Somma di tutte le registrazioni del mese" />
        <StatCard label="A ore" :value="fmt.eur(summary.hourlyGross)" sub="Fatturato derivato da sessioni orarie" />
        <StatCard label="A progetto" :value="fmt.eur(summary.projectGross)" sub="Fee concordate nel mese" />
        <StatCard
          label="Accantonamento"
          :value="fmt.eur(summary.provision)"
          sub="Quota fiscale del mese"
          value-class="text-revolut-red"
        />
        <StatCard
          label="Netto stimato"
          :value="fmt.eur(summary.net)"
          sub="Residuo dopo imposte e costi distribuiti"
          value-class="text-revolut-green"
        />
      </div>

      <div class="app-grid-2">
        <IncomeProjectionCard
          v-if="summary.runningAvgMonthly > 0"
          :avg-monthly="summary.runningAvgMonthly"
          :projected-annual="summary.runningProjectedAnnual"
          class="fade-up fade-up-2"
        />

        <SurfaceCard class="fade-up fade-up-3">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Mix del mese</p>
              <h2 class="font-display text-2xl leading-none tracking-[-0.04em] text-revolut-text light:text-revolut-light-text mt-3">
                Da dove arriva l'incasso.
              </h2>
            </div>

            <div class="ui-form-stack">
              <div v-for="row in mixRows" :key="row.label" class="ui-kv-row">
                <span class="ui-kv-row__label">{{ row.label }}</span>
                <span class="ui-kv-row__value" :class="row.class">{{ row.value }}</span>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <AppSection title="Composizione accantonamento" subtitle="Come si distribuisce la quota fiscale e previdenziale del mese." :delay="3">
        <SurfaceCard padding="none" divided>
          <div v-for="row in taxRows" :key="row.label" class="ui-kv-row">
            <span class="ui-kv-row__label">{{ row.label }}</span>
            <span class="ui-kv-row__value" :class="row.class">{{ row.value }}</span>
          </div>
        </SurfaceCard>
      </AppSection>

      <AppSection title="Registrazioni del mese" subtitle="Apri una voce per controllare origine, importo e dettaglio del lavoro." :delay="4">
        <SurfaceCard v-if="entries.length === 0" padding="md">
          <StateBlock type="empty" text="Questo mese e ancora vuoto. Torna in Home per registrare il primo incasso." />
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

const averageEntryGross = computed(() => {
  if (!summary.value?.entryCount) return 0
  return summary.value.gross / summary.value.entryCount
})

const mixRows = computed(() => {
  if (!summary.value) return []

  return [
    {
      label: 'Fatturato orario',
      value: fmt.eur(summary.value.hourlyGross),
      class: 'text-revolut-text light:text-revolut-light-text',
    },
    {
      label: 'Fatturato a progetto',
      value: fmt.eur(summary.value.projectGross),
      class: 'text-revolut-blue',
    },
    {
      label: 'Media per registrazione',
      value: fmt.eur(averageEntryGross.value),
      class: 'text-revolut-green',
    },
  ]
})

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
    { label: 'Netto in tasca', value: fmt.eur(summary.value.net), class: 'text-revolut-green font-semibold' },
  )

  return rows
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }

  load()
}

function nextMonth() {
  if (isCurrentMonth.value) return

  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }

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
