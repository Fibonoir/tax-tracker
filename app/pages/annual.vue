<template>
  <AppPageShell class="app-page app-page--annual">
    <StateBlock v-if="loading" type="loading" text="Sto aggiornando il quadro annuale..." />

    <template v-else-if="data">
      <div class="app-main-stack app-annual-intro">
        <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1">
          <div class="ui-form-stack">
            <div class="app-period-nav">
              <button class="app-period-nav__btn" @click="viewYear--; load()">
                <UIcon name="lucide:chevron-left" class="w-5 h-5" />
              </button>

              <h1 class="app-period-nav__title">{{ viewYear }}</h1>

              <button class="app-period-nav__btn" @click="viewYear++; load()">
                <UIcon name="lucide:chevron-right" class="w-5 h-5" />
              </button>
            </div>

            <div class="app-stage app-stage--annual">
              <div class="app-stage__header">
                <p class="app-stage__eyebrow">Anno selezionato</p>
                <p class="app-stage__metric-label">Disponibile a fine anno</p>
                <p class="app-stage__metric">{{ fmt.eur(data.projectedTaxes.annualNet) }}</p>
                <p class="app-stage__summary">
                  Lordo previsto {{ fmt.eur(data.projectedAnnualGross) }} · da accantonare {{ fmt.eur(data.recommendedMonthlySetAside) }}/mese
                </p>
                <p class="app-stage__lead">
                  Qui vedi l'anno intero: ritmo dei mesi, peso fiscale e prossime scadenze.
                </p>
              </div>

              <div class="app-stage__signals">
                <div class="app-stage__signal app-stage__signal--strong">
                  <p class="app-stage__signal-label">Lordo previsto</p>
                  <p class="app-stage__signal-value">{{ fmt.eur(data.projectedAnnualGross) }}</p>
                  <p class="app-stage__signal-note">Se mantieni il ritmo attuale, potresti chiudere qui.</p>
                </div>

                <div class="app-stage__signal">
                  <p class="app-stage__signal-label">Aliquota effettiva</p>
                  <p class="app-stage__signal-value">{{ fmt.pct(data.projectedTaxes.effectiveRate) }}</p>
                  <p class="app-stage__signal-note">Peso stimato tra imposta, INPS e costi distribuiti.</p>
                </div>

                <div class="app-stage__signal">
                  <p class="app-stage__signal-label">Prossima scadenza</p>
                  <p class="app-stage__signal-value">{{ nextDeadline ? formatDeadlineDate(nextDeadline.date) : 'Nessuna' }}</p>
                  <p class="app-stage__signal-note">
                    {{ nextDeadline ? nextDeadline.label : 'Nessuna scadenza calcolata per il resto dell\'anno.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard class="fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">In breve</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                Cosa sta guidando l'anno.
              </h2>
              <p class="app-page-copy mt-3">
                Mesi attivi, costi distribuiti e netto stimato: il resto si legge a partire da qui.
              </p>
            </div>

            <div class="ui-form-stack">
              <div v-for="row in headlineRows" :key="row.label" class="ui-kv-row">
                <span class="ui-kv-row__label">{{ row.label }}</span>
                <span class="ui-kv-row__value" :class="row.class">{{ row.value }}</span>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <AppSection title="Andamento dei mesi" subtitle="Il grafico mostra l'incassato mese per mese e mette in evidenza il mese attuale." :delay="2">
        <SurfaceCard>
          <ChartsBarChart :months="data.months" :highlight="currentMonth" :height="180" />
        </SurfaceCard>
      </AppSection>

      <div class="app-annual-split">
        <AppSection title="Dove finisce il lordo" subtitle="Quanto resta disponibile e quanto assorbono imposta, INPS e commercialista." :delay="3">
          <SurfaceCard>
            <div class="app-annual-donut-layout">
              <div class="app-annual-donut-wrap">
                <ChartsDonutChart
                  :irpef="activeTaxes.irpef"
                  :inps="activeTaxes.inps"
                  :accountant="activeTaxes.accountant"
                  :net="activeTaxes.annualNet"
                  :height="128"
                />
              </div>

              <div class="app-annual-legend">
                <div v-for="row in donutLegend" :key="row.label" class="app-annual-legend-row">
                  <div class="app-annual-legend-label">
                    <span class="app-annual-legend-dot" :style="{ background: row.color }" />
                    <span class="font-mono text-xs text-[var(--text-secondary)]">{{ row.label }}</span>
                  </div>
                  <span class="num-sm text-[var(--text-primary)]">{{ fmt.eur(row.value, true) }}</span>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </AppSection>

        <AppSection :delay="3">
          <SectionHeader title="Come si forma il netto">
            <template #right>
              <div class="ui-pill-toggle">
                <button
                  v-for="v in (['projected', 'ytd'] as const)"
                  :key="v"
                  class="ui-pill-toggle__btn"
                  :class="{ 'is-active': breakdownView === v }"
                  @click="breakdownView = v"
                >
                  {{ v === 'projected' ? 'Proiezione' : 'Da inizio anno' }}
                </button>
              </div>
            </template>
          </SectionHeader>

          <SurfaceCard padding="none" divided>
            <div v-for="row in taxTable" :key="row.label" class="ui-kv-row">
              <span class="ui-kv-row__label">{{ row.label }}</span>
              <span class="ui-kv-row__value" :class="row.class">{{ row.value }}</span>
            </div>
          </SurfaceCard>
        </AppSection>
      </div>

      <AppSection v-if="data.paymentDeadlines?.length" title="Scadenze fiscali" subtitle="Date e importi previsti secondo il modello fiscale salvato." :delay="4">
        <SurfaceCard padding="none" divided>
          <div
            v-for="(dl, i) in data.paymentDeadlines"
            :key="i"
            class="app-deadline-row"
            :class="{ 'opacity-40': dl.isPast }"
          >
            <div
              class="app-deadline-dot"
              :class="dl.isPast ? 'bg-[var(--text-secondary)]' : nextDeadlineDate === dl.date ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--border-default)]'"
            />
            <div class="app-deadline-main">
              <p class="font-mono text-xs text-[var(--text-primary)]">{{ dl.label }}</p>
              <p class="font-mono text-xs text-[var(--text-secondary)] mt-0.5">{{ formatDeadlineDate(dl.date) }}</p>
            </div>
            <span class="num-sm text-[var(--danger-text)] shrink-0">{{ fmt.eur(dl.estimatedAmount) }}</span>
          </div>
        </SurfaceCard>

        <p class="font-mono text-xs text-[var(--text-secondary)] mt-2 px-1">Importi stimati sul reddito proiettato e sui parametri salvati.</p>
      </AppSection>

      <AppSection title="Mese per mese" subtitle="Confronta incassato e disponibile distribuito lungo l'anno." :delay="5">
        <SurfaceCard padding="none" divided>
          <div
            v-for="(month, i) in data.months"
            :key="i"
            class="app-annual-month-row"
            :class="{ 'opacity-30': month.gross === 0 && i < data.startMonth }"
          >
            <span class="app-annual-month-label">{{ MONTHS[i] }}</span>
            <div class="app-annual-month-bar-wrap">
              <div class="app-annual-month-bar-track">
                <div class="app-annual-month-bar-fill" :style="{ width: barWidth(month.gross) }" />
              </div>
            </div>
            <div class="app-annual-month-values">
              <p class="num-sm text-[var(--text-primary)]">{{ fmt.eur(month.gross, true) }}</p>
              <p class="font-mono text-xs text-[var(--text-secondary)]">netto {{ fmt.eur(month.net, true) }}</p>
            </div>
          </div>
        </SurfaceCard>
      </AppSection>
    </template>
  </AppPageShell>
</template>

<script setup lang="ts">
const fmt = useFmt()
const now = new Date()
const currentMonth = now.getMonth()
const viewYear = ref(now.getFullYear())
const loading = ref(true)
const data = ref<any>(null)
const breakdownView = ref<'projected' | 'ytd'>('projected')

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

const maxGross = computed(() =>
  data.value ? Math.max(...data.value.months.map((m: any) => m.gross), 1) : 1
)

const activeTaxes = computed(() => {
  if (!data.value) return null
  return breakdownView.value === 'projected' ? data.value.projectedTaxes : data.value.ytdTaxes
})

const headlineRows = computed(() => {
  if (!data.value) return []

  return [
    {
      label: 'Mesi con attivita',
      value: String(data.value.activeMonths),
      class: 'text-[var(--text-primary)]',
    },
    {
      label: 'Costi distribuiti',
      value: fmt.eur(data.value.projectedTaxes.paymentsTotal),
      class: data.value.projectedTaxes.paymentsTotal > 0
        ? 'text-[var(--danger-text)]'
        : 'text-[var(--text-secondary)]',
    },
    {
      label: 'Disponibile a fine anno',
      value: fmt.eur(data.value.projectedTaxes.annualNet),
      class: 'text-[var(--accent-text)]',
    },
  ]
})

function barWidth(gross: number) {
  return ((gross / maxGross.value) * 100).toFixed(1) + '%'
}

const donutLegend = computed(() => {
  const t = activeTaxes.value
  if (!t) return []

  return [
    { label: 'Netto disponibile', value: t.annualNet, color: 'var(--accent)' },
    { label: 'Imposta sostitutiva', value: t.irpef, color: 'var(--danger)' },
    { label: 'INPS', value: t.inps, color: 'var(--warning)' },
    { label: 'Commercialista', value: t.accountant, color: 'var(--info)' },
  ]
})

const taxTable = computed(() => {
  const t = activeTaxes.value
  if (!t) return []

  const isProj = breakdownView.value === 'projected'
  const grossLabel = isProj ? 'Lordo previsto a fine anno' : 'Lordo da inizio anno'
  const grossValue = isProj ? data.value.projectedAnnualGross : data.value.annualGross

  const rows = [
    { label: grossLabel, value: fmt.eur(grossValue), class: 'text-[var(--text-primary)]' },
    { label: 'Reddito imponibile (67%)', value: fmt.eur(t.taxableBase), class: 'text-[var(--text-secondary)]' },
  ]

  if (t.inpsExcess > 0) {
    rows.push(
      { label: 'INPS fissi', value: `−${fmt.eur(t.inpsFixed)}`, class: 'text-[var(--danger-text)]' },
      { label: 'INPS eccedenza', value: `−${fmt.eur(t.inpsExcess)}`, class: 'text-[var(--danger-text)]' },
    )
  } else {
    rows.push({ label: 'INPS totale', value: `−${fmt.eur(t.inps)}`, class: 'text-[var(--danger-text)]' })
  }

  rows.push(
    { label: 'Imponibile dopo INPS', value: fmt.eur(t.adjustedTaxableBase), class: 'text-[var(--text-secondary)]' },
    { label: 'Imposta sostitutiva', value: `−${fmt.eur(t.irpef)}`, class: 'text-[var(--danger-text)]' },
    { label: 'Costo commercialista', value: `−${fmt.eur(t.accountant)}`, class: 'text-[var(--danger-text)]' },
    { label: 'Aliquota effettiva', value: fmt.pct(t.effectiveRate), class: 'text-[var(--text-secondary)]' },
    {
      label: isProj ? 'Disponibile a fine anno' : 'Disponibile da inizio anno',
      value: fmt.eur(t.annualNet),
      class: 'text-[var(--accent-text)] font-semibold',
    },
  )

  return rows
})

const nextDeadlineDate = computed(() => {
  if (!data.value?.paymentDeadlines) return null
  const upcoming = data.value.paymentDeadlines.find((d: any) => !d.isPast)
  return upcoming?.date ?? null
})

const nextDeadline = computed(() => {
  if (!data.value?.paymentDeadlines) return null
  return data.value.paymentDeadlines.find((d: any) => !d.isPast) ?? null
})

function formatDeadlineDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function load() {
  loading.value = true
  data.value = await $fetch<any>(`/api/summary/annual?year=${viewYear.value}`)
  loading.value = false
}

onMounted(load)
</script>
