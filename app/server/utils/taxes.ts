import { prisma } from './prisma'

export interface TaxSettings {
  hourlyRate: number
  coefficiente: number
  irpefRate: number
  inpsType: string
  inpsRate: number
  inpsFixedAnnual: number
  inpsMinimaleThreshold: number
  inpsExcessRate: number
  accountantAnnual: number
}

export async function getSettings(): Promise<TaxSettings> {
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

export async function calcTaxes(annualGross: number): Promise<TaxBreakdown> {
  const settings = await getSettings()
  return calcTaxesWithSettings(annualGross, settings)
}
