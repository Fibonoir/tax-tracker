import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)

  if (event.method === 'GET') {
    const query = getQuery(event)
    const year = query.year ? parseInt(query.year as string) : new Date().getFullYear()
    
    return prisma.oneTimePayment.findMany({
      where: {
        userId: currentUser.id,
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      orderBy: { date: 'desc' },
    })
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const payment = await prisma.oneTimePayment.create({
      data: {
        userId: currentUser.id,
        name: body.name,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
      },
    })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'payment.onetime.created',
      entityType: 'one_time_payment',
      entityId: String(payment.id),
      payload: {
        amount: payment.amount,
        date: payment.date.toISOString(),
      },
    })

    return payment
  }

  if (event.method === 'DELETE') {
    const query = getQuery(event)
    const id = parseInt(query.id as string)
    const payment = await prisma.oneTimePayment.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!payment)
      throw createError({ statusCode: 404, statusMessage: 'One-time payment not found.' })

    await prisma.oneTimePayment.delete({ where: { id } })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'payment.onetime.deleted',
      entityType: 'one_time_payment',
      entityId: String(id),
      payload: {
        amount: payment.amount,
        date: payment.date.toISOString(),
      },
    })

    return { success: true }
  }
})
