import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { createDefaultSettings } from '~/server/utils/settings'
import { getSettings } from '~/server/utils/taxes'
import { requireAppUser } from '~/server/utils/users'

function parseNumber(value: unknown, fallback = 0) {
  if (value === '' || value === null || value === undefined)
    return fallback

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseNullableNumber(value: unknown) {
  if (value === '' || value === null || value === undefined)
    return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeProjectionMode(value: unknown) {
  if (value === 'EXPECTED_MONTHLY_GROSS' || value === 'EXPECTED_MONTHLY_HOURS')
    return value

  return 'ACTUAL_AVERAGE'
}

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)

  if (event.method === 'GET') {
    return getSettings(currentUser.id)
  }

  if (event.method === 'PUT') {
    const body = await readBody(event)
    const existing = await prisma.settings.findFirst({
      where: { userId: currentUser.id },
      orderBy: { updatedAt: 'desc' },
    })

    const payload = {
      hourlyRate: parseNumber(body.hourlyRate, existing?.hourlyRate ?? 30),
      coefficiente: parseNumber(body.coefficiente, existing?.coefficiente ?? 0.67),
      irpefRate: parseNumber(body.irpefRate, existing?.irpefRate ?? 0.15),
      inpsType: body.inpsType,
      inpsRate: parseNumber(body.inpsRate, existing?.inpsRate ?? 0.2607),
      inpsFixedAnnual: parseNumber(body.inpsFixedAnnual, existing?.inpsFixedAnnual ?? 0),
      inpsMinimaleThreshold: parseNumber(body.inpsMinimaleThreshold, existing?.inpsMinimaleThreshold ?? 18808),
      inpsExcessRate: parseNumber(body.inpsExcessRate, existing?.inpsExcessRate ?? 0.156),
      accountantAnnual: parseNumber(body.accountantAnnual, existing?.accountantAnnual ?? 300),
      projectionStartMonth: parseNullableNumber(body.projectionStartMonth),
      projectionMode: normalizeProjectionMode(body.projectionMode),
      projectionMonthlyHours: parseNullableNumber(body.projectionMonthlyHours),
      projectionMonthlyGross: parseNullableNumber(body.projectionMonthlyGross),
      applyBollo: Boolean(body.applyBollo),
      bolloAmount: parseNumber(body.bolloAmount, existing?.bolloAmount ?? 2),
    }

    const settings = existing
      ? await prisma.settings.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.settings.create({
          data: {
            ...createDefaultSettings(currentUser.id),
            ...payload,
          },
        })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'settings.updated',
      entityType: 'settings',
      entityId: String(settings.id),
      payload: {
        hourlyRate: settings.hourlyRate,
        coefficiente: settings.coefficiente,
        irpefRate: settings.irpefRate,
        inpsType: settings.inpsType,
        projectionMode: settings.projectionMode,
      },
    })

    return settings
  }
})
