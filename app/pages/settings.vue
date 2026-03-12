<template>
  <AppPageShell class="app-page app-page--settings">
    <div class="app-main-stack app-settings-intro">
      <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1">
        <div class="app-stage">
          <div class="app-stage__header">
            <p class="app-stage__eyebrow">Modello fiscale</p>
            <h1 class="app-stage__title">Questi numeri guidano tutte le stime.</h1>
            <p class="app-stage__lead">
              Tariffa, coefficiente, imposta e contributi cambiano disponibile, accantonamento e
              scadenze in ogni schermata.
            </p>
          </div>

          <div class="app-stage__signals">
            <div class="app-stage__signal app-stage__signal--strong">
              <p class="app-stage__signal-label">Tariffa oraria</p>
              <p class="app-stage__signal-value">{{ fmt.eur(form.hourlyRate) }}</p>
              <p class="app-stage__signal-note">Base per calcolare sessioni, call e giornate a ore.</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Imposta sostitutiva</p>
              <p class="app-stage__signal-value">{{ fmt.num(form.irpefRate) }}%</p>
              <p class="app-stage__signal-note">Di solito 5% o 15%, in base al tuo regime.</p>
            </div>

            <div class="app-stage__signal">
              <p class="app-stage__signal-label">Regime INPS</p>
              <p class="app-stage__signal-value">{{ inpsTypeLabel }}</p>
              <p class="app-stage__signal-note">Decide se il carico e solo percentuale o include anche quote fisse.</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard class="fade-up fade-up-2">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs">Profilo attivo</p>
            <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
              Il profilo usato nei calcoli.
            </h2>
            <p class="app-page-copy mt-3">
              Anno di riferimento e quante uscite entrano nelle stime.
            </p>
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
      <AppSection title="Parametri di base" subtitle="Sono i numeri usati per calcolare disponibile, accantonamento e scadenze." :delay="2">
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

            <UButton block color="primary" class="ui-action-button" :loading="saving" @click="saveSettings">
              Salva e aggiorna le stime
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>

      <div class="app-main-stack">
        <AppSection title="Costi ricorrenti" subtitle="Abbonamenti e altre uscite che Chiaro distribuisce nelle stime annuali." :delay="3">
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

        <AppSection :title="`Uscite una tantum (${currentYear})`" subtitle="Spese eccezionali che pesano solo sull'anno selezionato." :delay="4">
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
const fmt = useFmt()
const { fieldUi, selectUi } = useUiStyles()
const toast = useToast()
const { currentUser, refresh } = useCurrentUser()

const loading = ref(true)
const saving = ref(false)
const settings = ref<any>(null)
const recurringPayments = ref<any[]>([])
const onetimePayments = ref<any[]>([])
const showRecurringForm = ref(false)
const showOnetimeForm = ref(false)
const currentYear = new Date().getFullYear()

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

async function loadData() {
  loading.value = true
  await refresh(true)
  const [s, r, o] = await Promise.all([
    $fetch('/api/settings'),
    $fetch('/api/payments/recurring'),
    $fetch(`/api/payments/onetime?year=${currentYear}`),
  ])

  settings.value = s
  Object.assign(form, {
    hourlyRate: s.hourlyRate,
    coefficiente: s.coefficiente,
    irpefRate: s.irpefRate * 100,
    inpsType: s.inpsType,
    inpsRate: s.inpsRate * 100,
    inpsFixedAnnual: s.inpsFixedAnnual,
    inpsMinimaleThreshold: s.inpsMinimaleThreshold,
    inpsExcessRate: s.inpsExcessRate * 100,
    accountantAnnual: s.accountantAnnual,
  })

  recurringPayments.value = r
  onetimePayments.value = o
  loading.value = false
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
      },
    })
    toast.add({ title: 'Modello salvato. Le nuove stime sono gia aggiornate.', color: 'success' })
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
  await loadData()
}

async function deleteRecurringPayment(id: number) {
  await $fetch(`/api/payments/recurring?id=${id}`, { method: 'DELETE' })
  await loadData()
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
  await loadData()
}

async function deleteOnetimePayment(id: number) {
  await $fetch(`/api/payments/onetime?id=${id}`, { method: 'DELETE' })
  await loadData()
}

onMounted(loadData)
</script>
