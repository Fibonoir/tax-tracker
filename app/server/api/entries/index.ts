import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const query = getQuery(event)
    const year = parseInt(query.year as string) || new Date().getFullYear()
    const month = query.month !== undefined ? parseInt(query.month as string) : undefined

    const where: any = {
      date: {
        gte: new Date(year, month !== undefined ? month : 0, 1),
        lt: month !== undefined ? new Date(year, month + 1, 1) : new Date(year + 1, 0, 1),
      },
    }

    return prisma.entry.findMany({ where, orderBy: { date: 'desc' } })
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    return prisma.entry.create({
      data: {
        date: new Date(body.date),
        type: body.type,
        hours: body.hours ? parseFloat(body.hours) : null,
        amount: body.amount ? parseFloat(body.amount) : null,
        description: body.description || null,
      },
    })
  }
})
