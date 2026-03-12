import { prisma } from './prisma'

export async function recordCalculationRun(input: {
  userId: number
  source: string
  rulesetYear: number
  rulesetVersion: string
  inputSnapshot: Record<string, unknown>
  outputSnapshot: Record<string, unknown>
}) {
  return prisma.calculationRun.create({
    data: {
      userId: input.userId,
      source: input.source,
      rulesetYear: input.rulesetYear,
      rulesetVersion: input.rulesetVersion,
      inputSnapshot: input.inputSnapshot,
      outputSnapshot: input.outputSnapshot,
    },
  })
}
