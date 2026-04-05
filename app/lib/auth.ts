import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { prisma } from '~/server/utils/prisma'
import { isEmailAllowed } from '~/server/utils/auth-allowlist'

function requireEnv(value: string | undefined, names: string) {
  const normalized = value?.trim()
  if (normalized)
    return normalized

  throw new Error(`[auth] Missing required environment variable: ${names}`)
}

function getOriginFromUrl(rawUrl: string) {
  try {
    return new URL(rawUrl).origin
  } catch {
    throw new Error(`[auth] BETTER_AUTH_URL is not a valid URL: ${rawUrl}`)
  }
}

const betterAuthUrl = requireEnv(process.env.BETTER_AUTH_URL, 'BETTER_AUTH_URL')
const betterAuthSecret = requireEnv(process.env.BETTER_AUTH_SECRET, 'BETTER_AUTH_SECRET')
const googleClientId = requireEnv(
  process.env.GOOGLE_CLIENT_ID ?? process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_ID or NUXT_OAUTH_GOOGLE_CLIENT_ID',
)
const googleClientSecret = requireEnv(
  process.env.GOOGLE_CLIENT_SECRET ?? process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
  'GOOGLE_CLIENT_SECRET or NUXT_OAUTH_GOOGLE_CLIENT_SECRET',
)
const betaAllowlist = process.env.BETA_ALLOWLIST ?? process.env.ALLOWED_EMAIL
const configuredAuthOrigin = getOriginFromUrl(betterAuthUrl)

export const auth = betterAuth({
  appName: 'Chiaro',
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  trustedOrigins: [configuredAuthOrigin],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    usePlural: false,
  }),
  advanced: {
    database: {
      generateId: 'serial',
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      scope: ['email', 'profile'],
    },
  },
  user: {
    modelName: 'user',
    fields: {
      image: 'picture',
      emailVerified: 'emailVerified',
    },
  },
  session: {
    modelName: 'session',
  },
  account: {
    modelName: 'account',
  },
  verification: {
    modelName: 'verification',
    fields: {
      token: 'token',
    },
  },
  hooks: {
    before: [
      {
        matcher: ctx => ctx.path === '/sign-up/email' || ctx.path === '/sign-in/email',
        handler: async (ctx) => {
          const email = ctx.body?.email as string | undefined
          if (email && !isEmailAllowed(email, betaAllowlist)) {
            throw new APIError('FORBIDDEN', {
              message: 'Questo indirizzo non è abilitato per la beta.',
            })
          }
        },
      },
    ],
    after: [
      {
        matcher: ctx => ctx.path.startsWith('/callback/'),
        handler: async (ctx) => {
          const email = ctx.context.session?.user?.email
          if (!email || isEmailAllowed(email, betaAllowlist))
            return

          await auth.api.signOut({
            headers: ctx.headers,
          }).catch(() => undefined)

          return ctx.redirect('/login?error=unauthorized_email')
        },
      },
    ],
  },
})
