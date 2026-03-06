<template>
  <div class="app-login">
    <div class="app-login__container">
      <div class="app-grid-2 items-start">
        <div class="fade-up fade-up-1">
          <div class="app-login__header">
            <div class="app-mobile-brand">
              <div class="app-brand-mark">
                <UIcon name="lucide:receipt-text" class="w-6 h-6" />
              </div>

              <div>
                <p class="app-brand-title">Fattura Tracker</p>
                <p class="app-brand-copy">Freelance finance cockpit</p>
              </div>
            </div>
          </div>

          <h1 class="app-login__title">
            Entrate, imposte e decisioni nello stesso spazio.
          </h1>
          <p class="app-login__subtitle">
            Progettato per freelance italiani che vogliono una vista pulita sul lavoro registrato,
            sul netto reale e sulle scadenze fiscali che arrivano dopo.
          </p>

          <div class="app-grid-3 mt-8">
            <SurfaceCard variant="soft">
              <div class="ui-stat-card">
                <div class="ui-stat-card__head">
                  <p class="label-xs">Riduci attrito</p>
                  <span class="ui-stat-card__dot" />
                </div>
                <p class="text-sm leading-7 text-revolut-text light:text-revolut-light-text">
                  Registra sessioni orarie e fee progetto in un solo composer.
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard variant="soft">
              <div class="ui-stat-card">
                <div class="ui-stat-card__head">
                  <p class="label-xs">Vedi il netto</p>
                  <span class="ui-stat-card__dot" />
                </div>
                <p class="text-sm leading-7 text-revolut-text light:text-revolut-light-text">
                  Mantieni sempre visibile la distanza tra lordo, imposte e tasca.
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard variant="soft">
              <div class="ui-stat-card">
                <div class="ui-stat-card__head">
                  <p class="label-xs">Pianifica l'anno</p>
                  <span class="ui-stat-card__dot" />
                </div>
                <p class="text-sm leading-7 text-revolut-text light:text-revolut-light-text">
                  Trasforma la proiezione fiscale in un calendario di decisioni.
                </p>
              </div>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard padding="lg" class="rounded-[2rem] fade-up fade-up-2">
          <div class="ui-form-stack">
            <div>
              <p class="label-xs">Accesso protetto</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-revolut-text light:text-revolut-light-text mt-3">
                Entra nel tuo cockpit fiscale.
              </h2>
              <p class="app-page-copy mt-3">
                Accesso riservato all'email autorizzata. La sessione usa Google per semplificare
                l'ingresso e mantenere il prodotto a uso singolo.
              </p>
            </div>

            <SurfaceCard variant="soft" padding="md">
              <div class="ui-form-stack">
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Ambito</span>
                  <span class="ui-kv-row__value text-revolut-text light:text-revolut-light-text">Freelance IT</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Focus</span>
                  <span class="ui-kv-row__value text-revolut-green">Reddito netto</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Modalità</span>
                  <span class="ui-kv-row__value text-revolut-blue">Single user</span>
                </div>
              </div>
            </SurfaceCard>

            <UButton
              block
              size="lg"
              color="primary"
              class="app-login__button ui-action-button"
              :loading="loading"
              @click="signInWithGoogle"
            >
              <UIcon name="logos:google-icon" class="w-5 h-5" />
              <span class="ml-2">Accedi con Google</span>
            </UButton>

            <p class="app-login__note">
              Il primo accesso carica dashboard, configurazione fiscale e pagamenti d'appoggio nello
              stesso ambiente.
            </p>
          </div>
        </SurfaceCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const loading = ref(false)

async function signInWithGoogle() {
  loading.value = true
  await navigateTo('/auth/google', { external: true })
}
</script>
