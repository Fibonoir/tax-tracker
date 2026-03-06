<template>
  <AppPageShell>
    <div class="app-grid-2 items-start">
      <SurfaceCard variant="gradient" padding="lg" class="fade-up fade-up-1">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs text-white-muted">Configurazione</p>
            <h1 class="font-display text-[clamp(2.35rem,5vw,4rem)] leading-[0.92] tracking-[-0.06em] text-white mt-3">
              Imposta il modello fiscale una volta, usa il prodotto ogni giorno.
            </h1>
            <p class="text-sm leading-7 text-white-soft app-measure mt-4">
              Tariffe, coefficienti, INPS e costi ricorrenti sono qui per alimentare le stime su
              tutta l'app senza rincorrere formule esterne.
            </p>
          </div>

          <div class="app-home-hero__stats">
            <div class="app-home-hero__chip">
              <p class="label-xs text-white-muted">Tariffa oraria</p>
              <p class="font-display text-2xl font-bold text-white mt-2">{{ fmt.eur(form.hourlyRate) }}</p>
            </div>

            <div class="app-home-hero__chip app-home-hero__chip--soft">
              <p class="label-xs text-white-muted">Aliquota imposta</p>
              <p class="font-display text-2xl font-bold text-white mt-2">{{ fmt.num(form.irpefRate) }}%</p>
            </div>

            <div class="app-home-hero__chip app-home-hero__chip--soft">
              <p class="label-xs text-white-muted">INPS</p>
              <p class="font-display text-xl font-bold text-white mt-2">{{ inpsTypeLabel }}</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard class="fade-up fade-up-2">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs">Account</p>
            <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-revolut-text light:text-revolut-light-text mt-3">
              Area personale e presidio operativo.
            </h2>
          </div>

          <div class="app-settings-account">
            <div>
              <p class="text-base font-semibold text-revolut-text light:text-revolut-light-text">{{ session?.user?.email }}</p>
              <p class="text-sm text-revolut-muted mt-2">{{ session?.user?.name || 'Utente autorizzato' }}</p>
            </div>

            <UButton variant="soft" color="neutral" class="ui-action-button--ghost" @click="logout">
              Esci
            </UButton>
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

    <StateBlock v-if="loading" type="loading" text="Sto caricando impostazioni e pagamenti..." />

    <template v-else>
      <AppSection title="Modello fiscale" subtitle="Parametri che alimentano le stime del dashboard, del mese e dell'anno." :delay="2">
        <SurfaceCard>
          <div class="app-settings-stack">
            <div class="ui-form-grid-2">
              <div>
                <label class="label-xs ui-field-label">Tariffa oraria (€)</label>
                <UInput v-model="form.hourlyRate" type="number" step="0.01" min="0" :ui="fieldUi" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Coefficiente di redditività</label>
                <UInput v-model="form.coefficiente" type="number" step="0.01" min="0" max="1" :ui="fieldUi" />
                <p class="ui-field-help">0.67 per ATECO 62 in regime forfettario.</p>
              </div>

              <div>
                <label class="label-xs ui-field-label">Aliquota imposta (%)</label>
                <UInput v-model="form.irpefRate" type="number" step="0.01" min="0" max="100" :ui="fieldUi" />
                <p class="ui-field-help">Di solito 5% o 15% a seconda del regime applicato.</p>
              </div>

              <div>
                <label class="label-xs ui-field-label">Commercialista annuale (€)</label>
                <UInput v-model="form.accountantAnnual" type="number" step="1" min="0" :ui="fieldUi" />
              </div>
            </div>

            <div class="app-settings-divider">
              <label class="label-xs ui-field-label">Tipo INPS</label>

              <div class="ui-form-grid-2 ui-form-grid-2--compact app-settings-mb">
                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.inpsType === 'GESTIONE_SEPARATA' }"
                  @click="form.inpsType = 'GESTIONE_SEPARATA'"
                >
                  <span>Gestione separata</span>
                  <span class="text-xs leading-6 text-revolut-muted light:text-revolut-light-muted">Contributi percentuali sul reddito imponibile.</span>
                </button>

                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.inpsType === 'ARTIGIANI' }"
                  @click="form.inpsType = 'ARTIGIANI'"
                >
                  <span>Artigiani</span>
                  <span class="text-xs leading-6 text-revolut-muted light:text-revolut-light-muted">Contributi fissi più eventuale eccedenza.</span>
                </button>
              </div>

              <div v-if="form.inpsType === 'GESTIONE_SEPARATA'" class="app-settings-grid-single">
                <div>
                  <label class="label-xs ui-field-label">Aliquota INPS (%)</label>
                  <UInput v-model="form.inpsRate" type="number" step="0.01" min="0" max="100" :ui="fieldUi" />
                  <p class="ui-field-help">Valore di riferimento 26.07% per il biennio 2025-2026.</p>
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
              Salva configurazione
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>

      <div class="app-grid-2">
        <AppSection title="Pagamenti ricorrenti" subtitle="Spese distribuite automaticamente nelle stime annuali." :delay="3">
          <template #header-right>
            <button type="button" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]" @click="showRecurringForm = !showRecurringForm">
              {{ showRecurringForm ? 'Chiudi' : 'Nuovo' }}
            </button>
          </template>

          <SurfaceCard v-if="showRecurringForm" class="app-settings-gap-bottom">
            <div class="ui-form-stack">
              <div>
                <label class="label-xs ui-field-label">Nome</label>
                <UInput v-model="recurringForm.name" placeholder="Abbonamento SaaS" :ui="fieldUi" />
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
                Aggiungi pagamento ricorrente
              </UButton>
            </div>
          </SurfaceCard>

          <SurfaceCard v-if="recurringPayments.length === 0" padding="md">
            <StateBlock type="empty" text="Nessun pagamento ricorrente. Aggiungi qui software, tools o costi fissi annuali." />
          </SurfaceCard>

          <SurfaceCard v-else padding="none" divided>
            <div v-for="payment in recurringPayments" :key="payment.id" class="ui-payment-row">
              <div class="flex-1">
                <p class="ui-payment-row__name">{{ payment.name }}</p>
                <p class="ui-payment-row__meta">{{ payment.frequency }} · {{ fmt.eur(payment.amount) }}</p>
              </div>
              <UButton size="sm" variant="ghost" color="red" class="ui-action-button--ghost" @click="deleteRecurringPayment(payment.id)">
                <UIcon name="lucide:trash-2" class="w-4 h-4" />
              </UButton>
            </div>
          </SurfaceCard>
        </AppSection>

        <AppSection :title="`Pagamenti una tantum (${currentYear})`" subtitle="Uscite straordinarie considerate solo nell'anno selezionato." :delay="4">
          <template #header-right>
            <button type="button" class="app-toolbar-button font-mono text-xs uppercase tracking-[0.18em]" @click="showOnetimeForm = !showOnetimeForm">
              {{ showOnetimeForm ? 'Chiudi' : 'Nuovo' }}
            </button>
          </template>

          <SurfaceCard v-if="showOnetimeForm" class="app-settings-gap-bottom">
            <div class="ui-form-stack">
              <div>
                <label class="label-xs ui-field-label">Nome</label>
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
                Aggiungi pagamento
              </UButton>
            </div>
          </SurfaceCard>

          <SurfaceCard v-if="onetimePayments.length === 0" padding="md">
            <StateBlock type="empty" text="Nessun pagamento una tantum registrato per quest'anno." />
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
const { session } = useUserSession()
const toast = useToast()

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
    label: 'Costo commercialista',
    value: fmt.eur(form.accountantAnnual),
    class: 'text-revolut-text light:text-revolut-light-text',
  },
  {
    label: 'Pagamenti ricorrenti',
    value: String(recurringPayments.value.length),
    class: 'text-revolut-blue',
  },
  {
    label: 'Uscite one-shot',
    value: String(onetimePayments.value.length),
    class: 'text-revolut-green',
  },
])

async function loadData() {
  loading.value = true
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
    toast.add({ title: 'Impostazioni salvate', color: 'success' })
  } catch {
    toast.add({ title: 'Errore nel salvataggio', color: 'error' })
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

async function logout() {
  await $fetch('/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

onMounted(loadData)
</script>
