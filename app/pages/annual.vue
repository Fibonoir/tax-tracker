<template>
  <div class="px-4 pt-6 space-y-6 md:px-6">
    <div class="flex items-center gap-4 fade-up">
      <button
        class="w-10 h-10 rounded-xl flex items-center justify-center border border-revolut-border light:border-revolut-light-border text-revolut-muted hover:text-revolut-text hover:border-[#3a3a3d] transition-all"
        @click="viewYear--; load()"
      >
        <UIcon name="lucide:chevron-left" class="w-5 h-5" />
      </button>
      <h1 class="flex-1 text-center font-display text-xl font-semibold text-revolut-text light:text-revolut-light-text">{{ viewYear }}</h1>
      <button
        class="w-10 h-10 rounded-xl flex items-center justify-center border border-revolut-border light:border-revolut-light-border text-revolut-muted hover:text-revolut-text hover:border-[#3a3a3d] transition-all"
        @click="viewYear++; load()"
      >
        <UIcon name="lucide:chevron-right" class="w-5 h-5" />
      </button>
    </div>

    <div v-if="loading" class="py-16 flex justify-center">
      <UIcon name="lucide:loader-2" class="w-6 h-6 animate-spin text-revolut-muted" />
    </div>

    <template v-else-if="data">
      <div class="bg-linear-to-br from-revolut-green to-revolut-green-dark rounded-3xl p-6 shadow-lg shadow-revolut-green/10 fade-up fade-up-1">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <p class="label-xs text-white/70">Lordo da inizio anno</p>
            <p class="num-display text-white mt-2">{{ fmt.eur(data.annualGross) }}</p>
          </div>
          <div>
            <p class="label-xs text-white/70">Proiezione annuale</p>
            <p class="num-display text-white/90 mt-2">{{ fmt.eur(data.projectedAnnualGross) }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-2 mt-4">
          <div>
            <p class="label-xs text-white/70">Netto effettivo</p>
            <p class="font-mono text-base font-semibold text-white mt-1">{{ fmt.eur(data.ytdTaxes.annualNet) }}</p>
          </div>
          <div>
            <p class="label-xs text-white/70">Netto proiettato</p>
            <p class="font-mono text-base font-semibold text-white/90 mt-1">{{ fmt.eur(data.projectedTaxes.annualNet) }}</p>
          </div>
          <div>
            <p class="label-xs text-white/70">Aliq. effettiva</p>
            <p class="font-mono text-base font-semibold text-white mt-1">{{ fmt.pct(data.projectedTaxes.effectiveRate) }}</p>
          </div>
          <div>
            <p class="label-xs text-white/70">Accantona</p>
            <p class="font-mono text-base font-semibold text-white mt-1">{{ fmt.eur(data.recommendedMonthlySetAside) }}/mese</p>
          </div>
        </div>
      </div>

      <section class="fade-up fade-up-2">
        <h2 class="label-xs mb-3">Lordo mensile</h2>
        <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5">
          <ChartsBarChart
            :months="data.months"
            :highlight="currentMonth"
            :height="180"
          />
        </div>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="fade-up fade-up-3">
          <h2 class="label-xs mb-3">Dettaglio tasse (Proiezione)</h2>
          <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5">
            <div class="flex items-center gap-6 mb-6">
              <div class="shrink-0 w-32 h-32">
                <ChartsDonutChart
                  :irpef="activeTaxes.irpef"
                  :inps="activeTaxes.inps"
                  :accountant="activeTaxes.accountant"
                  :net="activeTaxes.annualNet"
                  :height="128"
                />
              </div>
              <div class="flex-1 space-y-2">
                <div v-for="row in donutLegend" :key="row.label" class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" :style="{ background: row.color }" />
                    <span class="font-mono text-xs text-revolut-muted">{{ row.label }}</span>
                  </div>
                  <span class="num-sm text-revolut-text light:text-revolut-light-text">{{ fmt.eur(row.value, true) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="fade-up fade-up-3">
          <div class="flex items-center justify-between mb-3">
            <h2 class="label-xs">Dettaglio annuale</h2>
            <div class="flex bg-revolut-card light:bg-revolut-light-border rounded-lg p-0.5">
              <button
                v-for="v in (['projected', 'ytd'] as const)"
                :key="v"
                class="px-3 py-1 rounded-md text-xs font-mono transition-all"
                :class="breakdownView === v
                  ? 'bg-revolut-dark light:bg-white text-revolut-text light:text-revolut-light-text shadow-sm'
                  : 'text-revolut-muted hover:text-revolut-text'"
                @click="breakdownView = v"
              >
                {{ v === 'projected' ? 'Proiezione' : 'Effettivo' }}
              </button>
            </div>
          </div>
          <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border">
            <div v-for="row in taxTable" :key="row.label" class="flex justify-between items-center px-5 py-3.5 border-b border-revolut-border light:border-revolut-light-border last:border-0">
              <span class="font-mono text-xs text-revolut-muted">{{ row.label }}</span>
              <span class="num-sm" :class="row.class">{{ row.value }}</span>
            </div>
          </div>
        </section>
      </div>

      <section v-if="data.paymentDeadlines?.length" class="fade-up fade-up-4">
        <h2 class="label-xs mb-3">Scadenze fiscali</h2>
        <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border">
          <div
            v-for="(dl, i) in data.paymentDeadlines"
            :key="i"
            class="flex items-center gap-4 px-5 py-4 border-b border-revolut-border light:border-revolut-light-border last:border-0"
            :class="{ 'opacity-40': dl.isPast }"
          >
            <div class="w-2 h-2 rounded-full shrink-0" :class="dl.isPast ? 'bg-revolut-muted' : nextDeadlineDate === dl.date ? 'bg-revolut-green animate-pulse' : 'bg-revolut-border'" />
            <div class="flex-1 min-w-0">
              <p class="font-mono text-xs text-revolut-text light:text-revolut-light-text">{{ dl.label }}</p>
              <p class="font-mono text-xs text-revolut-muted mt-0.5">{{ formatDeadlineDate(dl.date) }}</p>
            </div>
            <span class="num-sm text-revolut-red shrink-0">{{ fmt.eur(dl.estimatedAmount) }}</span>
          </div>
        </div>
        <p class="font-mono text-xs text-revolut-muted mt-2 px-1">Importi stimati in base al reddito proiettato</p>
      </section>

      <section class="fade-up fade-up-5">
        <h2 class="label-xs mb-3">Mese per mese</h2>
        <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border">
          <div
            v-for="(month, i) in data.months"
            :key="i"
            class="flex items-center px-5 py-3.5 border-b border-revolut-border light:border-revolut-light-border last:border-0"
            :class="{ 'opacity-30': month.gross === 0 && i < data.startMonth }"
          >
            <span class="font-mono text-xs text-revolut-muted w-10 shrink-0">{{ MONTHS[i] }}</span>
            <div class="flex-1 px-4">
              <div class="h-2 bg-revolut-card light:bg-revolut-light-border rounded-full overflow-hidden">
                <div
                  class="h-full bg-revolut-green transition-all"
                  :style="{ width: barWidth(month.gross) }"
                />
              </div>
            </div>
            <div class="text-right shrink-0 min-w-[100px]">
              <p class="num-sm text-revolut-text light:text-revolut-light-text">{{ fmt.eur(month.gross, true) }}</p>
              <p class="font-mono text-xs text-revolut-muted">netto {{ fmt.eur(month.net, true) }}</p>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
const fmt = useFmt()
const now = new Date()
const currentMonth = now.getMonth()
const viewYear = ref(now.getFullYear())
const loading = ref(true)
const data = ref<any>(null)
const breakdownView = ref<'projected' | 'ytd'>('projected')

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']

const maxGross = computed(() =>
  data.value ? Math.max(...data.value.months.map((m: any) => m.gross), 1) : 1
)

function barWidth(gross: number) {
  return ((gross / maxGross.value) * 100).toFixed(1) + '%'
}

const activeTaxes = computed(() => {
  if (!data.value) return null
  return breakdownView.value === 'projected' ? data.value.projectedTaxes : data.value.ytdTaxes
})

const donutLegend = computed(() => {
  const t = activeTaxes.value
  if (!t) return []
  return [
    { label: 'Reddito netto', value: t.annualNet, color: '#00d09c' },
    { label: 'IRPEF', value: t.irpef, color: '#ff6b6b' },
    { label: 'INPS', value: t.inps, color: '#ffb34c' },
    { label: 'Commercialista', value: t.accountant, color: '#a0a0a8' },
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
    { label: isProj ? 'Netto annuale proiettato' : 'Netto da inizio anno', value: fmt.eur(t.annualNet), class: 'text-revolut-green font-semibold' },
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
