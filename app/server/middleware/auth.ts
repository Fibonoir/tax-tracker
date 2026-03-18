import { auth } from '~/lib/auth'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const guardedPrefixes = [
    '/api/me',
    '/api/onboarding',
    '/api/entries',
    '/api/settings',
    '/api/payments',
    '/api/summary',
    '/api/billing/checkout',
    '/api/billing/portal',
  ]

  if (path.startsWith('/api/auth/') || path === '/api/billing/webhook')
    return

  if (guardedPrefixes.some(prefix => path.startsWith(prefix))) {
    if (import.meta.dev && process.env.DEV_AUTH_BYPASS !== 'false') {
      return
    }

    const session = await auth.api.getSession({
      headers: event.headers,
    })

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Please login to access this resource.',
      })
    }
  }
})
