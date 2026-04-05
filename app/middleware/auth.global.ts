export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { session, loggedIn, refresh: refreshSession, clear: clearSession } = useAuthState()
  const { currentUser, refresh, clear } = useCurrentUser()
  const isPublicRoute = to.path === '/' || to.path === '/login' || to.path === '/pricing' || to.path === '/forgot-password' || to.path === '/reset-password'
  const requiresAuth = to.path === '/onboarding' || to.path.startsWith('/app')

  try {
    await refreshSession(!session.value)
  } catch {
    clearSession()
  }

  if (!loggedIn.value) {
    clear()

    if (requiresAuth)
      return navigateTo('/login')

    return
  }

  try {
    await refresh(!currentUser.value)
  } catch {
    clear()
    clearSession()

    if (requiresAuth)
      return navigateTo('/login')
  }

  if (!currentUser.value)
    return

  if (to.path === '/login')
    return navigateTo(currentUser.value.onboardingCompleted ? '/app' : '/onboarding')

  if (!currentUser.value.onboardingCompleted && requiresAuth && to.path !== '/onboarding')
    return navigateTo('/onboarding')

  if (currentUser.value.onboardingCompleted && to.path === '/onboarding') {
    return navigateTo('/app')
  }

  if (isPublicRoute)
    return
})
