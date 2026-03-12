import { isEmailAllowed, requireAppUser } from '~/server/utils/users'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig()

    if (!isEmailAllowed(user.email, config.betaAllowlist)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: Your email is not authorized for this beta.',
      })
    }

    await setUserSession(event, {
      user: {
        id: '',
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    })

    await requireAppUser(event)

    return sendRedirect(event, '/')
  },
  
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=auth_failed')
  },
})
