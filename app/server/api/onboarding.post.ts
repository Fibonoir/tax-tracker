import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { createDefaultSettings } from '~/server/utils/settings'
import { requireAppUser } from '~/server/utils/users'

type RecurringSeed = {
  name: string
  amount: number | string
  frequency: string
}

type OneTimeSeed = {
  name: string
  amount: number | string
  date: string
}

function parseNumber(value: unknown, fallback: number) {
  if (value === '' || value === null || value === undefined)
    return fallback

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeText(value: unknown) {
  if (typeof value !== 'string')
    return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const body = await readBody(event)

  const profileOnly = body.profileOnly === true
  const shouldMarkOnboardingCompleted = !profileOnly && body.markOnboardingCompleted !== false
  const recurringPayments = Array.isArray(body.recurringPayments) ? body.recurringPayments as RecurringSeed[] : []
  const oneTimePayments = Array.isArray(body.oneTimePayments) ? body.oneTimePayments as OneTimeSeed[] : []
  const replacePayments = body.replacePayments === true
  const now = new Date()

  if (profileOnly) {
    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        displayName: normalizeText(body.displayName) ?? currentUser.displayName ?? currentUser.name,
        activityLabel: normalizeText(body.activityLabel),
        atecoCode: normalizeText(body.atecoCode),
        atecoLabel: normalizeText(body.atecoLabel),
        taxYear: parseNumber(body.taxYear, currentUser.taxYear ?? now.getFullYear()),
      },
    })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'profile.updated',
      entityType: 'user',
      entityId: String(currentUser.id),
      payload: {
        displayName: user.displayName,
        activityLabel: user.activityLabel,
        atecoCode: user.atecoCode,
        atecoLabel: user.atecoLabel,
        taxYear: user.taxYear,
      },
    })

    return {
      success: true,
      profileOnly: true,
    }
  }

  const existingSettings = await prisma.settings.findFirst({
    where: { userId: currentUser.id },
    orderBy: { updatedAt: 'desc' },
  })

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: currentUser.id },
      data: {
        displayName: normalizeText(body.displayName) ?? currentUser.displayName ?? currentUser.name,
        activityLabel: normalizeText(body.activityLabel),
        atecoCode: normalizeText(body.atecoCode),
        atecoLabel: normalizeText(body.atecoLabel),
        taxYear: parseNumber(body.taxYear, currentUser.taxYear ?? now.getFullYear()),
        startupRate: parseNumber(body.startupRate, currentUser.startupRate ?? existingSettings?.irpefRate ?? 0.15),
        onboardingCompletedAt: shouldMarkOnboardingCompleted ? now : currentUser.onboardingCompletedAt,
      },
    })

    const settingsPayload = {
      hourlyRate: parseNumber(body.hourlyRate, existingSettings?.hourlyRate ?? 30),
      coefficiente: parseNumber(body.coefficiente, existingSettings?.coefficiente ?? 0.67),
      irpefRate: parseNumber(body.startupRate, existingSettings?.irpefRate ?? 0.15),
      inpsType: body.inpsType === 'ARTIGIANI' ? 'ARTIGIANI' : 'GESTIONE_SEPARATA',
      inpsRate: parseNumber(body.inpsRate, existingSettings?.inpsRate ?? 0.2607),
      inpsFixedAnnual: parseNumber(body.inpsFixedAnnual, existingSettings?.inpsFixedAnnual ?? 0),
      inpsMinimaleThreshold: parseNumber(body.inpsMinimaleThreshold, existingSettings?.inpsMinimaleThreshold ?? 18808),
      inpsExcessRate: parseNumber(body.inpsExcessRate, existingSettings?.inpsExcessRate ?? 0.156),
      accountantAnnual: parseNumber(body.accountantAnnual, existingSettings?.accountantAnnual ?? 300),
    }

    const settings = existingSettings
      ? await tx.settings.update({
          where: { id: existingSettings.id },
          data: settingsPayload,
        })
      : await tx.settings.create({
          data: {
            ...createDefaultSettings(currentUser.id),
            ...settingsPayload,
          },
        })

    if (replacePayments) {
      await tx.recurringPayment.deleteMany({ where: { userId: currentUser.id } })
      await tx.oneTimePayment.deleteMany({ where: { userId: currentUser.id } })
    }

    if (recurringPayments.length > 0) {
      await tx.recurringPayment.createMany({
        data: recurringPayments
          .filter(payment => payment.name && Number(payment.amount) > 0)
          .map(payment => ({
            userId: currentUser.id,
            name: payment.name,
            amount: Number(payment.amount),
            frequency: payment.frequency,
            active: true,
          })),
      })
    }

    if (oneTimePayments.length > 0) {
      await tx.oneTimePayment.createMany({
        data: oneTimePayments
          .filter(payment => payment.name && Number(payment.amount) > 0 && payment.date)
          .map(payment => ({
            userId: currentUser.id,
            name: payment.name,
            amount: Number(payment.amount),
            date: new Date(payment.date),
          })),
      })
    }

    return { user, settings }
  })

  if (shouldMarkOnboardingCompleted) {
    await logAuditEvent({
      userId: currentUser.id,
      action: 'onboarding.completed',
      entityType: 'user',
      entityId: String(currentUser.id),
      payload: {
        displayName: result.user.displayName,
        activityLabel: result.user.activityLabel,
        taxYear: result.user.taxYear,
        startupRate: result.user.startupRate,
      },
    })
  }

  return {
    success: true,
    onboardingCompletedAt: result.user.onboardingCompletedAt,
  }
})
