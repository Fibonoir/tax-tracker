<template>
  <AppPageShell>
    <AppSection v-if="monthData">
      <div>
        <h1 class="font-display text-xl font-semibold text-revolut-text light:text-revolut-light-text mb-1 capitalize">{{ monthLabel }}</h1>
        <p class="text-sm text-revolut-muted">Registra il tuo lavoro e monitora il reddito</p>
      </div>

      <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1 app-home-hero">
        <div class="app-home-hero__layout">
          <div class="app-home-hero__main">
            <p class="label-xs text-white-muted">Lordo questo mese</p>
            <p class="num-display text-white mt-2">{{ fmt.eur(monthData.gross) }}</p>
            <p class="font-mono text-sm text-white-soft mt-3">Netto stimato {{ fmt.eur(monthData.net) }}</p>
          </div>

          <div class="app-home-hero__stats">
            <div class="app-home-hero__chip">
              <p class="label-xs text-white-muted">Registrazioni</p>
              <p class="font-display text-xl text-white leading-tight mt-1">{{ monthData.entryCount }}</p>
            </div>
            <div class="app-home-hero__chip app-home-hero__chip--soft">
              <p class="label-xs text-white-muted">Ore</p>
              <p class="font-display text-xl text-white leading-tight mt-1">{{ fmt.hours(monthData.totalHours) }}</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div class="app-home-stat-grid">
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

      <IncomeProjectionCard
        v-if="monthData.runningAvgMonthly > 0"
        :avg-monthly="monthData.runningAvgMonthly"
        :projected-annual="monthData.runningProjectedAnnual"
        :monthly-set-aside="annualData?.recommendedMonthlySetAside"
        class="fade-up fade-up-2"
      />
    </AppSection>

    <AppSection title="Nuova registrazione" :delay="2">
      <SurfaceCard>
        <div class="ui-form-stack">
          <div class="ui-form-grid-2 ui-form-grid-2--compact">
            <button
              v-for="t in ['HOURLY', 'PROJECT']"
              :key="t"
              type="button"
              class="ui-segment-btn"
              :class="{ 'is-active': form.type === t }"
              @click="form.type = t as 'HOURLY' | 'PROJECT'"
            >
              {{ t === 'HOURLY' ? 'Orario' : 'Progetto' }}
            </button>
          </div>

          <div>
            <label class="label-xs ui-field-label">Data</label>
            <UInput v-model="form.date" type="date" />
          </div>

          <div v-if="form.type === 'HOURLY'">
            <label class="label-xs ui-field-label">Ore lavorate</label>
            <UInput
              v-model="form.hours"
              type="number"
              step="0.25"
              min="0"
              max="12"
              placeholder="7.5"
            />
            <p v-if="form.hours && settings" class="ui-field-help text-revolut-green font-mono">
              Fattura: {{ fmt.eur(parseFloat(form.hours) * settings.hourlyRate) }}
            </p>
          </div>

          <div v-else>
            <label class="label-xs ui-field-label">Importo (€)</label>
            <UInput
              v-model="form.amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="500.00"
            />
          </div>

          <div>
            <label class="label-xs ui-field-label">Descrizione</label>
            <UInput
              v-model="form.description"
              type="text"
              placeholder="Progetto cliente, consulenza..."
            />
          </div>
        </div>
      </SurfaceCard>

      <UButton
        block
        class="mt-3 rounded-2xl"
        :disabled="!canSubmit || saving"
        :loading="saving"
        @click="submit"
      >
        Registra
      </UButton>
    </AppSection>

    <AppSection :delay="3">
      <SectionHeader title="Registrazioni recenti" :meta="monthLabel" />

      <StateBlock v-if="loadingEntries" type="loading" />

      <SurfaceCard v-else-if="entries.length === 0" padding="md">
        <StateBlock type="empty" text="Nessuna registrazione" />
      </SurfaceCard>

      <SurfaceCard v-else padding="none">
        <div class="ui-list-shell">
          <EntryRow
            v-for="entry in entries"
            :key="entry.id"
            :entry="entry"
            :hourly-rate="settings?.hourlyRate"
            deletable
            @select="openInvoiceDetails"
            @delete="openDeleteConfirm"
          />
        </div>
      </SurfaceCard>
    </AppSection>

    <InvoiceDetailsModal
      :open="detailsOpen"
      :entry="selectedEntry"
      :hourly-rate="settings?.hourlyRate"
      deletable
      @update:open="detailsOpen = $event"
      @request-delete="openDeleteConfirm"
    />

    <UModal
      :open="deleteConfirmOpen"
      title="Elimina registrazione"
      description="Questa azione non può essere annullata."
      @update:open="deleteConfirmOpen = $event"
    >
      <template #footer>
        <div class="ui-invoice-detail__actions">
          <UButton color="neutral" variant="soft" @click="deleteConfirmOpen = false">
            Annulla
          </UButton>
          <UButton color="red" variant="soft" :loading="deleting" @click="confirmDelete">
            Elimina
          </UButton>
        </div>
      </template>
    </UModal>
  </AppPageShell>
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
const selectedEntry = ref<any | null>(null)
const detailsOpen = ref(false)
const deleteConfirmOpen = ref(false)
const deleting = ref(false)
const pendingDeleteId = ref<number | null>(null)

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

function openInvoiceDetails(entry: any) {
  selectedEntry.value = entry
  detailsOpen.value = true
}

function openDeleteConfirm(id: number) {
  pendingDeleteId.value = id
  deleteConfirmOpen.value = true
}

async function deleteEntry(id: number) {
  await $fetch(`/api/entries/${id}`, { method: 'DELETE' })
  await Promise.all([loadEntries(), loadMonthData()])
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  deleting.value = true
  try {
    await deleteEntry(pendingDeleteId.value)
    if (selectedEntry.value?.id === pendingDeleteId.value) {
      detailsOpen.value = false
      selectedEntry.value = null
    }
  } finally {
    deleting.value = false
    deleteConfirmOpen.value = false
    pendingDeleteId.value = null
  }
}

onMounted(() => {
  loadEntries()
  loadMonthData()
  loadSettings()
})
</script>
