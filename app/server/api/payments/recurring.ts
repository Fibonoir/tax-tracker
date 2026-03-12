import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)

  if (event.method === 'GET') {
    return prisma.recurringPayment.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const payment = await prisma.recurringPayment.create({
      data: {
        userId: currentUser.id,
        name: body.name,
        amount: parseFloat(body.amount),
        frequency: body.frequency,
        active: body.active ?? true,
      },
    })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'payment.recurring.created',
      entityType: 'recurring_payment',
      entityId: String(payment.id),
      payload: {
        amount: payment.amount,
        frequency: payment.frequency,
      },
    })

    return payment
  }

  if (event.method === 'DELETE') {
    const query = getQuery(event)
    const id = parseInt(query.id as string)
    const payment = await prisma.recurringPayment.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!payment)
      throw createError({ statusCode: 404, statusMessage: 'Recurring payment not found.' })

    await prisma.recurringPayment.delete({ where: { id } })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'payment.recurring.deleted',
      entityType: 'recurring_payment',
      entityId: String(id),
      payload: {
        amount: payment.amount,
        frequency: payment.frequency,
      },
    })

    return { success: true }
  }

  if (event.method === 'PATCH') {
    const body = await readBody(event)
    const payment = await prisma.recurringPayment.findFirst({
      where: { id: body.id, userId: currentUser.id },
    })

    if (!payment)
      throw createError({ statusCode: 404, statusMessage: 'Recurring payment not found.' })

    const updated = await prisma.recurringPayment.update({
      where: { id: body.id },
      data: {
        name: body.name,
        amount: parseFloat(body.amount),
        frequency: body.frequency,
        active: body.active,
      },
    })

    await logAuditEvent({
      userId: currentUser.id,
      action: 'payment.recurring.updated',
      entityType: 'recurring_payment',
      entityId: String(updated.id),
      payload: {
        amount: updated.amount,
        frequency: updated.frequency,
        active: updated.active,
      },
    })

    return updated
  }
})
