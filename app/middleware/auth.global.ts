export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const { loggedIn, fetch: fetchSession } = useUserSession()
  const { currentUser, refresh, clear } = useCurrentUser()

  if (!process.dev) {
    await fetchSession()

    if (!loggedIn.value) {
      clear()
      return navigateTo('/login')
    }
  }

  try {
    await refresh(!currentUser.value)
  } catch {
    clear()

    if (!process.dev)
      return navigateTo('/login')
  }

  if (!currentUser.value)
    return

  if (!currentUser.value.onboardingCompleted && to.path !== '/onboarding')
    return navigateTo('/onboarding')

  if (currentUser.value.onboardingCompleted && to.path === '/onboarding') {
    return navigateTo('/')
  }
})
