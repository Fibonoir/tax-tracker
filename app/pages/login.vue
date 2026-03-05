<template>
  <div class="min-h-screen flex items-center justify-center bg-revolut-black light:bg-revolut-light-bg px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-12">
        <div class="inline-flex w-16 h-16 rounded-3xl bg-linear-to-br from-revolut-green to-revolut-green-dark items-center justify-center mb-6 shadow-lg shadow-revolut-green/20">
          <UIcon name="lucide:receipt-euro" class="w-8 h-8 text-white" />
        </div>
        <h1 class="font-display text-3xl font-bold text-revolut-text light:text-revolut-light-text mb-2">Fattura Tracker</h1>
        <p class="text-revolut-muted text-sm">Monitora il reddito e le tasse da freelance</p>
      </div>

      <div class="bg-revolut-dark light:bg-white rounded-3xl border border-revolut-border light:border-revolut-light-border p-8">
        <UButton
          block
          size="lg"
          variant="solid"
          color="primary"
          class="rounded-2xl font-semibold"
          @click="signInWithGoogle"
          :loading="loading"
        >
          <UIcon name="logos:google-icon" class="w-5 h-5" />
          <span class="ml-2">Accedi con Google</span>
        </UButton>

        <p class="text-xs text-center text-revolut-muted mt-6">
          Modalità utente singolo. Solo l'email autorizzata può accedere.
        </p>
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
