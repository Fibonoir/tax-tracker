import { prisma } from '~/server/utils/prisma'
import { logAuditEvent } from '~/server/utils/audit'
import { getBillingState } from '~/server/utils/billing'
import { requireAppUser } from '~/server/utils/users'

function parseStoredDate(value: unknown) {
  if (typeof value !== 'string')
    return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day)
    return null

  return new Date(year, month - 1, day)
}

function parseCompetenceDate(value: unknown) {
  if (typeof value !== 'string')
    return null

  const parts = value.split('-').map(Number)
  if (parts.length < 2 || !parts[0] || !parts[1])
    return null

  return new Date(parts[0], parts[1] - 1, 1)
}

function entryMonthIndex(entry: { date: Date; competenceDate?: Date | null }) {
  return new Date(entry.competenceDate ?? entry.date).getMonth()
}

function entryYear(entry: { date: Date; competenceDate?: Date | null }) {
  return new Date(entry.competenceDate ?? entry.date).getFullYear()
}

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const billing = getBillingState(currentUser)

  if (event.method === 'GET') {
    const query = getQuery(event)
    const year = parseInt(query.year as string) || new Date().getFullYear()
    const month = query.month !== undefined ? parseInt(query.month as string) : undefined
    const source = typeof query.source === 'string' ? query.source : 'entries'

    const take = source === 'home'
      ? billing.entitlements.dashboardHistoryLimit ?? undefined
      : undefined

    if (source === 'home') {
      const where: any = {
        userId: currentUser.id,
        date: {
          gte: new Date(year, month !== undefined ? month : 0, 1),
          lt: month !== undefined ? new Date(year, month + 1, 1) : new Date(year + 1, 0, 1),
        },
      }

      return prisma.entry.findMany({ where, orderBy: { date: 'desc' }, take })
    }

    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year + 1, 0, 1)
    const entries = await prisma.entry.findMany({
      where: {
        userId: currentUser.id,
        OR: [
          { date: { gte: yearStart, lt: yearEnd } },
          { competenceDate: { gte: yearStart, lt: yearEnd } },
        ],
      },
      orderBy: { date: 'desc' },
    })

    const filteredEntries = entries.filter(entry => entryYear(entry) === year)

    if (month === undefined)
      return filteredEntries

    return filteredEntries.filter(entry => entryMonthIndex(entry) === month)
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const entry = await prisma.entry.create({
      data: {
        userId: currentUser.id,
        date: parseStoredDate(body.date) ?? new Date(body.date),
        competenceDate: parseCompetenceDate(body.competenceMonth),
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
        competenceDate: entry.competenceDate?.toISOString() ?? null,
        type: entry.type,
        hours: entry.hours,
        amount: entry.amount,
      },
    })

    return entry
  }
})
