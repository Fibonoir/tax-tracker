<template>
  <AppPageShell>
    <div class="app-grid-2 items-start">
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

          <div class="app-annual-hero-grid">
            <div>
              <p class="label-xs text-white-muted">Reddito consolidato</p>
              <p class="num-display text-white mt-3">{{ fmt.eur(data?.annualGross) }}</p>
              <p class="text-sm leading-7 text-white-soft app-measure mt-4">
                Una vista unica per bilanciare incassi reali, proiezione fiscale e scadenze future
                dell'anno selezionato.
              </p>
            </div>

            <div>
              <p class="label-xs text-white-muted">Proiezione fine anno</p>
              <p class="num-display text-white-softer mt-3">{{ fmt.eur(data?.projectedAnnualGross) }}</p>

              <div class="app-annual-hero-meta">
                <div class="app-home-hero__chip">
                  <p class="label-xs text-white-muted">Netto effettivo</p>
                  <p class="font-display text-xl font-bold text-white mt-2">{{ fmt.eur(data?.ytdTaxes?.annualNet) }}</p>
                </div>

                <div class="app-home-hero__chip app-home-hero__chip--soft">
                  <p class="label-xs text-white-muted">Aliquota effettiva</p>
                  <p class="font-display text-xl font-bold text-white mt-2">{{ fmt.pct(data?.projectedTaxes?.effectiveRate) }}</p>
                </div>

                <div class="app-home-hero__chip app-home-hero__chip--soft">
                  <p class="label-xs text-white-muted">Accantona</p>
                  <p class="font-display text-xl font-bold text-white mt-2">{{ fmt.eur(data?.recommendedMonthlySetAside) }}/mese</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard class="fade-up fade-up-2">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs">Quadro annuale</p>
            <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-revolut-text light:text-revolut-light-text mt-3">
              Scopri il vero equilibrio dell'anno.
            </h2>
            <p class="app-page-copy mt-3">
              Dai mesi attivi alle imposte proiettate, questa vista serve per pianificare con anticipo
              e decidere come distribuire cassa e prelievi.
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

    <StateBlock v-if="loading" type="loading" text="Sto calcolando il quadro annuale..." />

    <template v-else-if="data">
      <AppSection title="Traiettoria mensile" subtitle="Il grafico evidenzia il ritmo di fatturato e il mese attuale." :delay="2">
        <SurfaceCard>
          <ChartsBarChart :months="data.months" :highlight="currentMonth" :height="180" />
        </SurfaceCard>
      </AppSection>

      <div class="app-annual-split">
        <AppSection title="Ripartizione netto e imposte" subtitle="Lettura immediata della composizione annuale." :delay="3">
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
                    <span class="font-mono text-xs text-revolut-muted">{{ row.label }}</span>
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

      <AppSection v-if="data.paymentDeadlines?.length" title="Scadenze fiscali" subtitle="Ordine cronologico delle uscite previste in base alla proiezione." :delay="4">
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

        <p class="font-mono text-xs text-revolut-muted mt-2 px-1">Importi stimati in base al reddito proiettato e ai parametri salvati.</p>
      </AppSection>

      <AppSection title="Mese per mese" subtitle="Confronto rapido tra lordo e netto distribuito durante l'anno." :delay="5">
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
              <p class="font-mono text-xs text-revolut-muted">netto {{ fmt.eur(month.net, true) }}</p>
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
      label: 'Costi totali distribuiti',
      value: fmt.eur(data.value.projectedTaxes.paymentsTotal),
      class: 'text-revolut-red',
    },
    {
      label: 'Netto proiettato',
      value: fmt.eur(data.value.projectedTaxes.annualNet),
      class: 'text-revolut-green',
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
    { label: 'Reddito netto', value: t.annualNet, color: '#1f8f69' },
    { label: 'IRPEF', value: t.irpef, color: '#c96948' },
    { label: 'INPS', value: t.inps, color: '#d2a14b' },
    { label: 'Commercialista', value: t.accountant, color: '#8b9792' },
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
    { label: 'Base imponibile (67%)', value: fmt.eur(t.taxableBase), class: 'text-revolut-muted' },
  ]

  if (t.inpsExcess > 0) {
    rows.push(
      { label: 'INPS fissi', value: `−${fmt.eur(t.inpsFixed)}`, class: 'text-revolut-red' },
      { label: 'INPS eccedenza', value: `−${fmt.eur(t.inpsExcess)}`, class: 'text-revolut-red' },
    )
  } else {
    rows.push({ label: 'INPS totale', value: `−${fmt.eur(t.inps)}`, class: 'text-revolut-red' })
  }

  rows.push(
    { label: 'Base imponibile netta', value: fmt.eur(t.adjustedTaxableBase), class: 'text-revolut-muted' },
    { label: 'Imposta sostitutiva', value: `−${fmt.eur(t.irpef)}`, class: 'text-revolut-red' },
    { label: 'Commercialista', value: `−${fmt.eur(t.accountant)}`, class: 'text-revolut-red' },
    { label: 'Aliquota effettiva', value: fmt.pct(t.effectiveRate), class: 'text-revolut-muted' },
    {
      label: isProj ? 'Netto annuale proiettato' : 'Netto da inizio anno',
      value: fmt.eur(t.annualNet),
      class: 'text-revolut-green font-semibold',
    },
  )

  return rows
})

const nextDeadlineDate = computed(() => {
  if (!data.value?.paymentDeadlines) return null
  const upcoming = data.value.paymentDeadlines.find((d: any) => !d.isPast)
  return upcoming?.date ?? null
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
