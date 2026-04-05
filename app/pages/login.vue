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
          {{ signupComplete ? 'Controlla la tua email.' : isSignUp ? 'Crea il tuo account.' : 'Accedi al tuo spazio.' }}
        </h1>
      </div>

      <SurfaceCard padding="lg" class="app-login__panel">
        <div class="ui-form-stack app-login__panel-stack">
          <template v-if="signupComplete">
            <p class="text-sm leading-6 text-[var(--text-secondary)]">
              Ti abbiamo inviato un'email di verifica a <strong class="text-[var(--text-primary)]">{{ signupEmail }}</strong>.
              Clicca il link nell'email per confermare il tuo indirizzo.
            </p>
            <UButton
              block
              size="lg"
              color="neutral"
              variant="outline"
              class="ui-action-button"
              :loading="resendLoading"
              @click="resendVerification"
            >
              Reinvia email di verifica
            </UButton>
            <p class="app-login__note">
              <button type="button" class="app-login__toggle" @click="backToLogin">
                Torna al login
              </button>
            </p>
          </template>

          <template v-else>
            <SurfaceCard v-if="route.query.verified === 'true'" variant="soft" padding="sm">
              <p class="text-sm leading-6" style="color: var(--accent-text);">
                Email verificata. Ora puoi accedere.
              </p>
            </SurfaceCard>

            <SurfaceCard v-if="errorMessage" variant="soft" padding="sm">
              <div class="ui-form-stack" style="gap: 0.35rem;">
                <p class="label-xs text-[var(--danger-text)]">
                  {{ isSignUp ? 'Registrazione non riuscita' : 'Accesso non riuscito' }}
                </p>
                <p class="text-sm leading-6 text-[var(--text-primary)]">
                  {{ errorMessage }}
                </p>
              </div>
            </SurfaceCard>

            <form class="ui-form-stack" @submit.prevent="handleEmailAuth">
              <div v-if="isSignUp">
                <label class="ui-field-label label-xs" for="auth-name">Nome</label>
                <input
                  id="auth-name"
                  v-model="form.name"
                  type="text"
                  class="ui-input-base"
                  placeholder="Il tuo nome"
                  autocomplete="name"
                  required
                >
              </div>
              <div>
                <label class="ui-field-label label-xs" for="auth-email">Email</label>
                <input
                  id="auth-email"
                  v-model="form.email"
                  type="email"
                  class="ui-input-base"
                  placeholder="tu@esempio.it"
                  autocomplete="email"
                  required
                >
              </div>
              <div>
                <label class="ui-field-label label-xs" for="auth-password">Password</label>
                <input
                  id="auth-password"
                  v-model="form.password"
                  type="password"
                  class="ui-input-base"
                  :placeholder="isSignUp ? 'Almeno 8 caratteri' : 'La tua password'"
                  :autocomplete="isSignUp ? 'new-password' : 'current-password'"
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
                :loading="emailLoading"
              >
                {{ isSignUp ? 'Crea account' : 'Accedi' }}
              </UButton>
            </form>

            <div v-if="!isSignUp" style="text-align: right; margin-top: -0.5rem;">
              <NuxtLink to="/forgot-password" class="app-login__toggle" style="font-size: 0.78rem;">
                Password dimenticata?
              </NuxtLink>
            </div>

            <div v-if="googleAuthEnabled" class="app-login__divider">
              <span class="app-login__divider-text">oppure</span>
            </div>

            <UButton
              v-if="googleAuthEnabled"
              block
              size="lg"
              color="neutral"
              variant="outline"
              class="app-login__button--google ui-action-button"
              :loading="googleLoading"
              @click="signInWithGoogle"
            >
              <span class="app-login__button-icon">
                <UIcon name="logos:google-icon" class="w-5 h-5" />
              </span>
              <span class="ml-2">Continua con Google</span>
            </UButton>

            <p class="app-login__note">
              <template v-if="isSignUp">
                Hai già un account?
                <button type="button" class="app-login__toggle" @click="switchMode(false)">Accedi</button>
              </template>
              <template v-else>
                Non hai un account?
                <button type="button" class="app-login__toggle" @click="switchMode(true)">Crea account</button>
              </template>
            </p>
          </template>
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
const router = useRouter()
const colorMode = useColorMode()
const runtimeConfig = useRuntimeConfig()
const emailLoading = ref(false)
const googleLoading = ref(false)
const resendLoading = ref(false)
const isSignUp = ref(false)
const signupComplete = ref(false)
const signupEmail = ref('')
const formError = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const errorMessage = computed(() => {
  if (formError.value)
    return formError.value

  const error = route.query.error
  if (error === 'unauthorized_email')
    return 'Questo indirizzo non è abilitato per la beta.'
  if (error === 'auth_failed')
    return 'L\'accesso non è andato a buon fine. Riprova tra qualche secondo.'
  if (typeof error === 'string' && error.length > 0)
    return 'Non sono riuscito a completare l\'accesso. Riprova.'
  return ''
})

const googleAuthEnabled = computed(() => Boolean(runtimeConfig.public.googleAuthEnabled))

function getCallbackUrl(path: string) {
  const configuredBase = `${runtimeConfig.public.betterAuthUrl || ''}`.trim().replace(/\/$/, '')
  const origin = configuredBase || window.location.origin
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalizedPath}`
}

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

function switchMode(signUp: boolean) {
  isSignUp.value = signUp
  formError.value = ''
  signupComplete.value = false
  if (route.query.error || route.query.verified)
    router.replace({ query: {} })
}

function backToLogin() {
  signupComplete.value = false
  isSignUp.value = false
  formError.value = ''
}

async function handleEmailAuth() {
  formError.value = ''
  emailLoading.value = true

  try {
    if (isSignUp.value) {
      const { error } = await authClient.signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
        callbackURL: getCallbackUrl('/login?verified=true'),
      })
      if (error) {
        formError.value = error.message || 'Registrazione non riuscita.'
        return
      }
      signupEmail.value = form.email
      signupComplete.value = true
      return
    }
    else {
      const { error } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
      })
      if (error) {
        formError.value = error.message || 'Credenziali non valide.'
        return
      }
    }
    await navigateTo('/app')
  }
  catch {
    formError.value = 'Si è verificato un errore imprevisto. Riprova.'
  }
  finally {
    emailLoading.value = false
  }
}

async function resendVerification() {
  if (!signupEmail.value)
    return
  resendLoading.value = true
  try {
    await authClient.sendVerificationEmail({
      email: signupEmail.value,
      callbackURL: getCallbackUrl('/login?verified=true'),
    })
  }
  catch {
    // Silent — Better Auth doesn't reveal user existence
  }
  finally {
    resendLoading.value = false
  }
}

async function signInWithGoogle() {
  try {
    googleLoading.value = true
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: getCallbackUrl('/app'),
      errorCallbackURL: getCallbackUrl('/login?error=auth_failed'),
    })
  }
  finally {
    googleLoading.value = false
  }
}
</script>
