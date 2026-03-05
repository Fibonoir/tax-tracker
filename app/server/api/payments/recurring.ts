import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    return prisma.recurringPayment.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    return prisma.recurringPayment.create({
      data: {
        name: body.name,
        amount: parseFloat(body.amount),
        frequency: body.frequency,
        active: body.active ?? true,
      },
    })
  }

  if (event.method === 'DELETE') {
    const query = getQuery(event)
    const id = parseInt(query.id as string)
    return prisma.recurringPayment.delete({ where: { id } })
  }

  if (event.method === 'PATCH') {
    const body = await readBody(event)
    return prisma.recurringPayment.update({
      where: { id: body.id },
      data: {
        name: body.name,
        amount: parseFloat(body.amount),
        frequency: body.frequency,
        active: body.active,
      },
    })
  }
})
