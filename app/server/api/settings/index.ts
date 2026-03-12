import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { createDefaultSettings } from '~/server/utils/settings'
import { getSettings } from '~/server/utils/taxes'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)

  if (event.method === 'GET') {
    return getSettings(currentUser.id)
  }

  if (event.method === 'PUT') {
    const body = await readBody(event)

    const settings = await prisma.settings.upsert({
      where: { userId: currentUser.id },
      update: {
        hourlyRate: body.hourlyRate,
        coefficiente: body.coefficiente,
        irpefRate: body.irpefRate,
        inpsType: body.inpsType,
        inpsRate: body.inpsRate,
        inpsFixedAnnual: body.inpsFixedAnnual,
        inpsMinimaleThreshold: body.inpsMinimaleThreshold,
        inpsExcessRate: body.inpsExcessRate,
        accountantAnnual: body.accountantAnnual,
      },
      create: {
        ...createDefaultSettings(currentUser.id),
        hourlyRate: body.hourlyRate,
        coefficiente: body.coefficiente,
        irpefRate: body.irpefRate,
        inpsType: body.inpsType,
        inpsRate: body.inpsRate,
        inpsFixedAnnual: body.inpsFixedAnnual,
        inpsMinimaleThreshold: body.inpsMinimaleThreshold,
        inpsExcessRate: body.inpsExcessRate,
        accountantAnnual: body.accountantAnnual,
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
      },
    })

    return settings
  }
})
