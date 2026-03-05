export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const { loggedIn } = useUserSession()

  if (process.dev) return

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
