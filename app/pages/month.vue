<template>
  <AppPageShell class="app-page app-page--month">
    <StateBlock v-if="loading" type="loading" text="Sto preparando i numeri del mese..." />

    <template v-else-if="summary">
      <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1">
        <div class="ui-form-stack">
          <div class="app-period-nav">
            <button class="app-period-nav__btn" @click="prevMonth">
              <UIcon name="lucide:chevron-left" class="w-5 h-5" />
            </button>

            <h1 class="app-period-nav__title capitalize">{{ monthLabel }}</h1>

            <button class="app-period-nav__btn" :disabled="isCurrentMonth" @click="nextMonth">
              <UIcon name="lucide:chevron-right" class="w-5 h-5" />
            </button>
          </div>

          <div class="app-stage">
            <div class="app-stage__header">
              <p class="app-stage__eyebrow">Mese selezionato</p>
              <p class="app-stage__metric-label">Quanto puoi usare nel mese</p>
              <p class="app-stage__metric">{{ fmt.eur(summary.net) }}</p>
              <p class="app-stage__summary">
                Incassato {{ fmt.eur(summary.gross) }} · da accantonare {{ fmt.eur(summary.provision) }}
              </p>
              <p class="app-stage__lead">
                Il mese deve leggersi come un conto chiaro: prima il numero spendibile, poi il
                perche, poi le righe che lo compongono.
              </p>
            </div>

            <div class="app-stage__signals">
              <div class="app-stage__signal app-stage__signal--strong">
                <p class="app-stage__signal-label">Da accantonare</p>
                <p class="app-stage__signal-value">{{ fmt.eur(summary.provision) }}</p>
                <p class="app-stage__signal-note">La quota che non dovrebbe restare nei soldi liberi del mese.</p>
              </div>

              <div class="app-stage__signal">
                <p class="app-stage__signal-label">Registrazioni</p>
                <p class="app-stage__signal-value">{{ summary.entryCount }}</p>
                <p class="app-stage__signal-note">{{ fmt.hours(summary.totalHours) }} di lavoro gia registrato nel mese.</p>
              </div>

              <div class="app-stage__signal">
                <p class="app-stage__signal-label">Stima fine anno</p>
                <p class="app-stage__signal-value">{{ fmt.eur(summary.runningProjectedAnnual) }}</p>
                <p class="app-stage__signal-note">Se il ritmo resta cosi, qui potrebbe chiudersi l’anno.</p>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div class="app-decision-grid fade-up fade-up-2">
        <DecisionMetric
          label="Disponibile del mese"
          :value="fmt.eur(summary.net)"
          note="Il numero guida del mese, gia ripulito da accantonamenti e costi distribuiti."
          tone="accent"
          compact
        />
        <DecisionMetric
          label="Incassato del mese"
          :value="fmt.eur(summary.gross)"
          note="Somma di sessioni orarie e fee progetto registrate in questo mese."
          tone="default"
          compact
        />
        <DecisionMetric
          label="Da accantonare"
          :value="fmt.eur(summary.provision)"
          note="Quota stimata che Chiaro tiene separata dai soldi realmente spendibili."
          tone="danger"
          compact
        />
      </div>

      <div class="app-main-stack">
        <SurfaceCard class="fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Ledger del mese</p>
              <h2 class="font-display text-2xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                Da dove arriva il lordo.
              </h2>
            </div>

            <div class="ui-form-stack">
              <BreakdownRow
                v-for="row in mixRows"
                :key="row.label"
                :label="row.label"
                :value="row.value"
                :tone="row.tone"
                :detail="row.detail"
              />
            </div>
          </div>
        </SurfaceCard>

        <ExplanationPanel
          v-if="explanationItems.length"
          title="Come si forma l'accantonamento del mese"
          subtitle="La quota del mese non e una penalita astratta: e il modo con cui Chiaro anticipa il peso fiscale e operativo dell’anno."
          :items="explanationItems"
        />

        <IncomeProjectionCard
          v-if="summary.runningAvgMonthly > 0"
          :avg-monthly="summary.runningAvgMonthly"
          :projected-annual="summary.runningProjectedAnnual"
          class="fade-up fade-up-3"
        />
      </div>

      <AppSection title="Cosa compone l'accantonamento" subtitle="La quota del mese divisa tra imposta, INPS e costi distribuiti." :delay="3">
        <SurfaceCard padding="none" divided>
          <BreakdownRow
            v-for="row in taxRows"
            :key="row.label"
            :label="row.label"
            :value="row.value"
            :tone="row.tone"
            :detail="row.detail"
          />
        </SurfaceCard>
      </AppSection>

      <AppSection title="Registrazioni del mese" subtitle="Apri una registrazione per correggere data, importo o nota, anche nei mesi passati." :delay="4">
        <SurfaceCard v-if="entries.length === 0" padding="md">
          <StateBlock type="empty" text="Nessuna registrazione in questo mese. Torna in Home e registra il primo incasso." />
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
    </template>

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
      description="La registrazione verra rimossa da questo mese e il riepilogo si aggiornera."
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
const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const loading = ref(true)
const entries = ref<any[]>([])
const annualData = ref<any>(null)
const settings = ref<any>(null)
const selectedEntry = ref<any | null>(null)
const detailsOpen = ref(false)
const savingEntry = ref(false)
const deleteConfirmOpen = ref(false)
const deleting = ref(false)
const pendingDeleteId = ref<number | null>(null)

const summary = computed(() => annualData.value?.months[viewMonth.value])

const isCurrentMonth = computed(() =>
  viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth()
)

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1)
    .toLocaleString('it-IT', { month: 'long', year: 'numeric' })
)

const activeMonths = computed(() => annualData.value?.activeMonths ?? 12)

const averageEntryGross = computed(() => {
  if (!summary.value?.entryCount) return 0
  return summary.value.gross / summary.value.entryCount
})

const mixRows = computed(() => {
  if (!summary.value) return []

  return [
    {
      label: 'Attivita a ore',
      value: fmt.eur(summary.value.hourlyGross),
      tone: 'default' as const,
      detail: 'Sessioni, consulenze e lavoro a ore registrato nel mese.',
    },
    {
      label: 'Progetti',
      value: fmt.eur(summary.value.projectGross),
      tone: 'info' as const,
      detail: 'Fee progetto, milestone e importi concordati.',
    },
    {
      label: 'Media per registrazione',
      value: fmt.eur(averageEntryGross.value),
      tone: 'accent' as const,
      detail: 'Aiuta a capire se il mese e trainato da poche voci o da un flusso piu costante.',
    },
  ]
})

const taxRows = computed(() => {
  if (!summary.value?.projectedTaxes) return []
  const t = summary.value.projectedTaxes
  const n = activeMonths.value
  const rows: { label: string; value: string; tone: 'default' | 'accent' | 'danger' | 'info'; detail?: string }[] = [
    {
      label: 'Imposta sostitutiva',
      value: `−${fmt.eur(t.irpef / n)}`,
      tone: 'danger',
      detail: 'Ripartita sui mesi attivi per trasformare un saldo futuro in un’abitudine mensile.',
    },
  ]

  if (t.inpsExcess > 0) {
    rows.push(
      { label: 'INPS fissi', value: `−${fmt.eur(t.inpsFixed / n)}`, tone: 'danger', detail: 'Quota fissa ripartita sul mese selezionato.' },
      { label: 'INPS eccedenza', value: `−${fmt.eur(t.inpsExcess / n)}`, tone: 'danger', detail: 'Contributi aggiuntivi oltre la soglia minimale.' },
    )
  } else {
    rows.push({
      label: 'INPS totale',
      value: `−${fmt.eur(t.inps / n)}`,
      tone: 'danger',
      detail: 'Stimato in percentuale sul reddito imponibile.',
    })
  }

  rows.push(
    { label: 'Commercialista', value: `−${fmt.eur(t.accountant / n)}`, tone: 'danger', detail: 'Distribuito sui mesi attivi per non alterare il netto in un solo momento.' },
    { label: 'Disponibile del mese', value: fmt.eur(summary.value.net), tone: 'accent', detail: 'Il netto operativo dopo il carico del mese.' },
  )

  return rows
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

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }

  load()
}

function nextMonth() {
  if (isCurrentMonth.value) return

  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }

  load()
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
  await load()
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
    await load()
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

async function load() {
  loading.value = true
  const [e, a, s] = await Promise.all([
    $fetch<any[]>(`/api/entries?year=${viewYear.value}&month=${viewMonth.value}`),
    $fetch<any>(`/api/summary/annual?year=${viewYear.value}&source=month`),
    $fetch<any>('/api/settings'),
  ])
  entries.value = e
  annualData.value = a
  settings.value = s
  loading.value = false
}

onMounted(load)
</script>
