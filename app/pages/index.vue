<template>
  <AppPageShell>
    <div class="app-grid-2 items-start">
      <SurfaceCard v-if="monthData" variant="gradient" padding="lg" class="order-2 fade-up fade-up-1 md:order-1">
        <div class="app-stage">
          <div class="app-stage__header">
            <p class="app-stage__eyebrow">Decisione del mese</p>
            <h1 class="app-stage__title">{{ monthLabel }}</h1>
            <p class="app-stage__lead">
              Registra il lavoro appena chiuso e controlla subito quanto puoi considerare disponibile,
              quanto va accantonato e quale ritmo stai tenendo.
            </p>

            <div class="app-stage__metric-block">
              <p class="app-stage__metric-label">Disponibile stimato</p>
              <p class="app-stage__metric">{{ fmt.eur(monthData.net) }}</p>
              <p class="app-stage__summary">
                Incassato {{ fmt.eur(monthData.gross) }} · accantona {{ fmt.eur(monthData.provision) }}
              </p>
            </div>
          </div>

          <div class="app-stage__signals">
            <div class="app-stage__signal app-stage__signal--strong">
              <p class="app-stage__signal-label">Incassato nel mese</p>
              <p class="app-stage__signal-value">{{ fmt.eur(monthData.gross) }}</p>
              <p class="app-stage__signal-note">Il lordo già registrato nelle voci correnti.</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Da accantonare</p>
              <p class="app-stage__signal-value">{{ fmt.eur(monthData.provision) }}</p>
              <p class="app-stage__signal-note">Quota stimata tra imposte, contributi e costi distribuiti.</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Ritmo medio</p>
              <p class="app-stage__signal-value">{{ fmt.eur(monthData.runningAvgMonthly) }}</p>
              <p class="app-stage__signal-note">Media mensile da inizio operativita.</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard padding="lg" class="order-1 fade-up fade-up-2 md:order-2">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs">Nuovo incasso</p>
            <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-revolut-text light:text-revolut-light-text mt-3">
              Registra solo cio che serve.
            </h2>
            <p class="app-page-copy mt-3">
              Tipo di lavoro, data e importo. Appena salvi, il quadro del mese si aggiorna con
              disponibile, accantonamento e proiezione.
            </p>
          </div>

          <div class="ui-form-grid-2 ui-form-grid-2--compact">
            <button
              v-for="option in typeOptions"
              :key="option.value"
              type="button"
              class="ui-segment-btn"
              :class="{ 'is-active': form.type === option.value }"
              @click="form.type = option.value"
            >
              <span>{{ option.label }}</span>
              <span class="text-xs leading-6 text-revolut-muted light:text-revolut-light-muted">{{ option.copy }}</span>
            </button>
          </div>

          <div class="ui-form-grid-2">
            <div>
              <label class="label-xs ui-field-label">Data</label>
              <AppDateField v-model="form.date" />
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
                :ui="fieldUi"
              />
            </div>

            <div v-else>
              <label class="label-xs ui-field-label">Importo progetto (€)</label>
              <UInput
                v-model="form.amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                :ui="fieldUi"
              />
            </div>
          </div>

          <div>
            <label class="label-xs ui-field-label">Descrizione</label>
            <UInput
              v-model="form.description"
              type="text"
              placeholder="Cliente, milestone, call strategica..."
              :ui="fieldUi"
            />
          </div>

          <SurfaceCard variant="soft" padding="md">
            <div class="app-grid-3">
              <div>
                <p class="label-xs">Lordo</p>
                <p class="num-lg text-revolut-text light:text-revolut-light-text mt-3">{{ fmt.eur(previewGross) }}</p>
                <p class="ui-field-help">Calcolato con la tariffa attuale o l'importo progetto inserito.</p>
              </div>

              <div>
                <p class="label-xs">Disponibile</p>
                <p class="num-lg text-revolut-green mt-3">{{ fmt.eur(previewNet) }}</p>
                <p class="ui-field-help">Stima rapida basata sull'aliquota effettiva annuale in corso.</p>
              </div>

              <div>
                <p class="label-xs">Accantonamento</p>
                <p class="num-lg text-revolut-red mt-3">{{ fmt.eur(previewProvision) }}</p>
                <p class="ui-field-help">Quota da tenere fuori dal denaro spendibile del mese.</p>
              </div>
            </div>
          </SurfaceCard>

          <UButton
            block
            color="primary"
            class="ui-action-button"
            :disabled="!canSubmit || saving"
            :loading="saving"
            @click="submit"
          >
            Salva incasso
          </UButton>
        </div>
      </SurfaceCard>
    </div>

    <div v-if="monthData" class="app-home-stat-grid">
      <StatCard
        v-for="stat in homeStats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :sub="stat.sub"
        :value-class="stat.valueClass"
        class="fade-up fade-up-2"
      />
    </div>

    <div v-if="monthData" class="app-grid-2">
      <IncomeProjectionCard
        v-if="monthData.runningAvgMonthly > 0"
        :avg-monthly="monthData.runningAvgMonthly"
        :projected-annual="monthData.runningProjectedAnnual"
        :monthly-set-aside="annualData?.recommendedMonthlySetAside"
        class="fade-up fade-up-2"
      />

      <SurfaceCard class="fade-up fade-up-3">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs">Focus del momento</p>
            <h2 class="font-display text-2xl leading-none tracking-[-0.04em] text-revolut-text light:text-revolut-light-text mt-3">
              Le tre cose da guardare subito.
            </h2>
          </div>

          <div class="ui-form-stack">
            <div v-for="row in focusRows" :key="row.label" class="ui-kv-row">
              <span class="ui-kv-row__label">{{ row.label }}</span>
              <span class="ui-kv-row__value" :class="row.class">{{ row.value }}</span>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>

    <AppSection
      title="Attività recente"
      subtitle="Apri una registrazione per controllare il dettaglio o correggere il mese corrente."
      :delay="3"
    >
      <template #header-right>
        <NuxtLink to="/month" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]">
          Apri mese
        </NuxtLink>
      </template>

      <StateBlock v-if="loadingEntries" type="loading" text="Sto caricando le registrazioni del mese..." />

      <SurfaceCard v-else-if="entries.length === 0" padding="md">
        <StateBlock type="empty" text="Nessuna registrazione ancora. Usa il composer sopra per creare la prima voce." />
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
      description="Questa azione rimuove la registrazione dal mese corrente e aggiorna tutte le stime."
      @update:open="deleteConfirmOpen = $event"
    >
      <template #footer>
        <div class="ui-invoice-detail__actions">
          <UButton color="neutral" variant="soft" class="ui-action-button--ghost" @click="deleteConfirmOpen = false">
            Annulla
          </UButton>
          <UButton color="red" variant="soft" class="ui-action-button--ghost" :loading="deleting" @click="confirmDelete">
            Elimina
          </UButton>
        </div>
      </template>
    </UModal>
  </AppPageShell>
</template>

<script setup lang="ts">
const fmt = useFmt()
const { fieldUi } = useUiStyles()
const now = new Date()
const monthLabel = now.toLocaleString('it-IT', { month: 'long', year: 'numeric' })

const typeOptions = [
  {
    value: 'HOURLY' as const,
    label: 'Sessione oraria',
    copy: 'Ideale per call, consulenze e giornate fatturate a ore.',
  },
  {
    value: 'PROJECT' as const,
    label: 'Fee progetto',
    copy: 'Per milestone, consegne una tantum e importi già concordati.',
  },
]

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

const previewGross = computed(() => {
  if (form.type === 'HOURLY') {
    return (parseFloat(form.hours) || 0) * (settings.value?.hourlyRate || 0)
  }

  return parseFloat(form.amount) || 0
})

const effectiveRate = computed(() => annualData.value?.projectedTaxes?.effectiveRate || 0)

const previewNet = computed(() => {
  if (!previewGross.value) return 0
  return previewGross.value * (1 - effectiveRate.value / 100)
})

const previewProvision = computed(() => Math.max(previewGross.value - previewNet.value, 0))

const averageEntryGross = computed(() => {
  if (!monthData.value?.entryCount) return 0
  return monthData.value.gross / monthData.value.entryCount
})

const homeStats = computed(() => {
  if (!monthData.value) return []

  return [
    {
      label: 'Ore registrate',
      value: fmt.hours(monthData.value.totalHours),
      sub: `${monthData.value.entryCount} voci nel mese`,
    },
    {
      label: 'Media per voce',
      value: fmt.eur(averageEntryGross.value),
      sub: 'Quanto vale in media ogni registrazione salvata',
    },
    {
      label: 'Aliquota stimata',
      value: fmt.pct(effectiveRate.value),
      sub: 'Quota effettiva tra imposte, contributi e costi distribuiti',
    },
  ]
})

const focusRows = computed(() => {
  if (!monthData.value || !annualData.value) return []

  return [
    {
      label: 'Puoi considerare disponibile',
      value: fmt.eur(monthData.value.net),
      class: 'text-revolut-green',
    },
    {
      label: 'Da spostare per tasse',
      value: fmt.eur(monthData.value.provision),
      class: 'text-revolut-red',
    },
    {
      label: 'Proiezione fine anno',
      value: fmt.eur(monthData.value.runningProjectedAnnual),
      class: 'text-revolut-text light:text-revolut-light-text',
    },
  ]
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
