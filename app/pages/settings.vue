<template>
  <AppPageShell>
    <div class="fade-up">
      <h1 class="font-display text-2xl font-bold text-revolut-text light:text-revolut-light-text mb-1">Impostazioni</h1>
      <p class="text-sm text-revolut-muted">Gestisci la configurazione fiscale e i pagamenti</p>
    </div>

    <StateBlock v-if="loading" type="loading" />

    <template v-else>
      <AppSection title="Account" :delay="1">
        <SurfaceCard>
          <div class="app-settings-account">
            <div>
              <p class="text-sm font-medium text-revolut-text light:text-revolut-light-text">{{ session?.user?.email }}</p>
              <p class="text-xs text-revolut-muted mt-1">{{ session?.user?.name }}</p>
            </div>
            <UButton variant="outline" size="sm" @click="logout">
              Esci
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>

      <AppSection title="Configurazione fiscale" :delay="2">
        <SurfaceCard>
          <div class="app-settings-stack">
            <div class="ui-form-grid-2">
              <div>
                <label class="label-xs ui-field-label">Tariffa oraria (€)</label>
                <UInput v-model="form.hourlyRate" type="number" step="0.01" min="0" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Coefficiente di Redditività</label>
                <UInput v-model="form.coefficiente" type="number" step="0.01" min="0" max="1" />
                <p class="ui-field-help">0.67 for ATECO 62 (IT)</p>
              </div>

              <div>
                <label class="label-xs ui-field-label">Aliquota IRPEF (%)</label>
                <UInput v-model="form.irpefRate" type="number" step="0.01" min="0" max="100" />
                <p class="ui-field-help">5% or 15%</p>
              </div>

              <div>
                <label class="label-xs ui-field-label">Commercialista annuale (€)</label>
                <UInput v-model="form.accountantAnnual" type="number" step="1" min="0" />
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
                  Gestione Separata
                </button>
                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.inpsType === 'ARTIGIANI' }"
                  @click="form.inpsType = 'ARTIGIANI'"
                >
                  Artigiani
                </button>
              </div>

              <div v-if="form.inpsType === 'GESTIONE_SEPARATA'" class="app-settings-grid-single">
                <div>
                  <label class="label-xs ui-field-label">Aliquota INPS (%)</label>
                  <UInput v-model="form.inpsRate" type="number" step="0.01" min="0" max="100" />
                  <p class="ui-field-help">26.07% for 2025-2026</p>
                </div>
              </div>

              <div v-else class="app-settings-grid">
                <div>
                  <label class="label-xs ui-field-label">INPS fissi annuali (€)</label>
                  <UInput v-model="form.inpsFixedAnnual" type="number" step="1" min="0" />
                  <p class="ui-field-help">~2,939€ ridotta / ~4,521€ standard (artigiani 2026)</p>
                </div>

                <div>
                  <label class="label-xs ui-field-label">Soglia minimale (€)</label>
                  <UInput v-model="form.inpsMinimaleThreshold" type="number" step="1" min="0" />
                  <p class="ui-field-help">18,808€ for 2026</p>
                </div>

                <div>
                  <label class="label-xs ui-field-label">Aliquota eccedenza (%)</label>
                  <UInput v-model="form.inpsExcessRate" type="number" step="0.01" min="0" max="100" />
                  <p class="ui-field-help">15.6% ridotta / 24% standard (artigiani)</p>
                </div>
              </div>
            </div>

            <UButton block class="mt-2" :loading="saving" @click="saveSettings">
              Salva configurazione
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>

      <AppSection :delay="3">
        <SectionHeader title="Pagamenti ricorrenti">
          <template #right>
            <UButton size="xs" variant="ghost" @click="showRecurringForm = !showRecurringForm">
              <UIcon :name="showRecurringForm ? 'lucide:x' : 'lucide:plus'" class="w-4 h-4" />
            </UButton>
          </template>
        </SectionHeader>

        <SurfaceCard v-if="showRecurringForm" class="app-settings-gap-bottom">
          <div class="ui-form-stack">
            <div>
              <label class="label-xs ui-field-label">Nome</label>
              <UInput v-model="recurringForm.name" placeholder="Abbonamento SaaS" />
            </div>

            <div class="ui-form-grid-2">
              <div>
                <label class="label-xs ui-field-label">Importo (€)</label>
                <UInput v-model="recurringForm.amount" type="number" step="0.01" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Frequenza</label>
                <USelect
                  v-model="recurringForm.frequency"
                  :options="['MONTHLY', 'QUARTERLY', 'ANNUAL']"
                />
              </div>
            </div>

            <UButton
              block
              size="sm"
              :disabled="!recurringForm.name || !recurringForm.amount"
              @click="addRecurringPayment"
            >
              Aggiungi pagamento ricorrente
            </UButton>
          </div>
        </SurfaceCard>

        <SurfaceCard v-if="recurringPayments.length === 0" padding="md">
          <StateBlock type="empty" text="Nessun pagamento ricorrente" />
        </SurfaceCard>

        <SurfaceCard v-else padding="none" divided>
          <div v-for="payment in recurringPayments" :key="payment.id" class="ui-payment-row">
            <div class="flex-1">
              <p class="ui-payment-row__name">{{ payment.name }}</p>
              <p class="ui-payment-row__meta">{{ payment.frequency }} · {{ fmt.eur(payment.amount) }}</p>
            </div>
            <UButton size="xs" variant="ghost" color="red" @click="deleteRecurringPayment(payment.id)">
              <UIcon name="lucide:trash-2" class="w-4 h-4" />
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>

      <AppSection :delay="4">
        <SectionHeader :title="`Pagamenti una tantum (${new Date().getFullYear()})`">
          <template #right>
            <UButton size="xs" variant="ghost" @click="showOnetimeForm = !showOnetimeForm">
              <UIcon :name="showOnetimeForm ? 'lucide:x' : 'lucide:plus'" class="w-4 h-4" />
            </UButton>
          </template>
        </SectionHeader>

        <SurfaceCard v-if="showOnetimeForm" class="app-settings-gap-bottom">
          <div class="ui-form-stack">
            <div>
              <label class="label-xs ui-field-label">Nome</label>
              <UInput v-model="onetimeForm.name" placeholder="Acquisto attrezzatura" />
            </div>

            <div class="app-settings-grid">
              <div>
                <label class="label-xs ui-field-label">Importo (€)</label>
                <UInput v-model="onetimeForm.amount" type="number" step="0.01" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Data</label>
                <UInput v-model="onetimeForm.date" type="date" />
              </div>
            </div>

            <UButton
              block
              size="sm"
              :disabled="!onetimeForm.name || !onetimeForm.amount || !onetimeForm.date"
              @click="addOnetimePayment"
            >
              Aggiungi pagamento
            </UButton>
          </div>
        </SurfaceCard>

        <SurfaceCard v-if="onetimePayments.length === 0" padding="md">
          <StateBlock type="empty" text="Nessun pagamento una tantum quest'anno" />
        </SurfaceCard>

        <SurfaceCard v-else padding="none" divided>
          <div v-for="payment in onetimePayments" :key="payment.id" class="ui-payment-row">
            <div class="flex-1">
              <p class="ui-payment-row__name">{{ payment.name }}</p>
              <p class="ui-payment-row__meta">{{ fmt.date(payment.date) }} · {{ fmt.eur(payment.amount) }}</p>
            </div>
            <UButton size="xs" variant="ghost" color="red" @click="deleteOnetimePayment(payment.id)">
              <UIcon name="lucide:trash-2" class="w-4 h-4" />
            </UButton>
          </div>
        </SurfaceCard>
      </AppSection>
    </template>
  </AppPageShell>
</template>

<script setup lang="ts">
const fmt = useFmt()
const { session } = useUserSession()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const settings = ref<any>(null)
const recurringPayments = ref<any[]>([])
const onetimePayments = ref<any[]>([])
const showRecurringForm = ref(false)
const showOnetimeForm = ref(false)

const form = reactive({
  hourlyRate: 30,
  coefficiente: 0.67,
  irpefRate: 0.15,
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

async function loadData() {
  loading.value = true
  const [s, r, o] = await Promise.all([
    $fetch('/api/settings'),
    $fetch('/api/payments/recurring'),
    $fetch(`/api/payments/onetime?year=${new Date().getFullYear()}`),
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
