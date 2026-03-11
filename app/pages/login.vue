<template>
  <div class="app-login app-page app-page--login">
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
                <p class="app-brand-copy">Per freelance in forfettario</p>
              </div>
            </div>
          </div>

          <h1 class="app-login__title">
            Non spendere soldi che non sono davvero tuoi.
          </h1>
          <p class="app-login__subtitle">
            Chiaro e l'app che ti dice, ogni mese, quanto hai incassato, quanto devi mettere da
            parte e quanto ti resta davvero.
          </p>

          <div class="app-grid-3 app-login__feature-grid mt-8">
            <SurfaceCard variant="soft" class="app-login__feature-card">
              <div class="ui-stat-card">
                <div class="ui-stat-card__head app-login__feature-head">
                  <p class="label-xs">Registra</p>
                  <span class="ui-stat-card__dot" />
                </div>
                <p class="text-sm leading-7 text-[var(--text-primary)]">
                  Sessioni orarie e fee progetto nello stesso flusso, con i soli dati utili.
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard variant="soft" class="app-login__feature-card">
              <div class="ui-stat-card">
                <div class="ui-stat-card__head app-login__feature-head">
                  <p class="label-xs">Accantona</p>
                  <span class="ui-stat-card__dot" />
                </div>
                <p class="text-sm leading-7 text-[var(--text-primary)]">
                  Tieni visibile la distanza tra incassato, disponibile e quota da spostare.
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard variant="soft" class="app-login__feature-card">
              <div class="ui-stat-card">
                <div class="ui-stat-card__head app-login__feature-head">
                  <p class="label-xs">Prevedi</p>
                  <span class="ui-stat-card__dot" />
                </div>
                <p class="text-sm leading-7 text-[var(--text-primary)]">
                  Trasforma la proiezione fiscale in scadenze e decisioni mensili piu sicure.
                </p>
              </div>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard padding="lg" class="app-login__panel rounded-[2rem] fade-up fade-up-2">
          <div class="ui-form-stack app-login__panel-stack">
            <div>
              <p class="label-xs">Accesso protetto</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                Entra in Chiaro.
              </h2>
              <p class="app-page-copy mt-3">
                Accesso riservato all'email autorizzata. Google viene usato solo per semplificare
                l'ingresso e mantenere il prodotto in un perimetro personale.
              </p>
            </div>

            <SurfaceCard variant="soft" padding="md">
              <div class="ui-form-stack">
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Target</span>
                  <span class="ui-kv-row__value text-[var(--text-primary)]">Freelance in forfettario</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Focus</span>
                  <span class="ui-kv-row__value text-[var(--accent-text)]">Netto reale</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Modalita</span>
                  <span class="ui-kv-row__value text-[var(--info)]">Uso personale</span>
                </div>
              </div>
            </SurfaceCard>

            <UButton
              block
              size="lg"
              color="neutral"
              variant="soft"
              class="app-login__button app-login__button--google ui-action-button"
              :loading="loading"
              @click="signInWithGoogle"
            >
              <span class="app-login__button-icon">
                <UIcon name="logos:google-icon" class="w-5 h-5" />
              </span>
              <span class="ml-2">Accedi con Google</span>
            </UButton>

            <p class="app-login__note">
              Dopo l'accesso trovi dashboard, modello fiscale e costi d'appoggio nello stesso ambiente.
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
