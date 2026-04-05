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

        <h1 class="app-login__title">Reimposta la password.</h1>
      </div>

      <SurfaceCard padding="lg" class="app-login__panel">
        <div class="ui-form-stack app-login__panel-stack">
          <template v-if="sent">
            <p class="text-sm leading-6 text-[var(--text-primary)]">
              Se l'indirizzo è associato a un account, riceverai un'email con il link per reimpostare la password.
            </p>
            <p class="app-login__note">
              <NuxtLink to="/login" class="app-login__toggle">Torna al login</NuxtLink>
            </p>
          </template>

          <template v-else>
            <p class="text-sm leading-6 text-[var(--text-secondary)]">
              Inserisci il tuo indirizzo email e ti invieremo un link per scegliere una nuova password.
            </p>

            <SurfaceCard v-if="formError" variant="soft" padding="sm">
              <p class="text-sm leading-6 text-[var(--danger-text)]">{{ formError }}</p>
            </SurfaceCard>

            <form class="ui-form-stack" @submit.prevent="handleSubmit">
              <div>
                <label class="ui-field-label label-xs" for="reset-email">Email</label>
                <input
                  id="reset-email"
                  v-model="email"
                  type="email"
                  class="ui-input-base"
                  placeholder="tu@esempio.it"
                  autocomplete="email"
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
                Invia link di reset
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

const colorMode = useColorMode()
const email = ref('')
const loading = ref(false)
const sent = ref(false)
const formError = ref('')

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

async function handleSubmit() {
  formError.value = ''
  loading.value = true
  try {
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await authClient.requestPasswordReset({
      email: email.value,
      redirectTo,
    })
    if (error) {
      formError.value = error.message || 'Si è verificato un errore. Riprova.'
      return
    }
    sent.value = true
  }
  catch {
    sent.value = true
  }
  finally {
    loading.value = false
  }
}
</script>
