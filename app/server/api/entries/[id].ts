import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') as string)

  if (event.method === 'DELETE') {
    await prisma.entry.delete({ where: { id } })
    return { success: true }
  }

  if (event.method === 'PATCH') {
    const body = await readBody(event)
    return prisma.entry.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        type: body.type,
        hours: body.hours ? parseFloat(body.hours) : null,
        amount: body.amount ? parseFloat(body.amount) : null,
        description: body.description || null,
      },
    })
  }
})
