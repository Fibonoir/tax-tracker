<template>
  <div class="app-login app-page app-page--login">
    <div class="app-login__container">
      <div class="app-grid-2 app-login__layout">
        <div class="fade-up fade-up-1">
          <div class="app-login__header">
            <p class="label-xs">Accesso Chiaro</p>
            <h1 class="app-login__title">
              Non spendere soldi che non sono davvero tuoi.
            </h1>
            <p class="app-login__subtitle">
              Chiaro è costruito per il controllo mensile del denaro disponibile: pochi numeri,
              lettura chiara, nessuna sorpresa tra quello che entra e quello che puoi usare.
            </p>
          </div>

          <div class="app-grid-3 app-login__feature-grid mt-8">
            <SurfaceCard variant="soft" padding="sm" class="app-login__feature-card">
              <p class="label-xs">Leggi</p>
              <p class="text-sm leading-6 text-[var(--text-primary)] mt-2">
                Il mese parte dal disponibile reale, non dal saldo grezzo.
              </p>
            </SurfaceCard>

            <SurfaceCard variant="soft" padding="sm" class="app-login__feature-card">
              <p class="label-xs">Accantona</p>
              <p class="text-sm leading-6 text-[var(--text-primary)] mt-2">
                Tasse, INPS e costi vengono separati prima di fare le scelte.
              </p>
            </SurfaceCard>

            <SurfaceCard variant="soft" padding="sm" class="app-login__feature-card">
              <p class="label-xs">Decidi</p>
              <p class="text-sm leading-6 text-[var(--text-primary)] mt-2">
                Ogni numero importante è spiegato e resta leggibile.
              </p>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard padding="lg" class="app-login__panel rounded-[2rem] fade-up fade-up-2">
          <div class="ui-form-stack app-login__panel-stack">
            <div>
              <p class="label-xs">Accedi con Google</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                Entra nel tuo spazio.
              </h2>
              <p class="app-page-copy mt-3">
                L'accesso resta semplice: una sola identità, uno spazio personale, un flusso chiaro
                tra onboarding e controllo mensile.
              </p>
            </div>

            <SurfaceCard variant="soft" padding="md">
              <div class="ui-form-stack">
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Per chi</span>
                  <span class="ui-kv-row__value text-[var(--text-primary)]">Freelance in forfettario</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Focus</span>
                  <span class="ui-kv-row__value text-[var(--accent-text)]">Disponibile reale</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Esito</span>
                  <span class="ui-kv-row__value text-[var(--info)]">Dal setup al primo incasso</span>
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
              <span class="ml-2">Continua con Google</span>
            </UButton>

            <p class="app-login__note">
              Ti portiamo dentro il prodotto, poi ti facciamo leggere il mese senza confusione.
            </p>
          </div>
        </SurfaceCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({
  layout: false,
})

const loading = ref(false)

async function signInWithGoogle() {
  try {
    loading.value = true
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/app',
      errorCallbackURL: '/login?error=auth_failed',
    })
  } finally {
    loading.value = false
  }
}
</script>
