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
    const existing = await prisma.settings.findFirst({
      where: { userId: currentUser.id },
      orderBy: { updatedAt: 'desc' },
    })

    const payload = {
      hourlyRate: body.hourlyRate,
      coefficiente: body.coefficiente,
      irpefRate: body.irpefRate,
      inpsType: body.inpsType,
      inpsRate: body.inpsRate,
      inpsFixedAnnual: body.inpsFixedAnnual,
      inpsMinimaleThreshold: body.inpsMinimaleThreshold,
      inpsExcessRate: body.inpsExcessRate,
      accountantAnnual: body.accountantAnnual,
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
      },
    })

    return settings
  }
})
