<template>
  <div class="app-landing">
    <section class="app-landing__hero">
      <div class="app-landing__hero-copy">
        <h1 class="app-landing__title">
          Sai sempre quanto puoi spendere.
        </h1>
        <p class="app-landing__lead">
          Tasse, contributi e scadenze calcolate dal tuo incassato.
          Il numero che resta e quello che puoi davvero usare.
        </p>

        <div class="app-landing__actions">
          <UButton :to="currentUser ? '/app' : '/login'" size="lg" color="primary" class="ui-action-button">
            {{ currentUser ? 'Apri app' : 'Inizia gratis' }}
          </UButton>
          <UButton size="lg" variant="soft" color="neutral" class="ui-action-button" @click="scrollToSection('prezzi')">
            Vedi i piani
          </UButton>
        </div>
      </div>

      <SurfaceCard padding="lg" class="app-landing__panel">
        <div class="app-landing__calc">
          <div class="app-landing__calc-row">
            <span class="label-xs">Incassato questo mese</span>
            <span class="font-display text-2xl tracking-tight text-[var(--text-primary)]">€ 4.200</span>
          </div>
          <div class="app-landing__calc-row">
            <span class="label-xs">Da accantonare</span>
            <span class="font-display text-2xl tracking-tight text-[var(--danger-text)]">− € 1.176</span>
          </div>
          <div class="app-landing__calc-divider" />
          <div class="app-landing__calc-row">
            <span class="label-xs">Disponibile reale</span>
            <span class="font-display text-3xl tracking-tight text-[var(--accent-text)]">€ 3.024</span>
          </div>
        </div>
      </SurfaceCard>
    </section>

    <section id="come-funziona" class="app-landing__section">
      <div>
        <p class="label-xs">Come funziona</p>
        <h2 class="app-landing__section-title">Tre passaggi.</h2>
      </div>

      <div class="app-grid-3">
        <SurfaceCard variant="soft" padding="md" class="app-landing__step-card">
          <p class="label-xs">1</p>
          <p class="font-display text-lg tracking-tight text-[var(--text-primary)] mt-2">Configura il modello</p>
          <p class="app-page-copy mt-2">Coefficiente di redditivita e regime INPS, una volta sola.</p>
        </SurfaceCard>
        <SurfaceCard variant="soft" padding="md" class="app-landing__step-card">
          <p class="label-xs">2</p>
          <p class="font-display text-lg tracking-tight text-[var(--text-primary)] mt-2">Registra gli incassi</p>
          <p class="app-page-copy mt-2">Ogni fattura incassata aggiorna netto e accantonamento in tempo reale.</p>
        </SurfaceCard>
        <SurfaceCard variant="soft" padding="md" class="app-landing__step-card">
          <p class="label-xs">3</p>
          <p class="font-display text-lg tracking-tight text-[var(--text-primary)] mt-2">Leggi il disponibile</p>
          <p class="app-page-copy mt-2">Quanto resta dopo tasse, contributi e scadenze.</p>
        </SurfaceCard>
      </div>
    </section>

    <section id="prezzi" class="app-landing__section">
      <div>
        <p class="label-xs">Prezzi</p>
        <h2 class="app-landing__section-title">Scegli il tuo piano.</h2>
        <p class="app-landing__section-copy">
          30 giorni per capire se funziona per te.
        </p>
      </div>

      <div class="app-landing__price-grid">
        <SurfaceCard padding="lg" class="app-landing__price-card">
          <p class="label-xs">Free</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">0€</span>
          </div>
          <p class="app-page-copy">
            Il loop base per provare il calcolo del disponibile.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Onboarding fiscale</p>
            <p class="app-landing__feature">Dashboard mensile</p>
            <p class="app-landing__feature">Storico limitato</p>
          </div>
          <UButton
            :to="currentUser ? '/app' : '/login'"
            variant="soft"
            color="neutral"
            class="ui-action-button"
          >
            {{ currentUser ? 'Apri app' : 'Inizia gratis' }}
          </UButton>
        </SurfaceCard>

        <SurfaceCard padding="lg" class="app-landing__price-card app-landing__price-card--featured">
          <p class="label-xs">Core Clarity</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">49€</span>
            <span class="app-landing__price-period">/ anno</span>
          </div>
          <p class="app-page-copy">
            Controllo mensile completo con scadenze e storico.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Loop mensile completo</p>
            <p class="app-landing__feature">Scadenze e spiegazioni</p>
            <p class="app-landing__feature">Storico senza limiti</p>
          </div>
          <UButton
            color="primary"
            class="ui-action-button"
            :loading="billingLoading && pendingPlan === 'CORE_CLARITY'"
            @click="handlePlanAction('CORE_CLARITY')"
          >
            {{ currentUser ? coreActionLabel : 'Scegli Core' }}
          </UButton>
        </SurfaceCard>

        <SurfaceCard padding="lg" class="app-landing__price-card">
          <p class="label-xs">Planning & Scenarios</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">79€</span>
            <span class="app-landing__price-period">/ anno</span>
          </div>
          <p class="app-page-copy">
            Scenari, export e planning annuale avanzato.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Confronto scenari</p>
            <p class="app-landing__feature">Export per commercialista</p>
            <p class="app-landing__feature">Planning annuale</p>
          </div>
          <UButton
            variant="soft"
            color="neutral"
            class="ui-action-button"
            :loading="billingLoading && pendingPlan === 'PLANNING_SCENARIOS'"
            @click="handlePlanAction('PLANNING_SCENARIOS')"
          >
            {{ currentUser ? planningActionLabel : 'Scegli Planning' }}
          </UButton>
        </SurfaceCard>
      </div>
    </section>

    <section class="app-landing__section">
      <div>
        <p class="label-xs">FAQ</p>
        <h2 class="app-landing__section-title">Domande frequenti</h2>
      </div>

      <div class="app-landing__faq">
        <details class="app-landing__faq-item">
          <summary class="app-landing__faq-question">Chiaro sostituisce il commercialista?</summary>
          <p class="app-landing__faq-answer">
            No. Chiaro ti dice quanto puoi spendere ogni mese, non fa contabilita.
          </p>
        </details>
        <details class="app-landing__faq-item">
          <summary class="app-landing__faq-question">A chi serve?</summary>
          <p class="app-landing__faq-answer">
            A freelance in forfettario che vogliono sapere subito quanto e davvero disponibile.
          </p>
        </details>
        <details class="app-landing__faq-item">
          <summary class="app-landing__faq-question">Posso provarlo prima di pagare?</summary>
          <p class="app-landing__faq-answer">
            Si, il piano Free da accesso al loop base. Passi a Core quando vuoi.
          </p>
        </details>
      </div>
    </section>

    <section class="app-landing__section">
      <div class="app-landing__cta-final">
        <UButton :to="currentUser ? '/app' : '/login'" size="lg" color="primary" class="ui-action-button" style="max-width: 20rem;">
          {{ currentUser ? 'Apri app' : 'Inizia gratis' }}
        </UButton>
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
  if (currentUser.value?.billing?.planTier === 'CORE_CLARITY' && currentUser.value.billing.isPaid)
    return 'Piano attivo'
  if (currentUser.value?.billing?.isPaid)
    return 'Passa a Core'
  return 'Scegli Core'
})

const planningActionLabel = computed(() => {
  if (currentUser.value?.billing?.planTier === 'PLANNING_SCENARIOS' && currentUser.value.billing.isPaid)
    return 'Piano attivo'
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

function scrollToSection(sectionId: string) {
  if (!import.meta.client)
    return
  const section = document.getElementById(sectionId)
  if (!section)
    return
  const top = section.getBoundingClientRect().top + window.scrollY - 88
  window.scrollTo({ top, behavior: 'smooth' })
}

useHead({
  title: 'Chiaro — il tuo disponibile reale',
  meta: [
    {
      name: 'description',
      content: 'Tasse, contributi e scadenze calcolate dal tuo incassato. Per freelance in regime forfettario.',
    },
  ],
})
</script>
