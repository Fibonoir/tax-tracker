import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const query = getQuery(event)
    const year = query.year ? parseInt(query.year as string) : new Date().getFullYear()
    
    return prisma.oneTimePayment.findMany({
      where: {
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
    return prisma.oneTimePayment.create({
      data: {
        name: body.name,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
      },
    })
  }

  if (event.method === 'DELETE') {
    const query = getQuery(event)
    const id = parseInt(query.id as string)
    return prisma.oneTimePayment.delete({ where: { id } })
  }
})
