import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const id = parseInt(getRouterParam(event, 'id') as string)

  if (event.method === 'DELETE') {
    const existing = await prisma.entry.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existing)
      throw createError({ statusCode: 404, statusMessage: 'Entry not found.' })

    await prisma.entry.delete({ where: { id } })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'entry.deleted',
      entityType: 'entry',
      entityId: String(id),
      payload: {
        date: existing.date.toISOString(),
        type: existing.type,
      },
    })

    return { success: true }
  }

  if (event.method === 'PATCH') {
    const body = await readBody(event)
    const existing = await prisma.entry.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existing)
      throw createError({ statusCode: 404, statusMessage: 'Entry not found.' })

    const entry = await prisma.entry.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        type: body.type,
        hours: body.hours ? parseFloat(body.hours) : null,
        amount: body.amount ? parseFloat(body.amount) : null,
        description: body.description || null,
      },
    })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'entry.updated',
      entityType: 'entry',
      entityId: String(entry.id),
      payload: {
        previousType: existing.type,
        nextType: entry.type,
        date: entry.date.toISOString(),
      },
    })

    return entry
  }
})
