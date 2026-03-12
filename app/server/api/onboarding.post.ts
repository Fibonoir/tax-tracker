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

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const body = await readBody(event)

  const recurringPayments = Array.isArray(body.recurringPayments) ? body.recurringPayments as RecurringSeed[] : []
  const oneTimePayments = Array.isArray(body.oneTimePayments) ? body.oneTimePayments as OneTimeSeed[] : []
  const replacePayments = body.replacePayments !== false
  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: currentUser.id },
      data: {
        displayName: body.displayName || currentUser.displayName || currentUser.name,
        activityLabel: body.activityLabel || null,
        atecoCode: body.atecoCode || null,
        atecoLabel: body.atecoLabel || null,
        taxYear: Number(body.taxYear) || now.getFullYear(),
        startupRate: Number(body.startupRate) || 0.15,
        onboardingCompletedAt: now,
      },
    })

    const existingSettings = await tx.settings.findFirst({
      where: { userId: currentUser.id },
      orderBy: { updatedAt: 'desc' },
    })

    const settingsPayload = {
      hourlyRate: Number(body.hourlyRate) || 30,
      coefficiente: Number(body.coefficiente) || 0.67,
      irpefRate: Number(body.startupRate) || 0.15,
      inpsType: body.inpsType || 'GESTIONE_SEPARATA',
      inpsRate: Number(body.inpsRate) || 0.2607,
      inpsFixedAnnual: Number(body.inpsFixedAnnual) || 0,
      inpsMinimaleThreshold: Number(body.inpsMinimaleThreshold) || 18808,
      inpsExcessRate: Number(body.inpsExcessRate) || 0.156,
      accountantAnnual: Number(body.accountantAnnual) || 300,
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

  return {
    success: true,
    onboardingCompletedAt: result.user.onboardingCompletedAt,
  }
})
