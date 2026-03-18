import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { isEmailAllowed } from '~/server/utils/auth-allowlist'

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET

export const auth = betterAuth({
  appName: 'Chiaro',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    usePlural: false,
  }),
  advanced: {
    database: {
      generateId: 'serial',
    },
  },
  socialProviders: {
    google: {
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
      scope: ['email', 'profile'],
    },
  },
  user: {
    modelName: 'User',
    fields: {
      image: 'picture',
      emailVerified: 'emailVerified',
    },
  },
  session: {
    modelName: 'Session',
  },
  account: {
    modelName: 'Account',
  },
  verification: {
    modelName: 'Verification',
    fields: {
      token: 'token',
    },
  },
  hooks: {
    after: [
      {
        matcher: ctx => ctx.path.startsWith('/callback/'),
        handler: async (ctx) => {
          const email = ctx.context.session?.user?.email
          if (!email || isEmailAllowed(email, process.env.BETA_ALLOWLIST))
            return

          await auth.api.signOut({
            headers: ctx.headers,
          })

          throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized: Your email is not authorized for this beta.',
          })
        },
      },
    ],
  },
})
