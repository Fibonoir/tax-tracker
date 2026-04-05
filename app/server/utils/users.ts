import type { H3Event } from 'h3'
import type { User } from '../generated/prisma/client'
import { auth } from '~/lib/auth'
import { prisma } from './prisma'
import { createDefaultSettings } from './settings'
import { isEmailAllowed } from './auth-allowlist'

const DEV_USER_EMAIL = 'dev@chiaro.local'
const betaAllowlist = process.env.BETA_ALLOWLIST ?? process.env.ALLOWED_EMAIL

type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>
type SessionLikeUser = BetterAuthSession extends { user: infer T } ? T : never

function getBypassEnabled() {
  return import.meta.dev && process.env.DEV_AUTH_BYPASS !== 'false'
}

async function syncUserFromSession(sessionUser: SessionLikeUser) {
  if (!sessionUser?.email)
    throw createError({ statusCode: 401, statusMessage: 'Missing session email.' })

  return prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {
      name: sessionUser.name ?? undefined,
      emailVerified: Boolean(sessionUser.emailVerified),
      picture: sessionUser.image ?? undefined,
    },
    create: {
      email: sessionUser.email,
      name: sessionUser.name ?? undefined,
      emailVerified: Boolean(sessionUser.emailVerified),
      picture: sessionUser.image ?? undefined,
    },
  })
}

async function ensureDevUser() {
  return prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {
      name: 'Dev User',
      emailVerified: true,
    },
    create: {
      email: DEV_USER_EMAIL,
      name: 'Dev User',
      emailVerified: true,
      displayName: 'Dev User',
      taxYear: new Date().getFullYear(),
    },
  })
}

async function claimLegacyData(userId: number) {
  const [userCount, hasScopedData, legacySettings, legacyEntries, legacyRecurring, legacyOnetime] = await Promise.all([
    prisma.user.count(),
    prisma.$transaction([
      prisma.settings.count({ where: { userId } }),
      prisma.entry.count({ where: { userId } }),
      prisma.recurringPayment.count({ where: { userId } }),
      prisma.oneTimePayment.count({ where: { userId } }),
    ]).then(result => result.some(count => count > 0)),
    prisma.settings.findFirst({
      where: { userId: null },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.entry.count({ where: { userId: null } }),
    prisma.recurringPayment.count({ where: { userId: null } }),
    prisma.oneTimePayment.count({ where: { userId: null } }),
  ])

  if (userCount !== 1 || hasScopedData)
    return

  const hasLegacyData = Boolean(legacySettings) || legacyEntries > 0 || legacyRecurring > 0 || legacyOnetime > 0
  if (!hasLegacyData) {
    const existing = await prisma.settings.findFirst({ where: { userId } })
    if (!existing)
      await prisma.settings.create({ data: createDefaultSettings(userId) })
    return
  }

  await prisma.$transaction(async (tx) => {
    if (legacySettings) {
      await tx.settings.update({
        where: { id: legacySettings.id },
        data: { userId },
      })
    } else {
      await tx.settings.create({ data: createDefaultSettings(userId) })
    }

    await tx.entry.updateMany({
      where: { userId: null },
      data: { userId },
    })

    await tx.recurringPayment.updateMany({
      where: { userId: null },
      data: { userId },
    })

    await tx.oneTimePayment.updateMany({
      where: { userId: null },
      data: { userId },
    })
  })
}

export async function getAuthSession(event: H3Event) {
  return auth.api.getSession({
    headers: event.headers,
  })
}

export async function requireAppUser(event: H3Event) {
  if ((event.context as { currentUser?: User }).currentUser)
    return (event.context as { currentUser: User }).currentUser

  let user: User

  if (getBypassEnabled()) {
    user = await ensureDevUser()
  } else {
    const session = await getAuthSession(event)
    if (!session?.user?.email)
      throw createError({ statusCode: 401, statusMessage: 'Please login to access this resource.' })

    if (!isEmailAllowed(session.user.email, betaAllowlist)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: Your email is not authorized for this beta.',
      })
    }

    user = await syncUserFromSession(session.user as SessionLikeUser)
  }

  await claimLegacyData(user.id)
  ;(event.context as { currentUser?: User }).currentUser = user

  return user
}

export async function getOptionalAppUser(event: H3Event) {
  try {
    return await requireAppUser(event)
  } catch {
    return null
  }
}
