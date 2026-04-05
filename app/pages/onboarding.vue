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
                <p class="app-brand-copy">Setup rapido per il tuo forfettario</p>
              </div>
            </div>
          </div>

          <h1 class="app-login__title">
            Conferma il coefficiente e l'INPS. Il resto arriva dopo.
          </h1>
          <p class="app-login__subtitle">
            Il profilo base viene letto dal tuo account. Nome, attivita e ATECO li puoi rifinire
            piu tardi nelle impostazioni.
          </p>

          <div class="ui-form-stack mt-8">
            <SurfaceCard variant="soft" padding="sm" class="app-onboarding-step-card">
              <div class="ui-kv-row">
                <span class="ui-kv-row__label">Profilo rilevato</span>
                <span class="ui-kv-row__value text-[var(--text-primary)]">{{ profileName }}</span>
              </div>
              <p class="app-page-copy mt-2">
                {{ profileActivity }}
              </p>
            </SurfaceCard>

            <SurfaceCard variant="soft" padding="sm" class="app-onboarding-step-card">
              <div class="ui-kv-row">
                <span class="ui-kv-row__label">Da rifinire dopo</span>
                <span class="ui-kv-row__value text-[var(--accent-text)]">Impostazioni</span>
              </div>
              <p class="app-page-copy mt-2">
                Nome in app, attivita e codice ATECO restano modificabili piu avanti senza toccare
                il setup fiscale minimo.
              </p>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard padding="lg" class="app-login__panel rounded-[2rem] fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Setup fiscale minimo</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                I numeri che cambiano davvero il disponibile.
              </h2>
              <p class="app-page-copy mt-3">
                Ti chiediamo solo quello che serve per il calcolo. Il resto resta in impostazioni.
              </p>
            </div>

            <div class="ui-form-stack">
              <div>
                <label class="label-xs ui-field-label">Coefficiente di redditivita</label>
                <UInput v-model="form.coefficiente" type="number" step="0.01" min="0" max="1" :ui="fieldUi" />
                <p class="ui-field-help">Per molte attivita digitali il valore guida e 0.67.</p>
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
                    <span class="text-xs leading-6 text-[var(--text-secondary)]">Quote fisse piu eventuale eccedenza.</span>
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

            <SurfaceCard variant="soft" padding="md">
              <div class="ui-form-stack">
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Imposta sostitutiva</span>
                  <span class="ui-kv-row__value text-[var(--text-primary)]">{{ fmt.pct(startupRate * 100) }}</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Anno fiscale</span>
                  <span class="ui-kv-row__value text-[var(--text-primary)]">{{ currentYear }}</span>
                </div>
                <p class="app-page-copy">
                  Questo valore si puo correggere nelle impostazioni in qualsiasi momento.
                </p>
              </div>
            </SurfaceCard>

            <div>
              <label class="label-xs ui-field-label">Simula un incasso mensile (€)</label>
              <UInput v-model="form.previewMonthlyGross" type="number" step="50" min="0" :ui="fieldUi" />
            </div>

            <SurfaceCard variant="soft" padding="md">
              <div class="app-grid-3">
                <div>
                  <p class="label-xs">Incassato</p>
                  <p class="num-lg text-[var(--text-primary)] mt-3">{{ fmt.eur(previewGross) }}</p>
                  <p class="ui-field-help">Una simulazione rapida per vedere il comportamento del modello.</p>
                </div>

                <div>
                  <p class="label-xs">Da accantonare</p>
                  <p class="num-lg text-[var(--danger-text)] mt-3">{{ fmt.eur(previewProvision) }}</p>
                  <p class="ui-field-help">Tasse, INPS e costi fissi distribuiti sul mese.</p>
                </div>

                <div>
                  <p class="label-xs">Quanto puoi usare</p>
                  <p class="num-lg text-[var(--accent-text)] mt-3">{{ fmt.eur(previewNet) }}</p>
                  <p class="ui-field-help">Il numero guida che troverai nel cockpit mensile.</p>
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
                  <span class="ui-kv-row__label">INPS</span>
                  <span class="ui-kv-row__value text-[var(--text-primary)]">{{ inpsLabel }}</span>
                </div>
              </div>
            </SurfaceCard>
            <UButton
              block
              color="primary"
              class="ui-action-button"
              :loading="submitting"
              :disabled="!canProceed"
              @click="submitOnboarding"
            >
              Conferma e entra
            </UButton>

            <p class="app-login__note">
              Nome, attivita e ATECO li sistemi piu tardi nelle impostazioni senza rifare il setup.
            </p>
          </div>
        </SurfaceCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const fmt = useFmt()
const toast = useToast()
const { fieldUi } = useUiStyles()
const { refresh, currentUser } = useCurrentUser()

const currentYear = new Date().getFullYear()
const submitting = ref(false)

const form = reactive({
  coefficiente: 0.67,
  inpsType: 'GESTIONE_SEPARATA',
  inpsRate: 26.07,
  inpsFixedAnnual: 4521.36,
  inpsExcessRate: 24,
  previewMonthlyGross: 2500,
})

const startupRate = computed(() =>
  currentUser.value?.startupRate ?? currentUser.value?.settings.irpefRate ?? 0.15
)

const accountantAnnual = computed(() =>
  currentUser.value?.settings.accountantAnnual ?? 300
)

const profileName = computed(() =>
  currentUser.value?.displayName || currentUser.value?.name || 'Profilo personale'
)

const profileActivity = computed(() => {
  const activity = currentUser.value?.activityLabel || 'Freelance in regime forfettario'
  const ateco = currentUser.value?.atecoCode
    ? [currentUser.value.atecoCode, currentUser.value.atecoLabel].filter(Boolean).join(' · ')
    : 'ATECO da sistemare piu tardi'

  return `${activity}. ${ateco}.`
})

const previewGross = computed(() => Number(form.previewMonthlyGross) || 0)

const previewProvision = computed(() => {
  const coefficiente = Number(form.coefficiente) || 0
  const taxableBase = previewGross.value * coefficiente
  const inpsFixed = form.inpsType === 'GESTIONE_SEPARATA'
    ? taxableBase * ((Number(form.inpsRate) || 0) / 100)
    : (Number(form.inpsFixedAnnual) || 0) / 12
  const inpsExcess = form.inpsType === 'ARTIGIANI'
    ? Math.max(0, taxableBase * 12 - 18808) * ((Number(form.inpsExcessRate) || 0) / 100) / 12
    : 0
  const adjustedTaxableBase = Math.max(0, taxableBase - inpsFixed - inpsExcess)
  const imposta = adjustedTaxableBase * startupRate.value
  const accountant = accountantAnnual.value / 12

  return inpsFixed + inpsExcess + imposta + accountant
})

const previewNet = computed(() => Math.max(0, previewGross.value - previewProvision.value))

const summaryLabel = computed(() =>
  [profileName.value, profileActivity.value].join(' ')
)

const inpsLabel = computed(() =>
  form.inpsType === 'GESTIONE_SEPARATA'
    ? `Gestione separata · ${fmt.pct(form.inpsRate)}`
    : `Artigiani · fissi ${fmt.eur(form.inpsFixedAnnual)}`
)

const canProceed = computed(() => Number(form.coefficiente) > 0)

async function submitOnboarding() {
  submitting.value = true
  try {
    await $fetch('/api/onboarding', {
      method: 'POST',
      body: {
        coefficiente: Number(form.coefficiente),
        startupRate: startupRate.value,
        inpsType: form.inpsType,
        ...(form.inpsType === 'GESTIONE_SEPARATA'
          ? { inpsRate: Number(form.inpsRate) / 100 }
          : {
              inpsFixedAnnual: Number(form.inpsFixedAnnual),
              inpsExcessRate: Number(form.inpsExcessRate) / 100,
            }),
      },
    })

    await refresh(true)
    toast.add({ title: 'Profilo salvato. Chiaro e pronto.', color: 'success' })
    await navigateTo('/app')
  } catch {
    toast.add({ title: 'Non sono riuscito a completare il setup. Riprova.', color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await refresh(true)
})
</script>
