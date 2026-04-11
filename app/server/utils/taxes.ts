import { prisma } from './prisma'
import { createDefaultSettings, DEFAULT_TAX_SETTINGS } from './settings'

export interface TaxSettings {
  userId?: number | null
  hourlyRate: number
  coefficiente: number
  irpefRate: number
  inpsType: string
  inpsRate: number
  inpsFixedAnnual: number
  inpsMinimaleThreshold: number
  inpsExcessRate: number
  accountantAnnual: number
  projectionStartMonth: number | null
  projectionMode: 'ACTUAL_AVERAGE' | 'EXPECTED_MONTHLY_GROSS' | 'EXPECTED_MONTHLY_HOURS'
  projectionMonthlyHours: number | null
  projectionMonthlyGross: number | null
  applyBollo: boolean
  bolloAmount: number
}

export function getDefaultTaxSettings(): TaxSettings {
  return { ...DEFAULT_TAX_SETTINGS }
}

function normalizeProjectionMode(value: string | null | undefined): TaxSettings['projectionMode'] {
  if (value === 'EXPECTED_MONTHLY_GROSS' || value === 'EXPECTED_MONTHLY_HOURS')
    return value

  return 'ACTUAL_AVERAGE'
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

export interface TaxBreakdown {
  taxableBase: number
  inpsFixed: number
  inpsExcess: number
  inps: number
  adjustedTaxableBase: number
  irpef: number
  accountant: number
  totalTax: number
  annualNet: number
  effectiveRate: number
}

export function calcTaxesWithSettings(annualGross: number, settings: TaxSettings): TaxBreakdown {
  const taxableBase = annualGross * settings.coefficiente

  let inpsFixed = 0
  let inpsExcess = 0

  if (settings.inpsType === 'GESTIONE_SEPARATA') {
    inpsFixed = taxableBase * settings.inpsRate
    inpsExcess = 0
  } else {
    inpsFixed = settings.inpsFixedAnnual
    const excess = Math.max(0, taxableBase - settings.inpsMinimaleThreshold)
    inpsExcess = excess * settings.inpsExcessRate
  }

  const inps = inpsFixed + inpsExcess
  const adjustedTaxableBase = Math.max(0, taxableBase - inps)
  const irpef = adjustedTaxableBase * settings.irpefRate
  const accountant = settings.accountantAnnual

  const totalTax = inps + irpef + accountant
  const annualNet = annualGross - totalTax
  const effectiveRate = annualGross > 0 ? (totalTax / annualGross) * 100 : 0

  return {
    taxableBase,
    inpsFixed,
    inpsExcess,
    inps,
    adjustedTaxableBase,
    irpef,
    accountant,
    totalTax,
    annualNet,
    effectiveRate,
  }
}

export async function calcTaxes(annualGross: number, userId: number): Promise<TaxBreakdown> {
  const settings = await getSettings(userId)
  return calcTaxesWithSettings(annualGross, settings)
}
