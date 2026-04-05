<template>
  <div class="app-login app-page app-page--onboarding">
    <div class="app-login__container" style="max-width: 36rem;">
      <div class="app-login__header">
        <div class="app-login__brand">
          <div class="app-brand-mark">
            <span class="app-brand-mark__letter">C</span>
          </div>
          <p class="app-brand-title">Chiaro</p>
        </div>

        <h1 class="app-login__title">
          Conferma il modello fiscale.
        </h1>
      </div>

      <SurfaceCard padding="lg" class="fade-up fade-up-1">
        <div class="ui-form-stack">
          <div>
            <p class="label-xs">Setup fiscale</p>
            <p class="app-page-copy mt-2">
              Solo coefficiente e INPS servono per partire. Il resto lo sistemi nelle impostazioni.
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
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Contributi percentuali.</span>
                </button>

                <button
                  type="button"
                  class="ui-segment-btn"
                  :class="{ 'is-active': form.inpsType === 'ARTIGIANI' }"
                  @click="form.inpsType = 'ARTIGIANI'"
                >
                  <span>Artigiani</span>
                  <span class="text-xs leading-6 text-[var(--text-secondary)]">Quote fisse + eccedenza.</span>
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

          <div>
            <label class="label-xs ui-field-label">Simula un incasso mensile (€)</label>
            <UInput v-model="form.previewMonthlyGross" type="number" step="50" min="0" :ui="fieldUi" />
          </div>

          <SurfaceCard variant="soft" padding="md">
            <div class="app-grid-3">
              <div>
                <p class="label-xs">Incassato</p>
                <p class="num-lg text-[var(--text-primary)] mt-2">{{ fmt.eur(previewGross) }}</p>
              </div>

              <div>
                <p class="label-xs">Da accantonare</p>
                <p class="num-lg text-[var(--danger-text)] mt-2">{{ fmt.eur(previewProvision) }}</p>
              </div>

              <div>
                <p class="label-xs">Disponibile</p>
                <p class="num-lg text-[var(--accent-text)] mt-2">{{ fmt.eur(previewNet) }}</p>
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
        </div>
      </SurfaceCard>
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
    toast.add({ title: 'Chiaro e pronto.', color: 'success' })
    await navigateTo('/app')
  } catch {
    toast.add({ title: 'Errore nel setup. Riprova.', color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await refresh(true)
})
</script>
