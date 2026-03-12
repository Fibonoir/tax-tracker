<template>
  <AppPageShell class="app-page app-page--home">
    <div class="app-main-stack app-home-intro">
      <SurfaceCard v-if="monthData" variant="gradient" padding="lg" class="fade-up fade-up-1">
        <div class="app-stage">
          <div class="app-stage__header">
            <p class="app-stage__eyebrow">Cockpit mensile</p>
            <h1 class="app-stage__title">Quanto puoi usare adesso.</h1>
            <p class="app-stage__lead">
              Chiaro tiene al centro il numero operativo del mese: quello che resta davvero
              utilizzabile dopo accantonamenti, contributi e costi gia previsti.
            </p>

            <div class="app-stage__metric-block">
              <p class="app-stage__metric-label">Disponibile ora</p>
              <p class="app-stage__metric">{{ fmt.eur(monthData.net) }}</p>
              <p class="app-stage__summary">
                {{ monthLabel }} · incassato {{ fmt.eur(monthData.gross) }} · da accantonare
                {{ fmt.eur(monthData.provision) }}
              </p>
            </div>
          </div>

          <div class="app-stage__signals">
            <div class="app-stage__signal app-stage__signal--strong">
              <p class="app-stage__signal-label">Da accantonare</p>
              <p class="app-stage__signal-value">{{ fmt.eur(monthData.provision) }}</p>
              <p class="app-stage__signal-note">La parte del mese che non vuoi spendere per errore.</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Prossima scadenza</p>
              <p class="app-stage__signal-value">{{ nextDeadline ? formatDeadlineDate(nextDeadline.date) : 'Nessuna' }}</p>
              <p class="app-stage__signal-note">
                {{ nextDeadline ? `${nextDeadline.label} · ${fmt.eur(nextDeadline.estimatedAmount)}` : 'Nessuna scadenza fiscale attiva nel resto dell’anno.' }}
              </p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Stima fine anno</p>
              <p class="app-stage__signal-value">{{ fmt.eur(monthData.runningProjectedAnnual) }}</p>
              <p class="app-stage__signal-note">Il ritmo attuale proiettato sui mesi attivi dell’anno.</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div v-if="monthData" class="app-decision-grid fade-up fade-up-2">
        <DecisionMetric
          label="Disponibile ora"
          :value="fmt.eur(monthData.net)"
          note="Quello che puoi usare senza confondere lordo e soldi da mettere via."
          tone="accent"
          compact
        />
        <DecisionMetric
          label="Da accantonare questo mese"
          :value="fmt.eur(monthData.provision)"
          note="Imposte, contributi e costi distribuiti sul mese corrente."
          tone="danger"
          compact
        />
        <DecisionMetric
          label="Prossima scadenza"
          :value="nextDeadline ? formatDeadlineDate(nextDeadline.date) : 'Nessuna'"
          :note="nextDeadline ? `${nextDeadline.label} · ${fmt.eur(nextDeadline.estimatedAmount)}` : 'Nessuna scadenza fiscale attiva.'"
          tone="info"
          compact
        />
      </div>

      <div class="app-grid-2">
        <SurfaceCard padding="lg" class="fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Nuovo incasso</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                Registra un incasso senza uscire dal flusso.
              </h2>
              <p class="app-page-copy mt-3">
                Scegli il tipo di lavoro, salva il lordo e guarda subito quanto resta utilizzabile.
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
                <span class="text-xs leading-6 text-[var(--text-secondary)]">{{ option.copy }}</span>
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
                  <p class="ui-field-help">Calcolato con la tariffa salvata o con l'importo che hai inserito.</p>
                </div>

                <div>
                  <p class="label-xs">Da accantonare</p>
                  <p class="num-lg text-[var(--danger-text)] mt-3">{{ fmt.eur(previewProvision) }}</p>
                  <p class="ui-field-help">La parte che Chiaro tiene fuori dai soldi spendibili.</p>
                </div>

                <div>
                  <p class="label-xs">Quanto puoi usare</p>
                  <p class="num-lg text-[var(--accent-text)] mt-3">{{ fmt.eur(previewNet) }}</p>
                  <p class="ui-field-help">La stima veloce che guida la decisione, non il lordo.</p>
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
            title="Perche il disponibile non coincide con il lordo"
            subtitle="La logica e sempre la stessa: togliere prima cio che non e davvero spendibile."
            :items="explanationItems"
            open
          />

          <DeadlineCard
            v-if="nextDeadline"
            :label="nextDeadline.label"
            :date="formatDeadlineDate(nextDeadline.date)"
            :note="nextDeadline.isPast ? 'Scadenza gia passata' : 'Prossimo appuntamento fiscale previsto dal tuo modello.'"
            :amount="fmt.eur(nextDeadline.estimatedAmount)"
            :active="!nextDeadline.isPast"
          />

          <IncomeProjectionCard
            v-if="monthData.runningAvgMonthly > 0"
            :avg-monthly="monthData.runningAvgMonthly"
            :projected-annual="monthData.runningProjectedAnnual"
            :monthly-set-aside="annualData?.recommendedMonthlySetAside"
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
        <NuxtLink to="/month" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]">
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
const fmt = useFmt()
const { fieldUi } = useUiStyles()
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

async function loadEntries() {
  loadingEntries.value = true
  entries.value = await $fetch(`/api/entries?year=${now.getFullYear()}&month=${now.getMonth()}`)
  loadingEntries.value = false
}

async function loadMonthData() {
  const data = await $fetch<any>(`/api/summary/annual?year=${now.getFullYear()}&source=home`)
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
