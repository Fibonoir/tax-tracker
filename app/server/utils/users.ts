import type { H3Event } from 'h3'
import type { User } from '../generated/prisma/client'
import { prisma } from './prisma'
import { createDefaultSettings } from './settings'

const DEV_USER_EMAIL = 'dev@chiaro.local'

type SessionLikeUser = {
  id?: string
  email?: string | null
  name?: string | null
  picture?: string | null
}

function getBypassEnabled() {
  return import.meta.dev && process.env.DEV_AUTH_BYPASS !== 'false'
}

function normalizeEmailList(raw: string | undefined) {
  return (raw ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string, rawAllowlist?: string) {
  const allowlist = normalizeEmailList(rawAllowlist)
  if (allowlist.length === 0)
    return true

  return allowlist.includes(email.trim().toLowerCase())
}

async function upsertUserFromSession(sessionUser: SessionLikeUser) {
  if (!sessionUser.email)
    throw createError({ statusCode: 401, statusMessage: 'Missing session email.' })

  return prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {
      name: sessionUser.name ?? undefined,
      picture: sessionUser.picture ?? undefined,
    },
    create: {
      email: sessionUser.email,
      name: sessionUser.name ?? undefined,
      picture: sessionUser.picture ?? undefined,
    },
  })
}

async function ensureDevUser() {
  return prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {
      name: 'Dev User',
    },
    create: {
      email: DEV_USER_EMAIL,
      name: 'Dev User',
      displayName: 'Dev User',
      taxYear: new Date().getFullYear(),
    },
  })
}

async function syncUserSession(event: H3Event, user: User, sessionUser?: SessionLikeUser) {
  const sessionData = {
    user: {
      id: String(user.id),
      email: user.email,
      name: sessionUser?.name ?? user.name,
      picture: sessionUser?.picture ?? user.picture,
    },
  }

  const session = await getUserSession(event)
  const sameUser = session.user?.id === sessionData.user.id
    && session.user?.email === sessionData.user.email
    && session.user?.name === sessionData.user.name
    && session.user?.picture === sessionData.user.picture

  if (!sameUser)
    await setUserSession(event, sessionData)
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
    await prisma.settings.upsert({
      where: { userId },
      update: {},
      create: createDefaultSettings(userId),
    })
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

export async function requireAppUser(event: H3Event) {
  if ((event.context as { currentUser?: User }).currentUser)
    return (event.context as { currentUser: User }).currentUser

  let user: User

  if (getBypassEnabled()) {
    user = await ensureDevUser()
  } else {
    const session = await getUserSession(event)
    if (!session.user?.email)
      throw createError({ statusCode: 401, statusMessage: 'Please login to access this resource.' })

    const sessionUser = session.user as SessionLikeUser
    user = await upsertUserFromSession(sessionUser)
    await syncUserSession(event, user, sessionUser)
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
