<template>
  <div class="px-4 pt-6 space-y-6 md:px-6">
    <div class="fade-up">
      <h1 class="font-display text-2xl font-bold text-revolut-text light:text-revolut-light-text mb-1">Impostazioni</h1>
      <p class="text-sm text-revolut-muted">Gestisci la configurazione fiscale e i pagamenti</p>
    </div>

    <div v-if="loading" class="py-16 flex justify-center">
      <UIcon name="lucide:loader-2" class="w-6 h-6 animate-spin text-revolut-muted" />
    </div>

    <template v-else>
      <!-- Account Section -->
      <section class="fade-up fade-up-1">
        <h2 class="label-xs mb-3">Account</h2>
        <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm font-medium text-revolut-text light:text-revolut-light-text">{{ session?.user?.email }}</p>
              <p class="text-xs text-revolut-muted mt-1">{{ session?.user?.name }}</p>
            </div>
            <UButton
              variant="outline"
              size="sm"
              @click="logout"
            >
              Esci
            </UButton>
          </div>
        </div>
      </section>

      <!-- Tax Configuration -->
      <section class="fade-up fade-up-2">
        <h2 class="label-xs mb-3">Configurazione fiscale</h2>
        <div class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label-xs block mb-2">Tariffa oraria (€)</label>
              <UInput
                v-model="form.hourlyRate"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <label class="label-xs block mb-2">Coefficiente di Redditività</label>
              <UInput
                v-model="form.coefficiente"
                type="number"
                step="0.01"
                min="0"
                max="1"
              />
              <p class="text-xs text-revolut-muted mt-1">0.67 for ATECO 62 (IT)</p>
            </div>
            
            <div>
              <label class="label-xs block mb-2">Aliquota IRPEF (%)</label>
              <UInput
                v-model="form.irpefRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
              />
              <p class="text-xs text-revolut-muted mt-1">5% or 15%</p>
            </div>
            
            <div>
              <label class="label-xs block mb-2">Commercialista annuale (€)</label>
              <UInput
                v-model="form.accountantAnnual"
                type="number"
                step="1"
                min="0"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-revolut-border light:border-revolut-light-border">
            <label class="label-xs block mb-3">Tipo INPS</label>
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                class="px-4 py-3 rounded-xl border transition-all text-sm font-medium"
                :class="form.inpsType === 'GESTIONE_SEPARATA' 
                  ? 'bg-revolut-card border-revolut-green text-revolut-green' 
                  : 'border-revolut-border text-revolut-muted hover:border-[#3a3a3d]'"
                @click="form.inpsType = 'GESTIONE_SEPARATA'"
              >
                Gestione Separata
              </button>
              <button
                type="button"
                class="px-4 py-3 rounded-xl border transition-all text-sm font-medium"
                :class="form.inpsType === 'ARTIGIANI' 
                  ? 'bg-revolut-card border-revolut-green text-revolut-green' 
                  : 'border-revolut-border text-revolut-muted hover:border-[#3a3a3d]'"
                @click="form.inpsType = 'ARTIGIANI'"
              >
                Artigiani
              </button>
            </div>

            <div v-if="form.inpsType === 'GESTIONE_SEPARATA'" class="grid grid-cols-1 gap-4">
              <div>
                <label class="label-xs block mb-2">Aliquota INPS (%)</label>
                <UInput
                  v-model="form.inpsRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <p class="text-xs text-revolut-muted mt-1">26.07% for 2025-2026</p>
              </div>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label-xs block mb-2">INPS fissi annuali (€)</label>
                <UInput
                  v-model="form.inpsFixedAnnual"
                  type="number"
                  step="1"
                  min="0"
                />
                <p class="text-xs text-revolut-muted mt-1">~2,939€ ridotta / ~4,521€ standard (artigiani 2026)</p>
              </div>

              <div>
                <label class="label-xs block mb-2">Soglia minimale (€)</label>
                <UInput
                  v-model="form.inpsMinimaleThreshold"
                  type="number"
                  step="1"
                  min="0"
                />
                <p class="text-xs text-revolut-muted mt-1">18,808€ for 2026</p>
              </div>

              <div>
                <label class="label-xs block mb-2">Aliquota eccedenza (%)</label>
                <UInput
                  v-model="form.inpsExcessRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <p class="text-xs text-revolut-muted mt-1">15.6% ridotta / 24% standard (artigiani)</p>
              </div>
            </div>
          </div>

          <UButton
            block
            class="mt-6"
            :loading="saving"
            @click="saveSettings"
          >
            Salva configurazione
          </UButton>
        </div>
      </section>

      <!-- Recurring Payments -->
      <section class="fade-up fade-up-3">
        <div class="flex items-center justify-between mb-3">
          <h2 class="label-xs">Pagamenti ricorrenti</h2>
          <UButton
            size="xs"
            variant="ghost"
            @click="showRecurringForm = !showRecurringForm"
          >
            <UIcon :name="showRecurringForm ? 'lucide:x' : 'lucide:plus'" class="w-4 h-4" />
          </UButton>
        </div>

        <div v-if="showRecurringForm" class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5 mb-3">
          <div class="space-y-4">
            <div>
              <label class="label-xs block mb-2">Nome</label>
              <UInput v-model="recurringForm.name" placeholder="Abbonamento SaaS" />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label-xs block mb-2">Importo (€)</label>
                <UInput v-model="recurringForm.amount" type="number" step="0.01" />
              </div>
              
              <div>
                <label class="label-xs block mb-2">Frequenza</label>
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
        </div>

        <div v-if="recurringPayments.length === 0" class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-8 text-center">
          <p class="text-sm text-revolut-muted">Nessun pagamento ricorrente</p>
        </div>

        <div v-else class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border divide-y divide-revolut-border light:divide-revolut-light-border">
          <div v-for="payment in recurringPayments" :key="payment.id" class="flex items-center justify-between p-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-revolut-text light:text-revolut-light-text">{{ payment.name }}</p>
              <p class="text-xs text-revolut-muted mt-1">{{ payment.frequency }} · {{ fmt.eur(payment.amount) }}</p>
            </div>
            <UButton
              size="xs"
              variant="ghost"
              color="red"
              @click="deleteRecurringPayment(payment.id)"
            >
              <UIcon name="lucide:trash-2" class="w-4 h-4" />
            </UButton>
          </div>
        </div>
      </section>

      <!-- One-Time Payments -->
      <section class="fade-up fade-up-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="label-xs">Pagamenti una tantum ({{ new Date().getFullYear() }})</h2>
          <UButton
            size="xs"
            variant="ghost"
            @click="showOnetimeForm = !showOnetimeForm"
          >
            <UIcon :name="showOnetimeForm ? 'lucide:x' : 'lucide:plus'" class="w-4 h-4" />
          </UButton>
        </div>

        <div v-if="showOnetimeForm" class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-5 mb-3">
          <div class="space-y-4">
            <div>
              <label class="label-xs block mb-2">Nome</label>
              <UInput v-model="onetimeForm.name" placeholder="Acquisto attrezzatura" />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label-xs block mb-2">Importo (€)</label>
                <UInput v-model="onetimeForm.amount" type="number" step="0.01" />
              </div>
              
              <div>
                <label class="label-xs block mb-2">Data</label>
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
        </div>

        <div v-if="onetimePayments.length === 0" class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border p-8 text-center">
          <p class="text-sm text-revolut-muted">Nessun pagamento una tantum quest'anno</p>
        </div>

        <div v-else class="bg-revolut-dark light:bg-white rounded-2xl border border-revolut-border light:border-revolut-light-border divide-y divide-revolut-border light:divide-revolut-light-border">
          <div v-for="payment in onetimePayments" :key="payment.id" class="flex items-center justify-between p-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-revolut-text light:text-revolut-light-text">{{ payment.name }}</p>
              <p class="text-xs text-revolut-muted mt-1">{{ fmt.date(payment.date) }} · {{ fmt.eur(payment.amount) }}</p>
            </div>
            <UButton
              size="xs"
              variant="ghost"
              color="red"
              @click="deleteOnetimePayment(payment.id)"
            >
              <UIcon name="lucide:trash-2" class="w-4 h-4" />
            </UButton>
          </div>
        </div>
      </section>
    </template>
  </div>
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
