export function useBilling() {
  const loading = ref(false)
  const toast = useToast()

  async function startCheckout(planTier: 'CORE_CLARITY' | 'PLANNING_SCENARIOS') {
    loading.value = true
    try {
      const response = await $fetch<{ url?: string | null }>('/api/billing/checkout', {
        method: 'POST',
        body: { planTier },
      })

      if (!response.url) {
        throw new Error('Missing checkout URL')
      }

      await navigateTo(response.url, { external: true })
    } catch {
      toast.add({
        title: 'Non sono riuscito ad aprire il checkout. Riprova tra un momento.',
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  async function openPortal() {
    loading.value = true
    try {
      const response = await $fetch<{ url?: string | null }>('/api/billing/portal', {
        method: 'POST',
      })

      if (!response.url) {
        throw new Error('Missing portal URL')
      }

      await navigateTo(response.url, { external: true })
    } catch {
      toast.add({
        title: 'Non sono riuscito ad aprire il portale abbonamenti. Riprova tra un momento.',
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    startCheckout,
    openPortal,
  }
}
