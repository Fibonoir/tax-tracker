import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          hourlyRate: 30,
          coefficiente: 0.67,
          irpefRate: 0.15,
          inpsType: 'GESTIONE_SEPARATA',
          inpsRate: 0.2607,
          inpsFixedAnnual: 0,
          inpsMinimaleThreshold: 18808,
          inpsExcessRate: 0.156,
          accountantAnnual: 300,
        },
      })
    }
    
    return settings
  }

  if (event.method === 'PUT') {
    const body = await readBody(event)
    
    return prisma.settings.upsert({
      where: { id: 1 },
      update: {
        hourlyRate: body.hourlyRate,
        coefficiente: body.coefficiente,
        irpefRate: body.irpefRate,
        inpsType: body.inpsType,
        inpsRate: body.inpsRate,
        inpsFixedAnnual: body.inpsFixedAnnual,
        inpsMinimaleThreshold: body.inpsMinimaleThreshold,
        inpsExcessRate: body.inpsExcessRate,
        accountantAnnual: body.accountantAnnual,
      },
      create: {
        id: 1,
        hourlyRate: body.hourlyRate,
        coefficiente: body.coefficiente,
        irpefRate: body.irpefRate,
        inpsType: body.inpsType,
        inpsRate: body.inpsRate,
        inpsFixedAnnual: body.inpsFixedAnnual,
        inpsMinimaleThreshold: body.inpsMinimaleThreshold,
        inpsExcessRate: body.inpsExcessRate,
        accountantAnnual: body.accountantAnnual,
      },
    })
  }
})
