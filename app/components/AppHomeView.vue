<template>
  <AppPageShell class="app-page app-page--home">
    <div class="app-main-stack app-home-intro">
      <SurfaceCard v-if="monthData" variant="gradient" padding="lg" class="fade-up fade-up-1">
        <div class="app-stage">
          <div class="app-stage__header">
            <p class="app-stage__eyebrow">{{ monthLabel }}</p>

            <div class="app-stage__metric-block">
              <p class="app-stage__metric-label">{{ homeMonthUi?.availabilityLabel }}</p>
              <p class="app-stage__metric" :class="{ 'is-negative': monthData.net < 0 }">{{ fmt.eur(monthData.net) }}</p>
              <p class="app-stage__summary">
                {{ monthLabel }} · {{ currentMonthGrossLabel.toLowerCase() }} {{ fmt.eur(currentMonthGrossValue) }} · da accantonare
                {{ fmt.eur(monthData.provision) }}
              </p>
            </div>
          </div>

          <div class="app-stage__signals">
            <div class="app-stage__signal app-stage__signal--strong">
              <p class="app-stage__signal-label">{{ homeMonthUi?.provisionLabel }}</p>
              <p class="app-stage__signal-value">{{ fmt.eur(monthData.provision) }}</p>
              <p class="app-stage__signal-note">{{ homeMonthUi?.provisionNote }}</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Prossima scadenza</p>
              <p class="app-stage__signal-value">{{ canUseDeadlines && nextDeadline ? formatDeadlineDate(nextDeadline.date) : 'Core' }}</p>
              <p class="app-stage__signal-note">
                {{ canUseDeadlines && nextDeadline ? `${nextDeadline.label} · ${fmt.eur(nextDeadline.estimatedAmount)}` : 'Disponibile con Core Clarity.' }}
              </p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Stima fine anno</p>
              <p class="app-stage__signal-value">{{ fmt.eur(monthData.runningProjectedAnnual) }}</p>
              <p class="app-stage__signal-note">Proiezione al ritmo attuale.</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div v-if="monthData" class="app-decision-grid fade-up fade-up-2">
        <DecisionMetric
          :label="homeMonthUi?.availabilityLabel || 'Disponibile ora'"
          :value="fmt.eur(monthData.net)"
          :note="homeMonthUi?.availabilityNote || 'Il netto dopo accantonamenti.'"
          :tone="monthData.net < 0 ? 'danger' : 'accent'"
          compact
        />
        <DecisionMetric
          :label="homeMonthUi?.provisionLabel || 'Da accantonare'"
          :value="fmt.eur(monthData.provision)"
          note="Imposte + contributi + costi distribuiti."
          tone="danger"
          compact
        />
        <DecisionMetric
          label="Prossima scadenza"
          :value="canUseDeadlines && nextDeadline ? formatDeadlineDate(nextDeadline.date) : 'Core'"
          :note="canUseDeadlines && nextDeadline ? `${nextDeadline.label} · ${fmt.eur(nextDeadline.estimatedAmount)}` : 'Disponibile con Core Clarity.'"
          tone="info"
          compact
        />
      </div>

      <div class="app-grid-2">
        <SurfaceCard padding="lg" class="fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Nuovo incasso</p>
              <h2 class="font-display text-2xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                Registra un incasso.
              </h2>
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
                <span class="text-xs leading-6 text-[var(--text-secondary)]">{{ option.copy }}</span>
              </button>
            </div>

            <div class="ui-form-grid-2">
              <div>
                <label class="label-xs ui-field-label">Data</label>
                <AppDateField v-model="form.date" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Competenza (opzionale)</label>
                <UInput
                  v-model="form.competenceMonth"
                  type="month"
                  :ui="fieldUi"
                />
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
                <label class="label-xs ui-field-label">Importo concordato (€)</label>
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
              <label class="label-xs ui-field-label">Nota</label>
              <UInput
                v-model="form.description"
                type="text"
                placeholder="Cliente, milestone o call strategica"
                :ui="fieldUi"
              />
            </div>

            <SurfaceCard variant="soft" padding="md">
              <div class="app-grid-3">
                <div>
                  <p class="label-xs">Incasso lordo</p>
                  <p class="num-lg text-[var(--text-primary)] mt-3">{{ fmt.eur(previewGross) }}</p>
                </div>

                <div>
                  <p class="label-xs">Da accantonare</p>
                  <p class="num-lg text-[var(--danger-text)] mt-3">{{ fmt.eur(previewProvision) }}</p>
                </div>

                <div>
                  <p class="label-xs">Quanto puoi usare</p>
                  <p class="num-lg text-[var(--accent-text)] mt-3">{{ fmt.eur(previewNet) }}</p>
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
              Registra incasso
            </UButton>
          </div>
        </SurfaceCard>

        <div class="app-main-stack">
          <ExplanationPanel
            v-if="explanationItems.length"
            title="Come si forma il disponibile"
            subtitle=""
            :items="explanationItems"
            open
          />

          <DeadlineCard
            v-if="nextDeadline && canUseDeadlines"
            :label="nextDeadline.label"
            :date="formatDeadlineDate(nextDeadline.date)"
            :note="nextDeadline.isPast ? 'Scadenza gia passata' : 'Prossimo appuntamento fiscale previsto dal tuo modello.'"
            :amount="fmt.eur(nextDeadline.estimatedAmount)"
            :active="!nextDeadline.isPast"
          />

          <IncomeProjectionCard
            v-if="monthData?.runningAvgMonthly > 0"
            :avg-monthly="monthData?.runningAvgMonthly ?? 0"
            :projected-annual="monthData?.runningProjectedAnnual ?? 0"
            :monthly-set-aside="annualData?.recommendedMonthlySetAside"
            :avg-label="annualData?.projectionBasis?.label"
            class="fade-up fade-up-2"
          />
        </div>
      </div>
    </div>

    <AppSection
      class="app-home-recent"
      title="Registrazioni recenti"
      subtitle="Apri una registrazione per correggere data, importo o nota."
      :delay="3"
    >
      <template #header-right>
        <NuxtLink to="/app/month" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]">
          Vai al mese
        </NuxtLink>
      </template>

      <StateBlock v-if="loadingEntries" type="loading" text="Sto caricando le registrazioni di questo mese..." />

      <SurfaceCard v-else-if="entries.length === 0" padding="md">
        <StateBlock type="empty" text="Nessuna registrazione per ora. Registra il primo incasso qui sopra." />
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

      <SurfaceCard v-if="hasHistoryPaywall" variant="soft" padding="md" class="mt-4">
        <div class="ui-form-stack">
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Storico limitato</span>
            <span class="ui-kv-row__value text-[var(--accent-text)]">Core Clarity</span>
          </div>
          <p class="app-page-copy">
            Nel piano free il cockpit mostra solo le ultime {{ recentHistoryLimit }} registrazioni.
            Con Core sblocchi storico completo, scadenze e vista mensile piena.
          </p>
          <NuxtLink to="/pricing" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]">
            Vedi piani
          </NuxtLink>
        </div>
      </SurfaceCard>
    </AppSection>

    <InvoiceDetailsModal
      :open="detailsOpen"
      :entry="selectedEntry"
      :hourly-rate="settings?.hourlyRate"
      editable
      deletable
      :saving="savingEntry"
      @update:open="detailsOpen = $event"
      @request-save="updateEntry"
      @request-delete="openDeleteConfirm"
    />

    <UModal
      :open="deleteConfirmOpen"
      title="Elimina registrazione"
      description="La registrazione verra rimossa dal mese corrente e tutte le stime si aggiorneranno."
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
import { getMonthSummaryUiState } from '~~/shared/month-ui'

const fmt = useFmt()
const { fieldUi } = useUiStyles()
const { currentUser } = useCurrentUser()
const now = new Date()
const monthLabel = now.toLocaleString('it-IT', { month: 'long', year: 'numeric' })

const typeOptions = [
  {
    value: 'HOURLY' as const,
    label: 'Sessione oraria',
    copy: 'Per call, consulenze e giornate fatturate a ore.',
  },
  {
    value: 'PROJECT' as const,
    label: 'Fee progetto',
    copy: 'Per milestone, consegne e importi gia concordati.',
  },
]

const form = reactive({
  type: 'HOURLY' as 'HOURLY' | 'PROJECT',
  date: now.toISOString().split('T')[0],
  competenceMonth: '',
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
const savingEntry = ref(false)
const deleteConfirmOpen = ref(false)
const deleting = ref(false)
const pendingDeleteId = ref<number | null>(null)
const billing = computed(() => currentUser.value?.billing ?? null)
const recentHistoryLimit = computed(() => billing.value?.entitlements.dashboardHistoryLimit ?? null)
const canUseDeadlines = computed(() => billing.value?.entitlements.canUseDeadlines ?? false)
const hasHistoryPaywall = computed(() =>
  recentHistoryLimit.value !== null && entries.value.length >= recentHistoryLimit.value
)

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

const nextDeadline = computed(() => {
  if (!annualData.value?.paymentDeadlines) return null
  return annualData.value.paymentDeadlines.find((deadline: any) => !deadline.isPast) ?? null
})

const explanationItems = computed(() => {
  if (!annualData.value?.explanations) return []

  return annualData.value.explanations.map((item: any) => ({
    id: item.id,
    label: item.label,
    value: fmt.eur(item.value),
    text: item.text,
    tone: item.tone === 'warning' ? 'warning' : item.tone,
  }))
})

const currentMonthGrossLabel = computed(() =>
  homeMonthUi.value?.grossLabel || 'Incassato'
)

const currentMonthGrossValue = computed(() => (
  homeMonthUi.value?.grossValue || 0
))

const homeMonthUi = computed(() => (
  monthData.value ? getMonthSummaryUiState(monthData.value, 'home') : null
))

async function loadEntries() {
  loadingEntries.value = true
  entries.value = await $fetch(`/api/entries?year=${now.getFullYear()}&month=${now.getMonth()}&source=home`)
  loadingEntries.value = false
}

async function loadMonthData() {
  const data = await $fetch<any>(`/api/summary/annual?year=${now.getFullYear()}&source=home`)
  annualData.value = data
  monthData.value = data?.months?.[now.getMonth()] ?? null
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
        competenceMonth: form.competenceMonth || null,
        hours: form.type === 'HOURLY' ? form.hours : null,
        amount: form.type === 'PROJECT' ? form.amount : null,
        description: form.description || null,
      },
    })
    form.competenceMonth = ''
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

async function updateEntry(payload: any) {
  if (!selectedEntry.value) return

  savingEntry.value = true
  try {
    await $fetch(`/api/entries/${selectedEntry.value.id}`, {
      method: 'PATCH',
      body: payload,
    })

    detailsOpen.value = false
    selectedEntry.value = null
    await Promise.all([loadEntries(), loadMonthData()])
  } finally {
    savingEntry.value = false
  }
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

function formatDeadlineDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}

onMounted(() => {
  loadEntries()
  loadMonthData()
  loadSettings()
})
</script>
