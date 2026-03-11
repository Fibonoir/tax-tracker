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
            Chiaro ti mostra ogni mese tre numeri: quanto hai incassato, quanto devi accantonare e
            quanto puoi davvero spendere.
          </p>

          <div class="app-grid-3 app-login__feature-grid mt-8">
            <SurfaceCard variant="soft" padding="sm" class="app-login__feature-card">
              <p class="label-xs">Registra</p>
              <p class="text-sm leading-6 text-[var(--text-primary)] mt-2">
                Registra ore e progetti con data, importo e una nota.
              </p>
            </SurfaceCard>

            <SurfaceCard variant="soft" padding="sm" class="app-login__feature-card">
              <p class="label-xs">Accantona</p>
              <p class="text-sm leading-6 text-[var(--text-primary)] mt-2">
                Vedi subito la differenza tra incassato, da accantonare e disponibile.
              </p>
            </SurfaceCard>

            <SurfaceCard variant="soft" padding="sm" class="app-login__feature-card">
              <p class="label-xs">Prevedi</p>
              <p class="text-sm leading-6 text-[var(--text-primary)] mt-2">
                Anticipa imposte, contributi e scadenze senza fare conti a mano.
              </p>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard padding="lg" class="app-login__panel rounded-[2rem] fade-up fade-up-2">
          <div class="ui-form-stack app-login__panel-stack">
            <div>
              <p class="label-xs">Accesso protetto</p>
              <h2 class="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
                Accedi al tuo spazio.
              </h2>
              <p class="app-page-copy mt-3">
                Solo l'email autorizzata puo entrare. Usiamo Google per rendere l'accesso rapido e
                tenere Chiaro in uno spazio personale.
              </p>
            </div>

            <SurfaceCard variant="soft" padding="md">
              <div class="ui-form-stack">
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Per chi</span>
                  <span class="ui-kv-row__value text-[var(--text-primary)]">Freelance in forfettario</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Ti mostra</span>
                  <span class="ui-kv-row__value text-[var(--accent-text)]">Quanto puoi spendere davvero</span>
                </div>
                <div class="ui-kv-row">
                  <span class="ui-kv-row__label">Accesso</span>
                  <span class="ui-kv-row__value text-[var(--info)]">Solo email autorizzata</span>
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
              Dopo l'accesso trovi incassi, stime fiscali e costi nello stesso posto.
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
