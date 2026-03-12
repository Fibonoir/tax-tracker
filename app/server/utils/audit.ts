import { prisma } from './prisma'

export async function logAuditEvent(input: {
  userId: number
  action: string
  entityType: string
  entityId?: string | null
  payload?: Record<string, unknown> | null
}) {
  return prisma.auditEvent.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      payload: input.payload ?? undefined,
    },
  })
}
