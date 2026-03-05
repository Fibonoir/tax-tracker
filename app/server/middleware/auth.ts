export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (path.startsWith('/api/')) {
    if (import.meta.dev && process.env.DEV_AUTH_BYPASS !== 'false') {
      return
    }

    const session = await getUserSession(event)

    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Please login to access this resource.',
      })
    }
  }
})
