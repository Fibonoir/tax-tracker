import { auth } from '~/lib/auth'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (path.startsWith('/api/auth/') || path === '/api/billing/webhook')
    return

  if (path.startsWith('/api/')) {
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
