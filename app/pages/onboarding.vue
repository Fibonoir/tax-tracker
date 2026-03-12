<template>
  <div class="app-login app-page app-page--onboarding">
    <div class="app-login__container">
      <div class="app-grid-2 app-login__layout">
        <div class="fade-up fade-up-1">
          <div class="app-login__header">
            <div class="app-mobile-brand">
              <div class="app-brand-mark">
                <span class="app-brand-mark__letter">C</span>
              </div>

              <div>
                <p class="app-brand-title">Chiaro</p>
                <p class="app-brand-copy">Setup guidato per il tuo forfettario</p>
              </div>
            </div>
          </div>

          <h1 class="app-login__title">
            In meno di un minuto capisci quanto puoi usare davvero.
          </h1>
          <p class="app-login__subtitle">
            Ti chiedo solo i numeri che cambiano il tuo disponibile. Il resto lo sistemi dopo.
          </p>

          <div class="ui-form-stack mt-8">
            <SurfaceCard
              v-for="item in stepMeta"
              :key="item.id"
              variant="soft"
              padding="sm"
              class="app-onboarding-step-card"
              :class="{ 'is-active': item.id === step }"
            >
              <div class="ui-kv-row">
                <span class="ui-kv-row__label">Step {{ item.id }}</span>
                <span class="ui-kv-row__value text-[var(--text-primary)]">{{ item.title }}</span>
              </div>
              <p class="app-page-copy mt-2">{{ item.copy }}</p>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard padding="lg" class="app-login__panel rounded-[2rem] fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Step {{ step }} di 4</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                {{ activeStep.title }}
              </h2>
              <p class="app-page-copy mt-3">
                {{ activeStep.copy }}
              </p>
            </div>

            <div v-if="step === 1" class="ui-form-stack">
              <div>
                <label class="label-xs ui-field-label">Come vuoi comparire in app</label>
                <UInput v-model="form.displayName" placeholder="Federico" :ui="fieldUi" />
              </div>

              <div>
                <label class="label-xs ui-field-label">Che tipo di lavoro fai</label>
                <UInput
                  v-model="form.activityLabel"
                  placeholder="Sviluppatore freelance, consulente marketing, designer..."
                  :ui="fieldUi"
                />
              </div>
            </div>

            <div v-else-if="step === 2" class="ui-form-stack">
              <div class="ui-form-grid-2">
                <div>
                  <label class="label-xs ui-field-label">Codice ATECO</label>
                  <UInput v-model="form.atecoCode" placeholder="62.01.00" :ui="fieldUi" />
                </div>

                <div>
                  <label class="label-xs ui-field-label">Etichetta ATECO</label>
                  <UInput v-model="form.atecoLabel" placeholder="Produzione software" :ui="fieldUi" />
                </div>
              </div>

              <div class="ui-form-grid-2">
                <div>
                  <label class="label-xs ui-field-label">Coefficiente</label>
                  <UInput v-model="form.coefficiente" type="number" step="0.01" min="0" max="1" :ui="fieldUi" />
                </div>

                <div>
                  <label class="label-xs ui-field-label">Tariffa oraria guida (€)</label>
                  <UInput v-model="form.hourlyRate" type="number" step="1" min="0" :ui="fieldUi" />
                </div>
              </div>

              <div>
                <label class="label-xs ui-field-label">Aliquota imposta</label>
                <div class="ui-form-grid-2 ui-form-grid-2--compact">
                  <button
                    type="button"
                    class="ui-segment-btn"
                    :class="{ 'is-active': form.startupRate === 0.05 }"
                    @click="form.startupRate = 0.05"
                  >
                    <span>5%</span>
                    <span class="text-xs leading-6 text-[var(--text-secondary)]">Se sei ancora nel periodo agevolato.</span>
                  </button>

                  <button
                    type="button"
                    class="ui-segment-btn"
                    :class="{ 'is-active': form.startupRate === 0.15 }"
                    @click="form.startupRate = 0.15"
                  >
                    <span>15%</span>
                    <span class="text-xs leading-6 text-[var(--text-secondary)]">L’assetto standard del forfettario.</span>
                  </button>
                </div>
              </div>

              <div>
                <label class="label-xs ui-field-label">Regime INPS</label>
                <div class="ui-form-grid-2 ui-form-grid-2--compact">
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
                    <span class="text-xs leading-6 text-[var(--text-secondary)]">Fissi + eventuale eccedenza.</span>
                  </button>
                </div>
              </div>

              <div v-if="form.inpsType === 'GESTIONE_SEPARATA'">
                <label class="label-xs ui-field-label">Aliquota INPS (%)</label>
                <UInput v-model="form.inpsRate" type="number" step="0.01" min="0" max="100" :ui="fieldUi" />
              </div>

              <div v-else class="ui-form-grid-2">
                <div>
                  <label class="label-xs ui-field-label">INPS fissi annuali (€)</label>
                  <UInput v-model="form.inpsFixedAnnual" type="number" step="1" min="0" :ui="fieldUi" />
                </div>

                <div>
                  <label class="label-xs ui-field-label">Aliquota eccedenza (%)</label>
                  <UInput v-model="form.inpsExcessRate" type="number" step="0.01" min="0" max="100" :ui="fieldUi" />
                </div>
              </div>
            </div>

            <div v-else-if="step === 3" class="ui-form-stack">
              <div class="ui-form-grid-2">
                <div>
                  <label class="label-xs ui-field-label">Commercialista annuale (€)</label>
                  <UInput v-model="form.accountantAnnual" type="number" step="1" min="0" :ui="fieldUi" />
                </div>

                <div>
                  <label class="label-xs ui-field-label">Anno fiscale</label>
                  <UInput v-model="form.taxYear" type="number" step="1" min="2024" max="2030" :ui="fieldUi" />
                </div>
              </div>

              <SurfaceCard variant="soft" padding="md">
                <div class="ui-form-stack">
                  <div class="ui-kv-row">
                    <span class="ui-kv-row__label">Costo ricorrente</span>
                    <span class="ui-kv-row__value text-[var(--text-primary)]">Facoltativo</span>
                  </div>

                  <div class="ui-form-grid-2">
                    <div>
                      <label class="label-xs ui-field-label">Nome</label>
                      <UInput v-model="form.recurringName" placeholder="Software o coworking" :ui="fieldUi" />
                    </div>

                    <div>
                      <label class="label-xs ui-field-label">Importo (€)</label>
                      <UInput v-model="form.recurringAmount" type="number" step="0.01" min="0" :ui="fieldUi" />
                    </div>
                  </div>

                  <div>
                    <label class="label-xs ui-field-label">Frequenza</label>
                    <USelect v-model="form.recurringFrequency" :items="frequencyOptions" :ui="selectUi" />
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard variant="soft" padding="md">
                <div class="ui-form-stack">
                  <div class="ui-kv-row">
                    <span class="ui-kv-row__label">Uscita una tantum</span>
                    <span class="ui-kv-row__value text-[var(--text-primary)]">Facoltativa</span>
                  </div>

                  <div class="ui-form-grid-2">
                    <div>
                      <label class="label-xs ui-field-label">Nome</label>
                      <UInput v-model="form.oneTimeName" placeholder="Attrezzatura o formazione" :ui="fieldUi" />
                    </div>

                    <div>
                      <label class="label-xs ui-field-label">Importo (€)</label>
                      <UInput v-model="form.oneTimeAmount" type="number" step="0.01" min="0" :ui="fieldUi" />
                    </div>
                  </div>

                  <div>
                    <label class="label-xs ui-field-label">Data</label>
                    <AppDateField v-model="form.oneTimeDate" />
                  </div>
                </div>
              </SurfaceCard>
            </div>

            <div v-else class="ui-form-stack">
              <div>
                <label class="label-xs ui-field-label">Simula un incasso mensile (€)</label>
                <UInput v-model="form.previewMonthlyGross" type="number" step="50" min="0" :ui="fieldUi" />
              </div>

              <SurfaceCard variant="soft" padding="md">
                <div class="app-grid-3">
                  <div>
                    <p class="label-xs">Incassato</p>
                    <p class="num-lg text-[var(--text-primary)] mt-3">{{ fmt.eur(previewGross) }}</p>
                    <p class="ui-field-help">Una simulazione semplice per vedere come ragiona Chiaro.</p>
                  </div>

                  <div>
                    <p class="label-xs">Da accantonare</p>
                    <p class="num-lg text-[var(--danger-text)] mt-3">{{ fmt.eur(previewProvision) }}</p>
                    <p class="ui-field-help">Tasse, contributi e costi che non vuoi confondere con soldi spendibili.</p>
                  </div>

                  <div>
                    <p class="label-xs">Quanto puoi usare</p>
                    <p class="num-lg text-[var(--accent-text)] mt-3">{{ fmt.eur(previewNet) }}</p>
                    <p class="ui-field-help">Questo e il numero guida che troverai ogni mese in app.</p>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard variant="soft" padding="md">
                <div class="ui-form-stack">
                  <div class="ui-kv-row">
                    <span class="ui-kv-row__label">Profilo</span>
                    <span class="ui-kv-row__value text-[var(--text-primary)]">{{ summaryLabel }}</span>
                  </div>
                  <div class="ui-kv-row">
                    <span class="ui-kv-row__label">Imposta</span>
                    <span class="ui-kv-row__value text-[var(--info)]">{{ fmt.pct(form.startupRate * 100) }}</span>
                  </div>
                  <div class="ui-kv-row">
                    <span class="ui-kv-row__label">INPS</span>
                    <span class="ui-kv-row__value text-[var(--text-primary)]">{{ inpsLabel }}</span>
                  </div>
                </div>
              </SurfaceCard>
            </div>

            <div class="ui-form-grid-2">
              <UButton
                color="neutral"
                variant="soft"
                class="ui-action-button--ghost"
                :disabled="step === 1 || submitting"
                @click="step -= 1"
              >
                Indietro
              </UButton>

              <UButton
                color="primary"
                class="ui-action-button"
                :loading="submitting"
                :disabled="!canProceed"
                @click="handlePrimaryAction"
              >
                {{ step === 4 ? 'Entra in Chiaro' : 'Continua' }}
              </UButton>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const fmt = useFmt()
const toast = useToast()
const { fieldUi, selectUi } = useUiStyles()
const { refresh, currentUser } = useCurrentUser()

const step = ref(1)
const submitting = ref(false)
const frequencyOptions = ['MONTHLY', 'QUARTERLY', 'ANNUAL']

const stepMeta = [
  { id: 1, title: 'Chi sei', copy: 'Il nome e il tipo di attivita ci aiutano a rendere il cruscotto piu tuo fin dal primo accesso.' },
  { id: 2, title: 'Profilo fiscale', copy: 'Qui fissiamo coefficiente, imposta e INPS che guidano tutte le stime.' },
  { id: 3, title: 'Costi', copy: 'Aggiungi solo quello che incide davvero sul tuo disponibile mese per mese.' },
  { id: 4, title: 'Anteprima', copy: 'Prima di entrare vedi come Chiaro separa incassato, accantonamento e soldi davvero utilizzabili.' },
]

const form = reactive({
  displayName: '',
  activityLabel: '',
  atecoCode: '',
  atecoLabel: '',
  coefficiente: 0.67,
  hourlyRate: 45,
  startupRate: 0.15,
  inpsType: 'GESTIONE_SEPARATA',
  inpsRate: 26.07,
  inpsFixedAnnual: 4521.36,
  inpsExcessRate: 24,
  accountantAnnual: 300,
  taxYear: new Date().getFullYear(),
  recurringName: '',
  recurringAmount: '',
  recurringFrequency: 'MONTHLY',
  oneTimeName: '',
  oneTimeAmount: '',
  oneTimeDate: new Date().toISOString().split('T')[0],
  previewMonthlyGross: 2500,
})

const activeStep = computed(() => stepMeta[step.value - 1])

const previewGross = computed(() => Number(form.previewMonthlyGross) || 0)

const normalizedSettings = computed(() => {
  const coefficiente = Number(form.coefficiente) || 0
  const taxableBase = previewGross.value * coefficiente
  const inpsFixed = form.inpsType === 'GESTIONE_SEPARATA'
    ? taxableBase * ((Number(form.inpsRate) || 0) / 100)
    : (Number(form.inpsFixedAnnual) || 0) / 12
  const inpsExcess = form.inpsType === 'ARTIGIANI'
    ? Math.max(0, taxableBase * 12 - 18808) * ((Number(form.inpsExcessRate) || 0) / 100) / 12
    : 0
  const adjustedTaxableBase = Math.max(0, taxableBase - inpsFixed - inpsExcess)
  const imposta = adjustedTaxableBase * (Number(form.startupRate) || 0)
  const accountant = (Number(form.accountantAnnual) || 0) / 12
  const recurring = Number(form.recurringAmount) > 0
    ? Number(form.recurringAmount) * (form.recurringFrequency === 'MONTHLY' ? 1 : form.recurringFrequency === 'QUARTERLY' ? 1 / 3 : 1 / 12)
    : 0
  const oneTime = Number(form.oneTimeAmount) > 0 ? Number(form.oneTimeAmount) / 12 : 0

  return {
    provision: inpsFixed + inpsExcess + imposta + accountant + recurring + oneTime,
  }
})

const previewProvision = computed(() => normalizedSettings.value.provision)
const previewNet = computed(() => Math.max(0, previewGross.value - previewProvision.value))

const summaryLabel = computed(() =>
  [form.displayName || 'Profilo Chiaro', form.activityLabel || 'Attivita freelance'].join(' · ')
)

const inpsLabel = computed(() =>
  form.inpsType === 'GESTIONE_SEPARATA' ? 'Gestione separata' : 'Artigiani'
)

const canProceed = computed(() => {
  if (step.value === 1)
    return Boolean(form.displayName && form.activityLabel)
  if (step.value === 2)
    return Boolean(form.atecoCode && form.atecoLabel && Number(form.coefficiente) > 0)
  if (step.value === 3)
    return Number(form.accountantAnnual) >= 0
  return previewGross.value > 0
})

function hydrateFromCurrentUser() {
  if (!currentUser.value)
    return

  form.displayName = currentUser.value.displayName || currentUser.value.name || ''
  form.activityLabel = currentUser.value.activityLabel || ''
  form.atecoCode = currentUser.value.atecoCode || ''
  form.atecoLabel = currentUser.value.atecoLabel || ''
  form.coefficiente = currentUser.value.settings.coefficiente
  form.hourlyRate = currentUser.value.settings.hourlyRate
  form.startupRate = currentUser.value.startupRate || currentUser.value.settings.irpefRate
  form.inpsType = currentUser.value.settings.inpsType
  form.inpsRate = currentUser.value.settings.inpsRate * 100
  form.inpsFixedAnnual = currentUser.value.settings.inpsFixedAnnual
  form.inpsExcessRate = currentUser.value.settings.inpsExcessRate * 100
  form.accountantAnnual = currentUser.value.settings.accountantAnnual
  form.taxYear = currentUser.value.taxYear || new Date().getFullYear()
}

async function handlePrimaryAction() {
  if (step.value < 4) {
    step.value += 1
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/onboarding', {
      method: 'POST',
      body: {
        displayName: form.displayName,
        activityLabel: form.activityLabel,
        atecoCode: form.atecoCode,
        atecoLabel: form.atecoLabel,
        coefficiente: Number(form.coefficiente),
        hourlyRate: Number(form.hourlyRate),
        startupRate: Number(form.startupRate),
        inpsType: form.inpsType,
        inpsRate: Number(form.inpsRate) / 100,
        inpsFixedAnnual: Number(form.inpsFixedAnnual),
        inpsExcessRate: Number(form.inpsExcessRate) / 100,
        accountantAnnual: Number(form.accountantAnnual),
        taxYear: Number(form.taxYear),
        recurringPayments: form.recurringName && Number(form.recurringAmount) > 0
          ? [{
              name: form.recurringName,
              amount: Number(form.recurringAmount),
              frequency: form.recurringFrequency,
            }]
          : [],
        oneTimePayments: form.oneTimeName && Number(form.oneTimeAmount) > 0
          ? [{
              name: form.oneTimeName,
              amount: Number(form.oneTimeAmount),
              date: form.oneTimeDate,
            }]
          : [],
        replacePayments: true,
      },
    })

    await refresh(true)
    toast.add({ title: 'Profilo salvato. Da ora Chiaro ti mostra il numero che conta davvero.', color: 'success' })
    await navigateTo('/')
  } catch {
    toast.add({ title: 'Non sono riuscito a completare il setup. Riprova.', color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await refresh(true)
  hydrateFromCurrentUser()
})
</script>
