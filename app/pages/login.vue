<template>
  <div class="app-login app-page app-page--login">
    <button type="button" class="app-login__theme-toggle" @click="toggleColorMode">
      <UIcon :name="colorMode.preference === 'dark' ? 'lucide:sun-medium' : 'lucide:moon-star'" class="w-4 h-4" />
    </button>

    <div class="app-login__container">
      <div class="app-login__header">
        <NuxtLink to="/" class="app-login__brand">
          <div class="app-brand-mark">
            <span class="app-brand-mark__letter">C</span>
          </div>
          <p class="app-brand-title">Chiaro</p>
        </NuxtLink>

        <h1 class="app-login__title">
          Accedi al tuo spazio forfettario.
        </h1>
      </div>

      <SurfaceCard padding="lg" class="app-login__panel">
        <div class="ui-form-stack app-login__panel-stack">
          <SurfaceCard v-if="errorMessage" variant="soft" padding="sm">
            <div class="ui-form-stack">
              <p class="label-xs text-[var(--danger-text)]">Accesso non riuscito</p>
              <p class="text-sm leading-6 text-[var(--text-primary)]">
                {{ errorMessage }}
              </p>
            </div>
          </SurfaceCard>

          <UButton
            block
            size="lg"
            color="primary"
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
            Per freelance in regime forfettario.
          </p>
        </div>
      </SurfaceCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({
  layout: false,
})

const route = useRoute()
const colorMode = useColorMode()
const loading = ref(false)

const errorMessage = computed(() => {
  const error = route.query.error
  if (error === 'unauthorized_email')
    return 'Questo indirizzo non e abilitato per la beta.'
  if (error === 'auth_failed')
    return `L'accesso non e andato a buon fine. Riprova tra qualche secondo.`
  if (typeof error === 'string' && error.length > 0)
    return `Non sono riuscito a completare l'accesso. Riprova.`
  return ''
})

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

async function signInWithGoogle() {
  try {
    loading.value = true
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/app',
      errorCallbackURL: '/login?error=auth_failed',
    })
  }
  finally {
    loading.value = false
  }
}
</script>
