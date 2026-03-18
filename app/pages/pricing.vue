<template>
  <div class="app-landing">
    <section class="app-landing__hero">
      <div class="app-landing__hero-copy fade-up fade-up-1">
        <p class="app-landing__eyebrow">Prezzi Chiaro</p>
        <h1 class="app-landing__title">
          Paga per chiarezza mensile, non per un commercialista travestito da software.
        </h1>
        <p class="app-landing__lead">
          Free ti fa capire il metodo. Core sblocca il loop mensile completo. Planning aggiunge
          scenari, profondita annuale ed export ordinato.
        </p>
      </div>

      <SurfaceCard variant="gradient" padding="lg" class="app-landing__panel fade-up fade-up-2">
        <div class="ui-form-stack">
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Promessa</span>
            <span class="ui-kv-row__value text-[var(--text-primary)]">Disponibile reale, ogni mese</span>
          </div>
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Garanzia</span>
            <span class="ui-kv-row__value text-[var(--accent-text)]">Rimborso 30 giorni</span>
          </div>
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Consigliato</span>
            <span class="ui-kv-row__value text-[var(--warning)]">Core Clarity</span>
          </div>
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Billing</span>
            <span class="ui-kv-row__value text-[var(--text-primary)]">Annuale, semplice, web-first</span>
          </div>
        </div>
      </SurfaceCard>
    </section>

    <section class="app-landing__section fade-up fade-up-2">
      <div>
        <p class="app-landing__eyebrow">Piani</p>
        <h2 class="app-landing__section-title">Scegli il livello di controllo che ti serve.</h2>
        <p class="app-landing__section-copy">
          Il piano raccomandato e Core. Planning e per chi vuole scenari ed export senza uscire dal
          prodotto. Se hai gia un abbonamento, puoi gestirlo dallo spazio personale.
        </p>
      </div>

      <div class="app-landing__price-grid">
        <SurfaceCard padding="lg" class="app-landing__price-card">
          <p class="label-xs">Free</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">0€</span>
          </div>
          <p class="app-page-copy">
            Onboarding, preview del dashboard e storico ridotto per capire il metodo.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Onboarding completo</p>
            <p class="app-landing__feature">Preview Home</p>
            <p class="app-landing__feature">Storico limitato</p>
          </div>
          <UButton
            :to="currentUser ? '/app' : '/login'"
            variant="soft"
            color="neutral"
            class="ui-action-button"
          >
            {{ currentUser ? 'Apri l’app' : 'Inizia gratis' }}
          </UButton>
        </SurfaceCard>

        <SurfaceCard padding="lg" class="app-landing__price-card app-landing__price-card--featured">
          <p class="label-xs">Core Clarity</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">49€</span>
            <span class="app-landing__price-period">/ anno</span>
          </div>
          <p class="app-page-copy">
            Il piano consigliato per leggere il mese, sbloccare scadenze e lavorare sul numero che conta.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Loop mensile completo</p>
            <p class="app-landing__feature">Scadenze fiscali</p>
            <p class="app-landing__feature">Storico completo</p>
          </div>
          <UButton
            color="primary"
            class="ui-action-button"
            :loading="billingLoading && pendingPlan === 'CORE_CLARITY'"
            @click="handlePlanAction('CORE_CLARITY')"
          >
            {{ currentUser ? coreActionLabel : 'Accedi per scegliere Core' }}
          </UButton>
        </SurfaceCard>

        <SurfaceCard padding="lg" class="app-landing__price-card">
          <p class="label-xs">Planning & Scenarios</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">79€</span>
            <span class="app-landing__price-period">/ anno</span>
          </div>
          <p class="app-page-copy">
            Per chi vuole confrontare scenari, esportare per il commercialista e leggere meglio l’anno.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Scenario comparison</p>
            <p class="app-landing__feature">Export ordinato</p>
            <p class="app-landing__feature">Planning annuale avanzato</p>
          </div>
          <UButton
            variant="soft"
            color="neutral"
            class="ui-action-button"
            :loading="billingLoading && pendingPlan === 'PLANNING_SCENARIOS'"
            @click="handlePlanAction('PLANNING_SCENARIOS')"
          >
            {{ currentUser ? planningActionLabel : 'Accedi per scegliere Planning' }}
          </UButton>
        </SurfaceCard>
      </div>
    </section>

    <section class="app-landing__section fade-up fade-up-2">
      <div class="app-grid-2">
        <SurfaceCard padding="lg">
          <p class="label-xs">Refund promise</p>
          <h2 class="app-landing__section-title mt-3">Se non ti da piu chiarezza del tuo sistema attuale, rimborsiamo.</h2>
          <p class="app-page-copy mt-3">
            Completa il setup, registra almeno un incasso e prova il rituale mensile. Hai 30 giorni
            per capire se Chiaro riduce davvero il rumore.
          </p>
        </SurfaceCard>

        <SurfaceCard padding="lg">
          <p class="label-xs">Gestione abbonamento</p>
          <h2 class="app-landing__section-title mt-3">Lo stato del piano resta leggibile anche dentro l’app.</h2>
          <p class="app-page-copy mt-3">
            Il billing non vive solo sul checkout: puoi rivedere il piano, aprire il portale Stripe
            e leggere i limiti del free direttamente nel prodotto.
          </p>
          <UButton
            v-if="currentUser?.billing?.isPaid"
            variant="soft"
            color="neutral"
            class="ui-action-button mt-6"
            :loading="billingLoading && pendingPlan === 'PORTAL'"
            @click="openBillingPortal"
          >
            Apri portale abbonamenti
          </UButton>
        </SurfaceCard>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { currentUser } = useCurrentUser()
const { startCheckout, openPortal, loading } = useBilling()

const pendingPlan = ref<'CORE_CLARITY' | 'PLANNING_SCENARIOS' | 'PORTAL' | null>(null)

const billingLoading = computed(() => loading.value)
const coreActionLabel = computed(() => {
  if (currentUser.value?.billing?.planTier === 'CORE_CLARITY' && currentUser.value.billing.isPaid) {
    return 'Piano attivo'
  }
  if (currentUser.value?.billing?.isPaid) {
    return 'Passa a Core'
  }
  return 'Scegli Core'
})

const planningActionLabel = computed(() => {
  if (currentUser.value?.billing?.planTier === 'PLANNING_SCENARIOS' && currentUser.value.billing.isPaid) {
    return 'Piano attivo'
  }
  return 'Scegli Planning'
})

async function handlePlanAction(plan: 'CORE_CLARITY' | 'PLANNING_SCENARIOS') {
  if (!currentUser.value) {
    await navigateTo('/login')
    return
  }

  if (currentUser.value.billing.planTier === plan && currentUser.value.billing.isPaid) {
    pendingPlan.value = 'PORTAL'
    await openPortal()
    pendingPlan.value = null
    return
  }

  pendingPlan.value = plan
  await startCheckout(plan)
  pendingPlan.value = null
}

async function openBillingPortal() {
  pendingPlan.value = 'PORTAL'
  await openPortal()
  pendingPlan.value = null
}

useHead({
  title: 'Prezzi Chiaro',
})
</script>
