import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)

  if (event.method === 'GET') {
    const query = getQuery(event)
    const year = parseInt(query.year as string) || new Date().getFullYear()
    const month = query.month !== undefined ? parseInt(query.month as string) : undefined

    const where: any = {
      userId: currentUser.id,
      date: {
        gte: new Date(year, month !== undefined ? month : 0, 1),
        lt: month !== undefined ? new Date(year, month + 1, 1) : new Date(year + 1, 0, 1),
      },
    }

    return prisma.entry.findMany({ where, orderBy: { date: 'desc' } })
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const entry = await prisma.entry.create({
      data: {
        userId: currentUser.id,
        date: new Date(body.date),
        type: body.type,
        hours: body.hours ? parseFloat(body.hours) : null,
        amount: body.amount ? parseFloat(body.amount) : null,
        description: body.description || null,
      },
    })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'entry.created',
      entityType: 'entry',
      entityId: String(entry.id),
      payload: {
        date: entry.date.toISOString(),
        type: entry.type,
        hours: entry.hours,
        amount: entry.amount,
      },
    })

    return entry
  }
})
