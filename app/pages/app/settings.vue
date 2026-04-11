<template>
  <AppPageShell class="app-page app-page--settings">
    <div class="app-main-stack app-settings-intro">
      <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1">
        <div class="app-stage">
          <div class="app-stage__header">
            <p class="app-stage__eyebrow">Impostazioni</p>
            <h1 class="app-stage__title">Modello fiscale</h1>
          </div>

          <div class="app-stage__signals">
            <div class="app-stage__signal app-stage__signal--strong">
              <p class="app-stage__signal-label">Tariffa oraria</p>
              <p class="app-stage__signal-value">{{ fmt.eur(form.hourlyRate) }}</p>
              <p class="app-stage__signal-note">Base per sessioni a ore.</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Imposta sostitutiva</p>
              <p class="app-stage__signal-value">{{ fmt.num(form.irpefRate) }}%</p>
              <p class="app-stage__signal-note">5% o 15%.</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Regime INPS</p>
              <p class="app-stage__signal-value">{{ inpsTypeLabel }}</p>
              <p class="app-stage__signal-note">Percentuale o quote fisse.</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard class="fade-up fade-up-2">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs">Profilo attivo</p>
            <h2 class="font-display text-xl leading-none tracking-[-0.03em] text-[var(--text-primary)] mt-2">
              Riepilogo
            </h2>
          </div>

          <div class="ui-form-stack">
            <div v-for="row in profileRows" :key="row.label" class="ui-kv-row">
              <span class="ui-kv-row__label">{{ row.label }}</span>
              <span class="ui-kv-row__value" :class="row.class">{{ row.value }}</span>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>

    <StateBlock v-if="loading" type="loading" text="Sto caricando il modello fiscale e i costi..." />

    <template v-else>
      <AppSection title="Profilo e attivita" subtitle="Nome, attività e ATECO restano modificabili qui. L'onboarding chiede solo il minimo fiscale." :delay="2">
        <SurfaceCard>
          <div class="ui-form-stack">
            <div class="ui-form-grid-2">
              <div>
                <label class="label-xs ui-field-label">Nome in app</label>
                <UInput v-model="profileForm.displayName" placeholder="Federico" :ui="fieldUi" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Attivita</label>
                <UInput v-model="profileForm.activityLabel" placeholder="Sviluppatore freelance" :ui="fieldUi" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Codice ATECO</label>
                <UInput v-model="profileForm.atecoCode" placeholder="62.01.00" :ui="fieldUi" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Etichetta ATECO</label>
                <UInput v-model="profileForm.atecoLabel" placeholder="Produzione di software" :ui="fieldUi" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Anno fiscale</label>
                <UInput v-model="profileForm.taxYear" type="number" step="1" min="2024" max="2035" :ui="fieldUi" />
              </div>
            </div>

            <p class="app-page-copy">
              Questi dati non cambiano il calcolo base.
            </p>

            <UButton block color="primary" class="ui-action-button" :loading="profileSaving" @click="saveProfile">
              Salva profilo
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>

      <AppSection title="Piano e billing" subtitle="Stato del piano, upgrade e gestione dell’abbonamento." :delay="3">
        <SurfaceCard>
          <div class="ui-form-stack">
            <div class="ui-kv-row">
              <span class="ui-kv-row__label">Piano attivo</span>
              <span class="ui-kv-row__value text-[var(--text-primary)]">{{ planLabel }}</span>
            </div>
            <div class="ui-kv-row">
              <span class="ui-kv-row__label">Stato</span>
              <span class="ui-kv-row__value text-[var(--accent-text)]">{{ billing?.subscriptionStatus || 'INACTIVE' }}</span>
            </div>
            <p class="app-page-copy">
              Core sblocca il loop mensile completo. Planning aggiunge scenari ed export.
            </p>

            <div class="ui-form-grid-2">
              <UButton
                v-if="billing?.isPaid"
                color="neutral"
                variant="soft"
                class="ui-action-button--ghost"
                :loading="billingLoading"
                @click="openPortal"
              >
                Apri portale abbonamenti
              </UButton>
              <UButton
                v-else
                color="primary"
                class="ui-action-button"
                :loading="billingLoading"
                @click="startCheckout('CORE_CLARITY')"
              >
                Attiva Core Clarity
              </UButton>

              <UButton
                color="neutral"
                variant="soft"
                class="ui-action-button--ghost"
                :loading="billingLoading"
                @click="startCheckout('PLANNING_SCENARIOS')"
              >
                {{ billing?.planTier === 'PLANNING_SCENARIOS' ? 'Riapri checkout Planning' : 'Passa a Planning' }}
              </UButton>
            </div>
          </div>
        </SurfaceCard>
      </AppSection>

      <AppSection title="Parametri di base" subtitle="Sono i numeri usati per calcolare disponibile, accantonamento e scadenze." :delay="4">
        <SurfaceCard>
          <div class="app-settings-stack">
            <div class="ui-form-grid-2">
              <div>
                <label class="label-xs ui-field-label">Tariffa oraria (€)</label>
                <UInput v-model="form.hourlyRate" type="number" step="0.01" min="0" :ui="fieldUi" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Coefficiente di redditivita</label>
                <UInput v-model="form.coefficiente" type="number" step="0.01" min="0" max="1" :ui="fieldUi" />
                <p class="ui-field-help">Inserisci il coefficiente del tuo ATECO. Per molte attivita digitali e 0.67.</p>
              </div>

              <div>
                <label class="label-xs ui-field-label">Aliquota imposta (%)</label>
                <UInput v-model="form.irpefRate" type="number" step="0.01" min="0" max="100" :ui="fieldUi" />
                <p class="ui-field-help">Di solito e 5% o 15%.</p>
              </div>

              <div>
                <label class="label-xs ui-field-label">Commercialista annuale (€)</label>
                <UInput v-model="form.accountantAnnual" type="number" step="1" min="0" :ui="fieldUi" />
                <p class="ui-field-help">Costo annuo che vuoi distribuire nelle stime.</p>
              </div>
            </div>

            <div class="app-settings-divider">
              <div>
                <p class="label-xs">Previsioni</p>
                <p class="app-page-copy mt-3">
                  Decidi se la proiezione deve seguire la media osservata oppure una baseline piu realistica per il tuo mese tipo.
                </p>
              </div>

              <label class="label-xs ui-field-label">Modalita proiezione</label>

              <div class="ui-form-grid-2 ui-form-grid-2--compact app-settings-mb">
                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.projectionMode === 'ACTUAL_AVERAGE' }"
                  @click="form.projectionMode = 'ACTUAL_AVERAGE'"
                >
                  <span>Media osservata</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Usa gli incassi gia registrati.</span>
                </button>

                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.projectionMode === 'EXPECTED_MONTHLY_GROSS' }"
                  @click="form.projectionMode = 'EXPECTED_MONTHLY_GROSS'"
                >
                  <span>Lordo atteso</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Imposta il lordo mensile che reputi normale.</span>
                </button>

                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.projectionMode === 'EXPECTED_MONTHLY_HOURS' }"
                  @click="form.projectionMode = 'EXPECTED_MONTHLY_HOURS'"
                >
                  <span>Ore attese</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Proietta i mesi futuri da ore medie x tariffa.</span>
                </button>
              </div>

              <div class="ui-form-grid-2">
                <div>
                  <label class="label-xs ui-field-label">Mese iniziale</label>
                  <USelect
                    v-model="startMonthSelection"
                    :items="startMonthOptions"
                    :ui="selectUi"
                  />
                  <p class="ui-field-help">Serve quando vuoi iniziare da marzo anche se il primo incasso registrato arriva ad aprile.</p>
                </div>

                <div v-if="form.projectionMode === 'EXPECTED_MONTHLY_GROSS'">
                  <label class="label-xs ui-field-label">Lordo mensile atteso (€)</label>
                  <UInput v-model="form.projectionMonthlyGross" type="number" step="50" min="0" :ui="fieldUi" />
                  <p class="ui-field-help">Usalo se vuoi evitare che un bonus singolo diventi la baseline annuale.</p>
                </div>

                <div v-else-if="form.projectionMode === 'EXPECTED_MONTHLY_HOURS'">
                  <label class="label-xs ui-field-label">Ore attese al mese</label>
                  <UInput v-model="form.projectionMonthlyHours" type="number" step="1" min="0" :ui="fieldUi" />
                  <p class="ui-field-help">Per esempio 130-132 ore se quello e il tuo mese medio.</p>
                </div>
              </div>
            </div>

            <div class="app-settings-divider">
              <div>
                <p class="label-xs">Contributi</p>
                <p class="app-page-copy mt-3">
                  Scegli il regime INPS e compila solo i campi che incidono davvero sul tuo caso.
                </p>
              </div>

              <label class="label-xs ui-field-label">Tipo INPS</label>

              <div class="ui-form-grid-2 ui-form-grid-2--compact app-settings-mb">
                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.inpsType === 'GESTIONE_SEPARATA' }"
                  @click="form.inpsType = 'GESTIONE_SEPARATA'"
                >
                  <span>Gestione separata</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Contributi percentuali sul reddito imponibile.</span>
                </button>

                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.inpsType === 'ARTIGIANI' }"
                  @click="form.inpsType = 'ARTIGIANI'"
                >
                  <span>Artigiani</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Quote fisse piu eventuale eccedenza.</span>
                </button>
              </div>

              <div v-if="form.inpsType === 'GESTIONE_SEPARATA'" class="app-settings-grid-single">
                <div>
                  <label class="label-xs ui-field-label">Aliquota INPS (%)</label>
                  <UInput v-model="form.inpsRate" type="number" step="0.01" min="0" max="100" :ui="fieldUi" />
                  <p class="ui-field-help">Valore guida 26.07% per il 2025-2026.</p>
                </div>
              </div>

              <div v-else class="app-settings-grid">
                <div>
                  <label class="label-xs ui-field-label">INPS fissi annuali (€)</label>
                  <UInput v-model="form.inpsFixedAnnual" type="number" step="1" min="0" :ui="fieldUi" />
                  <p class="ui-field-help">Esempi 2026: circa 2.939€ ridotta o 4.521€ standard.</p>
                </div>

                <div>
                  <label class="label-xs ui-field-label">Soglia minimale (€)</label>
                  <UInput v-model="form.inpsMinimaleThreshold" type="number" step="1" min="0" :ui="fieldUi" />
                  <p class="ui-field-help">Valore guida 18.808€ per il 2026.</p>
                </div>

                <div>
                  <label class="label-xs ui-field-label">Aliquota eccedenza (%)</label>
                  <UInput v-model="form.inpsExcessRate" type="number" step="0.01" min="0" max="100" :ui="fieldUi" />
                  <p class="ui-field-help">Indicativamente 15.6% ridotta o 24% standard.</p>
                </div>
              </div>
            </div>

            <div class="app-settings-divider">
              <div>
                <p class="label-xs">Bollo e-fattura</p>
                <p class="app-page-copy mt-3">
                  Attivalo solo se ogni registrazione corrisponde davvero a una fattura soggetta a bollo.
                </p>
              </div>

              <div class="ui-form-grid-2 ui-form-grid-2--compact app-settings-mb">
                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.applyBollo }"
                  @click="form.applyBollo = true"
                >
                  <span>Applica bollo</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Distribuisci il costo per registrazione.</span>
                </button>

                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': !form.applyBollo }"
                  @click="form.applyBollo = false"
                >
                  <span>Ignora bollo</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Lascia il bollo fuori dalle stime.</span>
                </button>
              </div>

              <div v-if="form.applyBollo" class="app-settings-grid-single">
                <div>
                  <label class="label-xs ui-field-label">Importo bollo per registrazione (€)</label>
                  <UInput v-model="form.bolloAmount" type="number" step="0.01" min="0" :ui="fieldUi" />
                </div>
              </div>
            </div>

            <UButton block color="primary" class="ui-action-button" :loading="saving" @click="saveSettings">
              Salva e aggiorna le stime
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>

      <div class="app-main-stack">
        <AppSection title="Costi ricorrenti" subtitle="Abbonamenti e altre uscite che Chiaro distribuisce nelle stime annuali." :delay="5">
          <template #header-right>
            <button type="button" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]" @click="showRecurringForm = !showRecurringForm">
              {{ showRecurringForm ? 'Chiudi' : 'Nuovo costo' }}
            </button>
          </template>

          <SurfaceCard v-if="showRecurringForm" class="app-settings-gap-bottom">
            <div class="ui-form-stack">
              <div>
                <label class="label-xs ui-field-label">Nome costo</label>
                <UInput v-model="recurringForm.name" placeholder="Abbonamento software" :ui="fieldUi" />
              </div>

              <div class="ui-form-grid-2">
                <div>
                  <label class="label-xs ui-field-label">Importo (€)</label>
                  <UInput v-model="recurringForm.amount" type="number" step="0.01" :ui="fieldUi" />
                </div>

                <div>
                  <label class="label-xs ui-field-label">Frequenza</label>
                  <USelect
                    v-model="recurringForm.frequency"
                    :items="['MONTHLY', 'QUARTERLY', 'ANNUAL']"
                    :ui="selectUi"
                  />
                </div>
              </div>

              <UButton
                block
                color="primary"
                class="ui-action-button"
                :disabled="!recurringForm.name || !recurringForm.amount"
                @click="addRecurringPayment"
              >
                Aggiungi costo
              </UButton>
            </div>
          </SurfaceCard>

          <SurfaceCard v-if="recurringPayments.length === 0" padding="md">
            <StateBlock type="empty" text="Nessun costo ricorrente. Aggiungi abbonamenti e altre uscite ripetute." />
          </SurfaceCard>

          <SurfaceCard v-else padding="none" divided>
            <div v-for="payment in recurringPayments" :key="payment.id" class="ui-payment-row">
              <div class="flex-1">
                <p class="ui-payment-row__name">{{ payment.name }}</p>
                <p class="ui-payment-row__meta">{{ formatFrequency(payment.frequency) }} · {{ fmt.eur(payment.amount) }}</p>
              </div>
              <UButton size="sm" variant="ghost" color="red" class="ui-action-button--ghost" @click="deleteRecurringPayment(payment.id)">
                <UIcon name="lucide:trash-2" class="w-4 h-4" />
              </UButton>
            </div>
          </SurfaceCard>
        </AppSection>

        <AppSection :title="`Uscite una tantum (${currentYear})`" subtitle="Spese eccezionali che pesano solo sull'anno selezionato." :delay="6">
          <template #header-right>
            <button type="button" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]" @click="showOnetimeForm = !showOnetimeForm">
              {{ showOnetimeForm ? 'Chiudi' : 'Nuova uscita' }}
            </button>
          </template>

          <SurfaceCard v-if="showOnetimeForm" class="app-settings-gap-bottom">
            <div class="ui-form-stack">
              <div>
                <label class="label-xs ui-field-label">Nome uscita</label>
                <UInput v-model="onetimeForm.name" placeholder="Acquisto attrezzatura" :ui="fieldUi" />
              </div>

              <div class="app-settings-grid">
                <div>
                  <label class="label-xs ui-field-label">Importo (€)</label>
                  <UInput v-model="onetimeForm.amount" type="number" step="0.01" :ui="fieldUi" />
                </div>

                <div>
                  <label class="label-xs ui-field-label">Data</label>
                  <AppDateField v-model="onetimeForm.date" />
                </div>
              </div>

              <UButton
                block
                color="primary"
                class="ui-action-button"
                :disabled="!onetimeForm.name || !onetimeForm.amount || !onetimeForm.date"
                @click="addOnetimePayment"
              >
                Aggiungi uscita
              </UButton>
            </div>
          </SurfaceCard>

          <SurfaceCard v-if="onetimePayments.length === 0" padding="md">
            <StateBlock type="empty" text="Nessuna uscita una tantum registrata per questo anno." />
          </SurfaceCard>

          <SurfaceCard v-else padding="none" divided>
            <div v-for="payment in onetimePayments" :key="payment.id" class="ui-payment-row">
              <div class="flex-1">
                <p class="ui-payment-row__name">{{ payment.name }}</p>
                <p class="ui-payment-row__meta">{{ fmt.date(payment.date) }} · {{ fmt.eur(payment.amount) }}</p>
              </div>
              <UButton size="sm" variant="ghost" color="red" class="ui-action-button--ghost" @click="deleteOnetimePayment(payment.id)">
                <UIcon name="lucide:trash-2" class="w-4 h-4" />
              </UButton>
            </div>
          </SurfaceCard>
        </AppSection>
      </div>
    </template>
  </AppPageShell>
</template>

<script setup lang="ts">
definePageMeta({
  alias: ['/app/settings'],
})

const fmt = useFmt()
const { fieldUi, selectUi } = useUiStyles()
const toast = useToast()
const { currentUser, refresh } = useCurrentUser()
const { startCheckout, openPortal, loading: billingLoading } = useBilling()

const saving = ref(false)
const profileSaving = ref(false)
const showRecurringForm = ref(false)
const showOnetimeForm = ref(false)
const currentYear = new Date().getFullYear()
const billing = computed(() => currentUser.value?.billing ?? null)
const startMonthOptions = ['Automatico', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const startMonthSelection = ref('Automatico')
const profileForm = reactive({
  displayName: '',
  activityLabel: '',
  atecoCode: '',
  atecoLabel: '',
  taxYear: currentYear,
})

const form = reactive({
  hourlyRate: 30,
  coefficiente: 0.67,
  irpefRate: 15,
  inpsType: 'GESTIONE_SEPARATA',
  inpsRate: 26.07,
  inpsFixedAnnual: 0,
  inpsMinimaleThreshold: 18808,
  inpsExcessRate: 15.6,
  accountantAnnual: 300,
  projectionMode: 'ACTUAL_AVERAGE' as 'ACTUAL_AVERAGE' | 'EXPECTED_MONTHLY_GROSS' | 'EXPECTED_MONTHLY_HOURS',
  projectionMonthlyHours: '',
  projectionMonthlyGross: '',
  applyBollo: false,
  bolloAmount: 2,
})

const recurringForm = reactive({
  name: '',
  amount: '',
  frequency: 'MONTHLY',
})

const onetimeForm = reactive({
  name: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
})

const inpsTypeLabel = computed(() =>
  form.inpsType === 'GESTIONE_SEPARATA' ? 'Gestione separata' : 'Artigiani'
)

const planLabel = computed(() => {
  if (!billing.value) return 'Free'
  if (billing.value.planTier === 'PLANNING_SCENARIOS') return 'Planning & Scenarios'
  if (billing.value.planTier === 'CORE_CLARITY') return 'Core Clarity'
  return 'Free'
})

const profileRows = computed(() => [
  {
    label: 'Profilo',
    value: currentUser.value?.displayName || currentUser.value?.name || 'Profilo personale',
    class: 'text-[var(--text-primary)]',
  },
  {
    label: 'Attivita',
    value: currentUser.value?.activityLabel || 'Freelance in forfettario',
    class: 'text-[var(--info)]',
  },
  {
    label: 'ATECO',
    value: currentUser.value?.atecoCode || 'Non impostato',
    class: 'text-[var(--text-primary)]',
  },
  {
    label: 'Anno di riferimento',
    value: String(currentUser.value?.taxYear || currentYear),
    class: 'text-[var(--text-primary)]',
  },
  {
    label: 'Costi attivi',
    value: `${recurringPayments.value.length} ricorrenti · ${onetimePayments.value.length} una tantum`,
    class: 'text-[var(--accent-text)]',
  },
])

function formatFrequency(frequency: string) {
  if (frequency === 'MONTHLY') return 'Mensile'
  if (frequency === 'QUARTERLY') return 'Trimestrale'
  if (frequency === 'ANNUAL') return 'Annuale'
  return frequency
}

function monthIndexToOption(monthIndex: number | null | undefined) {
  if (monthIndex === null || monthIndex === undefined) return 'Automatico'
  return startMonthOptions[monthIndex + 1] || 'Automatico'
}

function optionToMonthIndex(option: string) {
  const index = startMonthOptions.indexOf(option)
  return index <= 0 ? null : index - 1
}

const { data: settingsPageData, status, refresh: refreshSettingsPage } = await useAsyncData(
  'settings-page-data',
  async () => {
    const [settings, recurringPayments, onetimePayments] = await Promise.all([
      $fetch<any>('/api/settings'),
      $fetch<any[]>('/api/payments/recurring'),
      $fetch<any[]>(`/api/payments/onetime?year=${currentYear}`),
    ])

    return { settings, recurringPayments, onetimePayments }
  },
  {
    default: () => null,
    dedupe: 'defer',
  },
)

const loading = computed(() => status.value === 'pending' && !settingsPageData.value)
const recurringPayments = computed(() => settingsPageData.value?.recurringPayments ?? [])
const onetimePayments = computed(() => settingsPageData.value?.onetimePayments ?? [])

watch(
  () => currentUser.value,
  () => {
    Object.assign(profileForm, {
      displayName: currentUser.value?.displayName || currentUser.value?.name || '',
      activityLabel: currentUser.value?.activityLabel || '',
      atecoCode: currentUser.value?.atecoCode || '',
      atecoLabel: currentUser.value?.atecoLabel || '',
      taxYear: currentUser.value?.taxYear || currentYear,
    })
  },
  { immediate: true },
)

watch(
  settingsPageData,
  (payload) => {
    const settings = payload?.settings
    if (!settings)
      return

    Object.assign(form, {
      hourlyRate: settings.hourlyRate,
      coefficiente: settings.coefficiente,
      irpefRate: settings.irpefRate * 100,
      inpsType: settings.inpsType,
      inpsRate: settings.inpsRate * 100,
      inpsFixedAnnual: settings.inpsFixedAnnual,
      inpsMinimaleThreshold: settings.inpsMinimaleThreshold,
      inpsExcessRate: settings.inpsExcessRate * 100,
      accountantAnnual: settings.accountantAnnual,
      projectionMode: settings.projectionMode,
      projectionMonthlyHours: settings.projectionMonthlyHours ?? '',
      projectionMonthlyGross: settings.projectionMonthlyGross ?? '',
      applyBollo: settings.applyBollo,
      bolloAmount: settings.bolloAmount,
    })
    startMonthSelection.value = monthIndexToOption(settings.projectionStartMonth)
  },
  { immediate: true },
)

async function refreshFinancialViews() {
  await refreshNuxtData(['tax-settings', 'home-dashboard', 'month-page-data', 'annual-summary-page'])
}

async function reloadSettingsPage() {
  await Promise.all([
    refreshSettingsPage(),
    refreshFinancialViews(),
  ])
}

async function saveProfile() {
  profileSaving.value = true
  try {
    await $fetch('/api/onboarding', {
      method: 'POST',
      body: {
        profileOnly: true,
        markOnboardingCompleted: false,
        displayName: profileForm.displayName,
        activityLabel: profileForm.activityLabel,
        atecoCode: profileForm.atecoCode,
        atecoLabel: profileForm.atecoLabel,
        taxYear: Number(profileForm.taxYear),
      },
    })

    toast.add({ title: 'Profilo aggiornato.', color: 'success' })
    await Promise.all([
      refresh(true),
      refreshSettingsPage(),
    ])
  } catch {
    toast.add({ title: 'Non sono riuscito a salvare il profilo. Riprova.', color: 'error' })
  } finally {
    profileSaving.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: {
        hourlyRate: parseFloat(form.hourlyRate as any),
        coefficiente: parseFloat(form.coefficiente as any),
        irpefRate: parseFloat(form.irpefRate as any) / 100,
        inpsType: form.inpsType,
        inpsRate: parseFloat(form.inpsRate as any) / 100,
        inpsFixedAnnual: parseFloat(form.inpsFixedAnnual as any),
        inpsMinimaleThreshold: parseFloat(form.inpsMinimaleThreshold as any),
        inpsExcessRate: parseFloat(form.inpsExcessRate as any) / 100,
        accountantAnnual: parseFloat(form.accountantAnnual as any),
        projectionStartMonth: optionToMonthIndex(startMonthSelection.value),
        projectionMode: form.projectionMode,
        projectionMonthlyHours: form.projectionMode === 'EXPECTED_MONTHLY_HOURS'
          ? (form.projectionMonthlyHours || null)
          : null,
        projectionMonthlyGross: form.projectionMode === 'EXPECTED_MONTHLY_GROSS'
          ? (form.projectionMonthlyGross || null)
          : null,
        applyBollo: form.applyBollo,
        bolloAmount: parseFloat(form.bolloAmount as any),
      },
    })
    toast.add({ title: 'Modello salvato. Le nuove stime sono gia aggiornate.', color: 'success' })
    await reloadSettingsPage()
  } catch {
    toast.add({ title: 'Non sono riuscito a salvare il modello. Riprova.', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function addRecurringPayment() {
  await $fetch('/api/payments/recurring', {
    method: 'POST',
    body: recurringForm,
  })
  recurringForm.name = ''
  recurringForm.amount = ''
  recurringForm.frequency = 'MONTHLY'
  showRecurringForm.value = false
  await reloadSettingsPage()
}

async function deleteRecurringPayment(id: number) {
  await $fetch(`/api/payments/recurring?id=${id}`, { method: 'DELETE' })
  await reloadSettingsPage()
}

async function addOnetimePayment() {
  await $fetch('/api/payments/onetime', {
    method: 'POST',
    body: onetimeForm,
  })
  onetimeForm.name = ''
  onetimeForm.amount = ''
  onetimeForm.date = new Date().toISOString().split('T')[0]
  showOnetimeForm.value = false
  await reloadSettingsPage()
}

async function deleteOnetimePayment(id: number) {
  await $fetch(`/api/payments/onetime?id=${id}`, { method: 'DELETE' })
  await reloadSettingsPage()
}
</script>
