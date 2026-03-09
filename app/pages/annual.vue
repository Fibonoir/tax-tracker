<template>
  <AppPageShell>
    <StateBlock v-if="loading" type="loading" text="Sto calcolando il quadro annuale..." />

    <template v-else-if="data">
      <div class="app-main-stack">
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
                <p class="app-stage__eyebrow">Quadro annuale</p>
                <p class="app-stage__metric-label">Disponibile proiettato</p>
                <p class="app-stage__metric">{{ fmt.eur(data.projectedTaxes.annualNet) }}</p>
                <p class="app-stage__summary">
                  Disponibile proiettato · lordo previsto {{ fmt.eur(data.projectedAnnualGross) }} · accantona {{ fmt.eur(data.recommendedMonthlySetAside) }}/mese
                </p>
                <p class="app-stage__lead">
                  Usa questa vista per leggere l'anno come un sistema unico: ritmo dei mesi,
                  impatto fiscale complessivo e prossime uscite che non devono sorprenderti.
                </p>
              </div>

              <div class="app-stage__signals">
                <div class="app-stage__signal app-stage__signal--strong">
                  <p class="app-stage__signal-label">Lordo previsto</p>
                  <p class="app-stage__signal-value">{{ fmt.eur(data.projectedAnnualGross) }}</p>
                  <p class="app-stage__signal-note">Quanto potresti chiudere entro fine anno.</p>
                </div>

                <div class="app-stage__signal">
                  <p class="app-stage__signal-label">Aliquota effettiva</p>
                  <p class="app-stage__signal-value">{{ fmt.pct(data.projectedTaxes.effectiveRate) }}</p>
                  <p class="app-stage__signal-note">Peso stimato tra imposta, INPS e costi distribuiti.</p>
                </div>

                <div class="app-stage__signal">
                  <p class="app-stage__signal-label">Scadenza piu vicina</p>
                  <p class="app-stage__signal-value">{{ nextDeadline ? formatDeadlineDate(nextDeadline.date) : 'Nessuna' }}</p>
                  <p class="app-stage__signal-note">
                    {{ nextDeadline ? nextDeadline.label : 'Nessuna scadenza futura calcolata per l\'anno.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard class="fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Tre pilastri</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-revolut-text light:text-revolut-light-text mt-3">
                Controllo del denaro disponibile.
              </h2>
              <p class="app-page-copy mt-3">
                Questo pannello tiene insieme attivita, peso dei costi distribuiti e netto stimato:
                tutto il resto viene dopo.
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

      <AppSection title="Traiettoria mensile" subtitle="Il grafico mostra il ritmo del lordo e mette in evidenza il mese attuale." :delay="2">
        <SurfaceCard>
          <ChartsBarChart :months="data.months" :highlight="currentMonth" :height="180" />
        </SurfaceCard>
      </AppSection>

      <div class="app-annual-split">
        <AppSection title="Ripartizione netto e imposte" subtitle="Quanto del lordo resta disponibile e quanto viene assorbito dal carico fiscale." :delay="3">
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
                    <span class="font-mono text-xs text-revolut-muted light:text-revolut-light-muted">{{ row.label }}</span>
                  </div>
                  <span class="num-sm text-revolut-text light:text-revolut-light-text">{{ fmt.eur(row.value, true) }}</span>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </AppSection>

        <AppSection :delay="3">
          <SectionHeader title="Dettaglio annuale">
            <template #right>
              <div class="ui-pill-toggle">
                <button
                  v-for="v in (['projected', 'ytd'] as const)"
                  :key="v"
                  class="ui-pill-toggle__btn"
                  :class="{ 'is-active': breakdownView === v }"
                  @click="breakdownView = v"
                >
                  {{ v === 'projected' ? 'Proiezione' : 'Effettivo' }}
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

      <AppSection v-if="data.paymentDeadlines?.length" title="Scadenze fiscali" subtitle="Ordine cronologico delle uscite previste secondo il modello salvato." :delay="4">
        <SurfaceCard padding="none" divided>
          <div
            v-for="(dl, i) in data.paymentDeadlines"
            :key="i"
            class="app-deadline-row"
            :class="{ 'opacity-40': dl.isPast }"
          >
            <div
              class="app-deadline-dot"
              :class="dl.isPast ? 'bg-revolut-muted' : nextDeadlineDate === dl.date ? 'bg-revolut-green animate-pulse' : 'bg-revolut-border'"
            />
            <div class="app-deadline-main">
              <p class="font-mono text-xs text-revolut-text light:text-revolut-light-text">{{ dl.label }}</p>
              <p class="font-mono text-xs text-revolut-muted mt-0.5">{{ formatDeadlineDate(dl.date) }}</p>
            </div>
            <span class="num-sm text-revolut-red shrink-0">{{ fmt.eur(dl.estimatedAmount) }}</span>
          </div>
        </SurfaceCard>

        <p class="font-mono text-xs text-revolut-muted light:text-revolut-light-muted mt-2 px-1">Importi stimati in base al reddito proiettato e ai parametri salvati.</p>
      </AppSection>

      <AppSection title="Mese per mese" subtitle="Confronto rapido tra incassato lordo e netto distribuito durante l'anno." :delay="5">
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
              <p class="num-sm text-revolut-text light:text-revolut-light-text">{{ fmt.eur(month.gross, true) }}</p>
              <p class="font-mono text-xs text-revolut-muted light:text-revolut-light-muted">netto {{ fmt.eur(month.net, true) }}</p>
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
      label: 'Mesi attivi',
      value: String(data.value.activeMonths),
      class: 'text-revolut-text light:text-revolut-light-text',
    },
    {
      label: 'Costi distribuiti',
      value: fmt.eur(data.value.projectedTaxes.paymentsTotal),
      class: data.value.projectedTaxes.paymentsTotal > 0
        ? 'text-revolut-red light:text-revolut-red-dark'
        : 'text-revolut-muted light:text-revolut-light-muted',
    },
    {
      label: 'Netto proiettato',
      value: fmt.eur(data.value.projectedTaxes.annualNet),
      class: 'text-revolut-green light:text-revolut-green-dark',
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
    { label: 'Reddito netto', value: t.annualNet, color: 'var(--color-revolut-green)' },
    { label: 'IRPEF', value: t.irpef, color: 'var(--color-revolut-red)' },
    { label: 'INPS', value: t.inps, color: 'var(--color-revolut-amber)' },
    { label: 'Commercialista', value: t.accountant, color: 'var(--color-revolut-blue)' },
  ]
})

const taxTable = computed(() => {
  const t = activeTaxes.value
  if (!t) return []

  const isProj = breakdownView.value === 'projected'
  const grossLabel = isProj ? 'Lordo annuale proiettato' : 'Lordo da inizio anno'
  const grossValue = isProj ? data.value.projectedAnnualGross : data.value.annualGross

  const rows = [
    { label: grossLabel, value: fmt.eur(grossValue), class: 'text-revolut-text light:text-revolut-light-text' },
    { label: 'Base imponibile (67%)', value: fmt.eur(t.taxableBase), class: 'text-revolut-muted light:text-revolut-light-muted' },
  ]

  if (t.inpsExcess > 0) {
    rows.push(
      { label: 'INPS fissi', value: `−${fmt.eur(t.inpsFixed)}`, class: 'text-revolut-red light:text-revolut-red-dark' },
      { label: 'INPS eccedenza', value: `−${fmt.eur(t.inpsExcess)}`, class: 'text-revolut-red light:text-revolut-red-dark' },
    )
  } else {
    rows.push({ label: 'INPS totale', value: `−${fmt.eur(t.inps)}`, class: 'text-revolut-red light:text-revolut-red-dark' })
  }

  rows.push(
    { label: 'Base imponibile netta', value: fmt.eur(t.adjustedTaxableBase), class: 'text-revolut-muted light:text-revolut-light-muted' },
    { label: 'Imposta sostitutiva', value: `−${fmt.eur(t.irpef)}`, class: 'text-revolut-red light:text-revolut-red-dark' },
    { label: 'Commercialista', value: `−${fmt.eur(t.accountant)}`, class: 'text-revolut-red light:text-revolut-red-dark' },
    { label: 'Aliquota effettiva', value: fmt.pct(t.effectiveRate), class: 'text-revolut-muted light:text-revolut-light-muted' },
    {
      label: isProj ? 'Netto annuale proiettato' : 'Netto da inizio anno',
      value: fmt.eur(t.annualNet),
      class: 'text-revolut-green light:text-revolut-green-dark font-semibold',
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
