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
          {{ success ? 'Password aggiornata.' : 'Nuova password.' }}
        </h1>
      </div>

      <SurfaceCard padding="lg" class="app-login__panel">
        <div class="ui-form-stack app-login__panel-stack">
          <template v-if="success">
            <p class="text-sm leading-6 text-[var(--text-primary)]">
              La tua password è stata aggiornata. Ora puoi accedere.
            </p>
            <p class="app-login__note">
              <NuxtLink to="/login" class="app-login__toggle">Vai al login</NuxtLink>
            </p>
          </template>

          <template v-else-if="tokenError">
            <SurfaceCard variant="soft" padding="sm">
              <p class="text-sm leading-6 text-[var(--danger-text)]">
                Il link non è valido o è scaduto.
              </p>
            </SurfaceCard>
            <p class="app-login__note">
              <NuxtLink to="/forgot-password" class="app-login__toggle">Richiedi un nuovo link</NuxtLink>
            </p>
          </template>

          <template v-else>
            <SurfaceCard v-if="formError" variant="soft" padding="sm">
              <p class="text-sm leading-6 text-[var(--danger-text)]">{{ formError }}</p>
            </SurfaceCard>

            <form class="ui-form-stack" @submit.prevent="handleSubmit">
              <div>
                <label class="ui-field-label label-xs" for="new-password">Nuova password</label>
                <input
                  id="new-password"
                  v-model="password"
                  type="password"
                  class="ui-input-base"
                  placeholder="Almeno 8 caratteri"
                  autocomplete="new-password"
                  minlength="8"
                  required
                >
              </div>
              <div>
                <label class="ui-field-label label-xs" for="confirm-password">Conferma password</label>
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  class="ui-input-base"
                  placeholder="Ripeti la password"
                  autocomplete="new-password"
                  minlength="8"
                  required
                >
              </div>
              <UButton
                type="submit"
                block
                size="lg"
                color="primary"
                class="app-login__button ui-action-button"
                :loading="loading"
              >
                Salva nuova password
              </UButton>
            </form>

            <p class="app-login__note">
              <NuxtLink to="/login" class="app-login__toggle">Torna al login</NuxtLink>
            </p>
          </template>
        </div>
      </SurfaceCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: false })

const route = useRoute()
const colorMode = useColorMode()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const formError = ref('')

const token = computed(() => {
  const t = route.query.token
  return typeof t === 'string' && t.length > 0 ? t : ''
})

const tokenError = computed(() => {
  return !token.value || route.query.error === 'INVALID_TOKEN'
})

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

async function handleSubmit() {
  formError.value = ''

  if (password.value !== confirmPassword.value) {
    formError.value = 'Le password non corrispondono.'
    return
  }

  loading.value = true
  try {
    const { error } = await authClient.resetPassword({
      newPassword: password.value,
      token: token.value,
    })
    if (error) {
      formError.value = error.message || 'Impossibile reimpostare la password. Il link potrebbe essere scaduto.'
      return
    }
    success.value = true
  }
  catch {
    formError.value = 'Si è verificato un errore. Riprova.'
  }
  finally {
    loading.value = false
  }
}
</script>
