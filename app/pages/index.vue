<template>
  <div class="px-4 pt-6 space-y-6 md:px-6">
    <section v-if="monthData" class="fade-up">
      <h1 class="font-display text-xl font-semibold text-revolut-text light:text-revolut-light-text mb-1 capitalize">{{ monthLabel }}</h1>
      <p class="text-sm text-revolut-muted">Registra il tuo lavoro e monitora il reddito</p>

      <div class="mt-6 bg-linear-to-br from-revolut-green to-revolut-green-dark rounded-3xl p-6 shadow-lg shadow-revolut-green/10 fade-up fade-up-1">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="label-xs text-white/70">Lordo questo mese</p>
            <p class="num-display text-white mt-2">{{ fmt.eur(monthData.gross) }}</p>
            <p class="font-mono text-sm text-white/80 mt-3">Netto stimato {{ fmt.eur(monthData.net) }}</p>
          </div>

          <div class="space-y-2 shrink-0">
            <div class="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2">
              <p class="label-xs text-white/70">Registrazioni</p>
              <p class="font-display text-xl text-white leading-tight mt-1">{{ monthData.entryCount }}</p>
            </div>
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-2">
              <p class="label-xs text-white/70">Ore</p>
              <p class="font-display text-xl text-white leading-tight mt-1">{{ fmt.hours(monthData.totalHours) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <StatCard
          label="Ore registrate"
          :value="fmt.hours(monthData.totalHours)"
          class="fade-up fade-up-2"
        />
        <StatCard
          label="Accantonamento tasse"
          :value="fmt.eur(monthData.provision)"
          value-class="text-revolut-red"
          class="fade-up fade-up-3"
        />
      </div>

      <div v-if="monthData.runningAvgMonthly > 0" class="bg-revolut-card light:bg-revolut-light-bg rounded-2xl border border-revolut-border light:border-revolut-light-border px-5 my-4 py-3 fade-up fade-up-2">
        <p class="font-mono text-xs text-revolut-muted">
          Media <span class="text-revolut-text light:text-revolut-light-text font-medium">{{ fmt.eur(monthData.runningAvgMonthly) }}/mese</span>
          &rarr; proiezione <span class="text-revolut-text light:text-revolut-light-text font-medium">{{ fmt.eur(monthData.runningProjectedAnnual) }}/anno</span>
          &middot; accantona <span class="text-revolut-red font-medium">{{ fmt.eur(annualData?.recommendedMonthlySetAside) }}/mese</span>
        </p>
      </div>
    </section>

    <section class="fade-up fade-up-2">
      <h2 class="label-xs mb-3">Nuova registrazione</h2>

      <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="t in ['HOURLY', 'PROJECT']"
              :key="t"
              type="button"
              class="px-4 py-3 rounded-xl border transition-all text-sm font-medium"
              :class="form.type === t
                ? 'bg-revolut-card border-revolut-green text-revolut-green'
                : 'border-revolut-border text-revolut-muted hover:border-[#3a3a3d]'"
              @click="form.type = t as 'HOURLY' | 'PROJECT'"
            >
              {{ t === 'HOURLY' ? 'Orario' : 'Progetto' }}
            </button>
          </div>

          <div>
            <label class="label-xs block mb-2">Data</label>
            <UInput type="date" v-model="form.date" />
          </div>

          <div v-if="form.type === 'HOURLY'">
            <label class="label-xs block mb-2">Ore lavorate</label>
            <UInput
              type="number"
              step="0.25"
              min="0"
              max="12"
              placeholder="7.5"
              v-model="form.hours"
            />
            <p v-if="form.hours && settings" class="text-xs text-revolut-green mt-2 font-mono">
              Fattura: {{ fmt.eur(parseFloat(form.hours) * settings.hourlyRate) }}
            </p>
          </div>

          <div v-else>
            <label class="label-xs block mb-2">Importo (€)</label>
            <UInput
              type="number"
              step="0.01"
              min="0"
              placeholder="500.00"
              v-model="form.amount"
            />
          </div>

          <div>
            <label class="label-xs block mb-2">Descrizione</label>
            <UInput
              type="text"
              placeholder="Progetto cliente, consulenza..."
              v-model="form.description"
            />
          </div>
        </div>
      </div>

      <UButton
        block
        class="mt-3 rounded-2xl"
        :disabled="!canSubmit || saving"
        :loading="saving"
        @click="submit"
      >
        Registra
      </UButton>
    </section>

    <section class="fade-up fade-up-3">
      <div class="flex items-center justify-between mb-3">
        <h2 class="label-xs">Registrazioni recenti</h2>
        <p class="label-xs">{{ monthLabel }}</p>
      </div>

      <div v-if="loadingEntries" class="py-12 flex justify-center">
        <UIcon name="lucide:loader-2" class="w-5 h-5 animate-spin text-revolut-muted" />
      </div>

      <div v-else-if="entries.length === 0" class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border py-12 text-center">
        <p class="text-sm text-revolut-muted">Nessuna registrazione</p>
      </div>

      <div v-else class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border px-5">
        <EntryRow
          v-for="entry in entries"
          :key="entry.id"
          :entry="entry"
          :hourly-rate="settings?.hourlyRate"
          deletable
          @delete="deleteEntry"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const fmt = useFmt()
const now = new Date()
const monthLabel = now.toLocaleString('it-IT', { month: 'long', year: 'numeric' })

const form = reactive({
  type: 'HOURLY' as 'HOURLY' | 'PROJECT',
  date: now.toISOString().split('T')[0],
  hours: '',
  amount: '',
  description: '',
})

const saving = ref(false)
const loadingEntries = ref(true)
const entries = ref<any[]>([])
const annualData = ref<any>(null)
const monthData = ref<any>(null)
const settings = ref<any>(null)

const canSubmit = computed(() => {
  if (!form.date) return false
  if (form.type === 'HOURLY') return parseFloat(form.hours) > 0
  return parseFloat(form.amount) > 0
})

async function loadEntries() {
  loadingEntries.value = true
  entries.value = await $fetch(`/api/entries?year=${now.getFullYear()}&month=${now.getMonth()}`)
  loadingEntries.value = false
}

async function loadMonthData() {
  const data = await $fetch<any>(`/api/summary/annual?year=${now.getFullYear()}`)
  annualData.value = data
  monthData.value = data.months[now.getMonth()]
}

async function loadSettings() {
  settings.value = await $fetch('/api/settings')
}

async function submit() {
  saving.value = true
  try {
    await $fetch('/api/entries', {
      method: 'POST',
      body: {
        type: form.type,
        date: form.date,
        hours: form.type === 'HOURLY' ? form.hours : null,
        amount: form.type === 'PROJECT' ? form.amount : null,
        description: form.description || null,
      },
    })
    form.hours = ''
    form.amount = ''
    form.description = ''
    await Promise.all([loadEntries(), loadMonthData()])
  } finally {
    saving.value = false
  }
}

async function deleteEntry(id: number) {
  await $fetch(`/api/entries/${id}`, { method: 'DELETE' })
  await Promise.all([loadEntries(), loadMonthData()])
}

onMounted(() => {
  loadEntries()
  loadMonthData()
  loadSettings()
})
</script>
