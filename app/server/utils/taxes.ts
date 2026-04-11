import { prisma } from './prisma'
import { createDefaultSettings, DEFAULT_TAX_SETTINGS } from './settings'
import { calcTaxesWithSettings, normalizeProjectionMode } from '../../../shared/tax-engine'
import type { TaxBreakdown, TaxSettings } from '../../../shared/tax-engine'

export type { TaxBreakdown, TaxSettings } from '../../../shared/tax-engine'
export { calcTaxesWithSettings } from '../../../shared/tax-engine'

export function getDefaultTaxSettings(): TaxSettings {
  return { ...DEFAULT_TAX_SETTINGS }
}

export async function getSettings(userId: number): Promise<TaxSettings> {
  let settings = await prisma.settings.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  if (!settings) {
    settings = await prisma.settings.create({
      data: createDefaultSettings(userId),
    })
  }

  return {
    ...settings,
    projectionMode: normalizeProjectionMode(settings.projectionMode),
  }
}

export async function calcTaxes(annualGross: number, userId: number): Promise<TaxBreakdown> {
  const settings = await getSettings(userId)
  return calcTaxesWithSettings(annualGross, settings)
}
