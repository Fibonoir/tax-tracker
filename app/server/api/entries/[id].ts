import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { requireAppUser } from '~/server/utils/users'

function parseStoredDate(value: unknown) {
  if (typeof value !== 'string')
    return undefined

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day)
    return undefined

  return new Date(year, month - 1, day)
}

function parseCompetenceDate(value: unknown) {
  if (value === '' || value === null || value === undefined)
    return null

  if (typeof value !== 'string')
    return undefined

  const parts = value.split('-').map(Number)
  if (parts.length < 2 || !parts[0] || !parts[1])
    return undefined

  return new Date(parts[0], parts[1] - 1, 1)
}

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
        date: body.date ? (parseStoredDate(body.date) ?? new Date(body.date)) : undefined,
        competenceDate: parseCompetenceDate(body.competenceMonth),
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
        competenceDate: entry.competenceDate?.toISOString() ?? null,
      },
    })

    return entry
  }
})
