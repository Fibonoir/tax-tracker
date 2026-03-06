<template>
  <div class="app-login">
    <div class="app-login__container">
      <div class="app-login__header">
        <div class="app-login__brand">
          <UIcon name="lucide:receipt-euro" class="w-8 h-8 text-white" />
        </div>
        <h1 class="app-login__title">Fattura Tracker</h1>
        <p class="app-login__subtitle">Monitora il reddito e le tasse da freelance</p>
      </div>

      <SurfaceCard variant="default" padding="lg" class="rounded-3xl">
        <UButton
          block
          size="lg"
          variant="solid"
          color="primary"
          class="app-login__button"
          :loading="loading"
          @click="signInWithGoogle"
        >
          <UIcon name="logos:google-icon" class="w-5 h-5" />
          <span class="ml-2">Accedi con Google</span>
        </UButton>

        <p class="app-login__note">
          Modalità utente singolo. Solo l'email autorizzata può accedere.
        </p>
      </SurfaceCard>
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
