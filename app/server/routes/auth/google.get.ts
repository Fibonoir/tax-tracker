export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig()
    const allowedEmail = config.allowedEmail

    if (allowedEmail && user.email !== allowedEmail) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: Your email is not authorized to access this application.',
      })
    }

    await setUserSession(event, {
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    })

    return sendRedirect(event, '/')
  },
  
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=auth_failed')
  },
})
