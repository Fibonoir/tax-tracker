<template>
  <div class="px-4 pt-6 space-y-6 md:px-6">
    <div class="flex items-center gap-4 fade-up">
      <button
        class="w-10 h-10 rounded-xl flex items-center justify-center border border-revolut-border light:border-revolut-light-border text-revolut-muted hover:text-revolut-text hover:border-[#3a3a3d] transition-all"
        @click="prevMonth"
      >
        <UIcon name="lucide:chevron-left" class="w-5 h-5" />
      </button>
      <h1 class="flex-1 text-center font-display text-xl font-semibold text-revolut-text light:text-revolut-light-text capitalize">{{ monthLabel }}</h1>
      <button
        class="w-10 h-10 rounded-xl flex items-center justify-center border border-revolut-border light:border-revolut-light-border text-revolut-muted hover:text-revolut-text hover:border-[#3a3a3d] transition-all disabled:opacity-40 disabled:hover:border-revolut-border disabled:hover:text-revolut-muted"
        :disabled="isCurrentMonth"
        @click="nextMonth"
      >
        <UIcon name="lucide:chevron-right" class="w-5 h-5" />
      </button>
    </div>

    <div v-if="loading" class="py-16 flex justify-center">
      <UIcon name="lucide:loader-2" class="w-6 h-6 animate-spin text-revolut-muted" />
    </div>

    <template v-else-if="summary">
      <div class="bg-linear-to-br from-revolut-green to-revolut-green-dark rounded-3xl p-6 shadow-lg shadow-revolut-green/10 fade-up fade-up-1">
        <p class="label-xs text-white/70">Reddito lordo</p>
        <p class="num-display text-white mt-2">{{ fmt.eur(summary.gross) }}</p>
        <p class="font-mono text-sm text-white/80 mt-3">
          {{ fmt.hours(summary.totalHours) }} · {{ summary.entryCount }} registrazioni
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 fade-up fade-up-2">
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

      <div v-if="summary.runningAvgMonthly > 0" class="bg-revolut-card light:bg-revolut-light-bg rounded-2xl border border-revolut-border light:border-revolut-light-border px-5 py-3 fade-up fade-up-2">
        <p class="font-mono text-xs text-revolut-muted">
          Media <span class="text-revolut-text light:text-revolut-light-text font-medium">{{ fmt.eur(summary.runningAvgMonthly) }}/mese</span>
          &rarr; proiezione <span class="text-revolut-text light:text-revolut-light-text font-medium">{{ fmt.eur(summary.runningProjectedAnnual) }}/anno</span>
        </p>
      </div>

      <section class="fade-up fade-up-3">
        <h2 class="label-xs mb-3">Accantonamenti mensili</h2>
        <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border">
          <div v-for="(row, i) in taxRows" :key="row.label" class="flex justify-between items-center px-5 py-4 border-b border-revolut-border light:border-revolut-light-border last:border-0">
            <span class="font-mono text-xs text-revolut-muted">{{ row.label }}</span>
            <span class="num-sm" :class="row.class">{{ row.value }}</span>
          </div>
        </div>
      </section>

      <section class="fade-up fade-up-4">
        <h2 class="label-xs mb-3">Registrazioni</h2>

        <div v-if="entries.length === 0" class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border py-12 text-center">
          <p class="text-sm text-revolut-muted">Nessuna registrazione</p>
        </div>

        <div v-else class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border px-5">
          <EntryRow
            v-for="entry in entries"
            :key="entry.id"
            :entry="entry"
            :hourly-rate="settings?.hourlyRate"
          />
        </div>
      </section>
    </template>
  </div>
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
