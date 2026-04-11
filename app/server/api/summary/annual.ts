import { prisma } from '~/server/utils/prisma'
import { getBillingState } from '~/server/utils/billing'
import { calcTaxesWithSettings, getSettings, type TaxSettings, type TaxBreakdown } from '~/server/utils/taxes'
import { recordCalculationRun } from '~/server/utils/calculations'
import { buildProvisionExplanations } from '~/server/utils/explanations'
import { requireAppUser } from '~/server/utils/users'

type SummaryEntry = {
  date: Date
  competenceDate: Date | null
  type: 'HOURLY' | 'PROJECT'
  hours: number | null
  amount: number | null
}

type ProjectionMeta = {
  mode: TaxSettings['projectionMode']
  label: string
  monthlyGross: number
  monthlyHours: number | null
  manualStartMonth: number | null
}

function annualizeRecurring(payments: { amount: number; frequency: string; active: boolean }[]) {
  return payments
    .filter(p => p.active)
    .reduce((sum, p) => {
      const multiplier = p.frequency === 'MONTHLY' ? 12 : p.frequency === 'QUARTERLY' ? 4 : 1
      return sum + p.amount * multiplier
    }, 0)
}

function buildPaymentDeadlines(year: number, projected: TaxBreakdown, settings: TaxSettings, isFirstYear: boolean) {
  const now = new Date()
  const inpsQ = settings.inpsFixedAnnual / 4

  const deadlines: { date: string; label: string; estimatedAmount: number }[] = [
    { date: `${year}-05-16`, label: 'INPS fissi Q1 (Gen-Mar)', estimatedAmount: inpsQ },
  ]

  if (!isFirstYear) {
    deadlines.push({
      date: `${year}-06-30`,
      label: 'Imposta sost. saldo + 1° acconto + INPS ecc.',
      estimatedAmount: projected.irpef * 0.4 + projected.inpsExcess * 0.4,
    })
  }

  deadlines.push({ date: `${year}-08-20`, label: 'INPS fissi Q2 (Apr-Giu)', estimatedAmount: inpsQ })
  deadlines.push({ date: `${year}-11-16`, label: 'INPS fissi Q3 (Lug-Set)', estimatedAmount: inpsQ })

  if (!isFirstYear) {
    deadlines.push({
      date: `${year}-11-30`,
      label: 'Imposta sost. 2° acconto + INPS ecc.',
      estimatedAmount: projected.irpef * 0.6 + projected.inpsExcess * 0.6,
    })
  }

  deadlines.push({ date: `${year + 1}-02-16`, label: 'INPS fissi Q4 (Ott-Dic)', estimatedAmount: inpsQ })

  return deadlines.map(d => ({
    ...d,
    estimatedAmount: Math.round(d.estimatedAmount * 100) / 100,
    isPast: new Date(d.date) < now,
  }))
}

function clampMonth(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isInteger(value))
    return null

  if (value < 0 || value > 11)
    return null

  return value
}

function getEffectiveEntryDate(entry: SummaryEntry) {
  return new Date(entry.competenceDate ?? entry.date)
}

function isDateInYear(value: Date, year: number) {
  return value >= new Date(year, 0, 1) && value < new Date(year + 1, 0, 1)
}

function getEntryGross(entry: SummaryEntry, settings: TaxSettings) {
  return entry.type === 'HOURLY'
    ? (entry.hours || 0) * settings.hourlyRate
    : (entry.amount || 0)
}

function resolveProjectionMeta(
  settings: TaxSettings,
  actualGrossObserved: number,
  observedMonthsCount: number,
): ProjectionMeta {
  if (settings.projectionMode === 'EXPECTED_MONTHLY_GROSS') {
    return {
      mode: settings.projectionMode,
      label: 'Lordo mensile atteso',
      monthlyGross: Math.max(0, settings.projectionMonthlyGross || 0),
      monthlyHours: null,
      manualStartMonth: clampMonth(settings.projectionStartMonth),
    }
  }

  if (settings.projectionMode === 'EXPECTED_MONTHLY_HOURS') {
    const monthlyHours = Math.max(0, settings.projectionMonthlyHours || 0)
    return {
      mode: settings.projectionMode,
      label: 'Baseline mensile attesa',
      monthlyGross: monthlyHours * settings.hourlyRate,
      monthlyHours,
      manualStartMonth: clampMonth(settings.projectionStartMonth),
    }
  }

  return {
    mode: 'ACTUAL_AVERAGE',
    label: 'Media mensile osservata',
    monthlyGross: observedMonthsCount > 0 ? actualGrossObserved / observedMonthsCount : 0,
    monthlyHours: null,
    manualStartMonth: clampMonth(settings.projectionStartMonth),
  }
}

function projectAnnualGross(input: {
  actualGrossObserved: number
  observedMonthsCount: number
  activeMonths: number
  settings: TaxSettings
}) {
  const projection = resolveProjectionMeta(input.settings, input.actualGrossObserved, input.observedMonthsCount)
  const remainingMonths = Math.max(0, input.activeMonths - input.observedMonthsCount)

  return {
    projectedAnnualGross: input.actualGrossObserved + projection.monthlyGross * remainingMonths,
    projection,
  }
}

function sumGross(months: { gross: number }[], startMonth: number, endMonth: number) {
  if (endMonth < startMonth)
    return 0

  return months.slice(startMonth, endMonth + 1).reduce((sum, month) => sum + month.gross, 0)
}

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const billing = getBillingState(currentUser)
  const query = getQuery(event)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const year = parseInt(query.year as string) || currentYear
  const source = typeof query.source === 'string' ? query.source : 'summary'

  if (source === 'month' && !billing.entitlements.canUseMonthlyLoop) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Core Clarity sblocca la vista mensile completa.',
    })
  }

  const isCurrentYear = year === currentYear
  const rulesetVersion = '2026.2'
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year + 1, 0, 1)
  const previousYear = year - 1

  const [rawEntries, settings, recurringPayments, onetimePayments, rawPrevYearCount] = await Promise.all([
    prisma.entry.findMany({
      where: {
        userId: currentUser.id,
        OR: [
          { date: { gte: yearStart, lt: yearEnd } },
          { competenceDate: { gte: yearStart, lt: yearEnd } },
        ],
      },
    }),
    getSettings(currentUser.id),
    prisma.recurringPayment.findMany({
      where: { userId: currentUser.id },
    }),
    prisma.oneTimePayment.findMany({
      where: {
        userId: currentUser.id,
        date: { gte: yearStart, lt: yearEnd },
      },
    }),
    prisma.entry.findMany({
      where: {
        userId: currentUser.id,
        OR: [
          { date: { gte: new Date(previousYear, 0, 1), lt: yearStart } },
          { competenceDate: { gte: new Date(previousYear, 0, 1), lt: yearStart } },
        ],
      },
      select: { date: true, competenceDate: true },
    }),
  ])

  const entries = rawEntries.filter(entry => isDateInYear(getEffectiveEntryDate(entry as SummaryEntry), year)) as SummaryEntry[]
  const prevYearCount = rawPrevYearCount.filter(entry => isDateInYear(new Date(entry.competenceDate ?? entry.date), previousYear)).length
  const isFirstYear = prevYearCount === 0

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthEntries = entries.filter(entry => getEffectiveEntryDate(entry).getMonth() === i)
    const hourlyGross = monthEntries
      .filter(entry => entry.type === 'HOURLY')
      .reduce((sum, entry) => sum + getEntryGross(entry, settings), 0)
    const projectGross = monthEntries
      .filter(entry => entry.type === 'PROJECT')
      .reduce((sum, entry) => sum + getEntryGross(entry, settings), 0)
    const totalHours = monthEntries
      .filter(entry => entry.type === 'HOURLY')
      .reduce((sum, entry) => sum + (entry.hours || 0), 0)
    const gross = hourlyGross + projectGross

    return { month: i, gross, hourlyGross, projectGross, totalHours, entryCount: monthEntries.length }
  })

  const annualGross = months.reduce((sum, month) => sum + month.gross, 0)
  const firstIncomeMonth = months.findIndex(month => month.gross > 0)
  const effectiveStart = clampMonth(settings.projectionStartMonth)
    ?? (firstIncomeMonth >= 0 ? firstIncomeMonth : (isCurrentYear ? currentMonth : 0))
  const activeMonths = 12 - effectiveStart
  const observedMonthEnd = isCurrentYear ? currentMonth : 11
  const monthsElapsed = Math.max(0, observedMonthEnd - effectiveStart + 1)
  const actualGrossObserved = monthsElapsed > 0 ? sumGross(months, effectiveStart, observedMonthEnd) : 0
  const projectedSummary = projectAnnualGross({
    actualGrossObserved,
    observedMonthsCount: monthsElapsed,
    activeMonths,
    settings,
  })

  const ytdTaxes = calcTaxesWithSettings(annualGross, settings)
  const projectedTaxes = calcTaxesWithSettings(projectedSummary.projectedAnnualGross, settings)
  const recommendedMonthlySetAside = projectedTaxes.totalTax / Math.max(1, activeMonths)

  const recurringTotal = annualizeRecurring(recurringPayments)
  const onetimeTotal = onetimePayments.reduce((sum, payment) => sum + payment.amount, 0)
  const bolloTotal = settings.applyBollo ? entries.length * settings.bolloAmount : 0
  const paymentsTotal = recurringTotal + onetimeTotal + bolloTotal
  const monthlyPayments = paymentsTotal / Math.max(1, activeMonths)

  const paymentDeadlines = buildPaymentDeadlines(year, projectedTaxes, settings, isFirstYear)
  const explanations = buildProvisionExplanations({
    activeMonths,
    monthlyPayments,
    projectedTaxes: {
      ...projectedTaxes,
      annualNet: projectedTaxes.annualNet - paymentsTotal,
    },
  })

  const calculationRun = await recordCalculationRun({
    userId: currentUser.id,
    source,
    rulesetYear: year,
    rulesetVersion,
    inputSnapshot: {
      annualGross,
      activeMonths,
      monthsElapsed,
      monthlyPayments,
      isFirstYear,
      settings: {
        hourlyRate: settings.hourlyRate,
        coefficiente: settings.coefficiente,
        irpefRate: settings.irpefRate,
        inpsType: settings.inpsType,
        inpsRate: settings.inpsRate,
        inpsFixedAnnual: settings.inpsFixedAnnual,
        inpsMinimaleThreshold: settings.inpsMinimaleThreshold,
        inpsExcessRate: settings.inpsExcessRate,
        accountantAnnual: settings.accountantAnnual,
        projectionStartMonth: settings.projectionStartMonth,
        projectionMode: settings.projectionMode,
        projectionMonthlyHours: settings.projectionMonthlyHours,
        projectionMonthlyGross: settings.projectionMonthlyGross,
        applyBollo: settings.applyBollo,
        bolloAmount: settings.bolloAmount,
      },
    },
    outputSnapshot: {
      projectedAnnualGross: projectedSummary.projectedAnnualGross,
      recommendedMonthlySetAside,
      projectedTaxes,
      paymentDeadlines,
      projection: projectedSummary.projection,
    },
  })

  const monthsWithCalculations = months.map((month, idx) => {
    const beforeStart = idx < effectiveStart
    const isFutureMonth = isCurrentYear && idx > currentMonth
    const observedEnd = isCurrentYear ? Math.min(idx, currentMonth) : idx
    const observedMonthsCount = beforeStart ? 0 : Math.max(0, observedEnd - effectiveStart + 1)
    const cumulativeGross = observedMonthsCount > 0 ? sumGross(months, effectiveStart, observedEnd) : 0
    const projection = projectAnnualGross({
      actualGrossObserved: cumulativeGross,
      observedMonthsCount,
      activeMonths,
      settings,
    })
    const projected = calcTaxesWithSettings(projection.projectedAnnualGross, settings)
    const provision = beforeStart || isFutureMonth ? 0 : projected.totalTax / Math.max(1, activeMonths)

    return {
      ...month,
      cumulativeGross,
      runningAvgMonthly: projection.projection.monthlyGross,
      runningProjectedAnnual: beforeStart ? 0 : projection.projectedAnnualGross,
      provision,
      net: beforeStart || isFutureMonth ? 0 : month.gross - provision - monthlyPayments,
      projectedTaxes: beforeStart ? null : projected,
      isFutureMonth,
    }
  })

  const visibleAnnualMonths = billing.entitlements.annualVisibilityLimitMonths
  const annualPreviewEnd = visibleAnnualMonths === null
    ? 12
    : Math.min(12, effectiveStart + visibleAnnualMonths)

  const maskedAnnualMonths = source === 'annual' && visibleAnnualMonths !== null
    ? monthsWithCalculations.map((month, idx) => {
        const isVisible = idx >= effectiveStart && idx < annualPreviewEnd
        return isVisible
          ? month
          : {
              ...month,
              gross: 0,
              hourlyGross: 0,
              projectGross: 0,
              totalHours: 0,
              entryCount: 0,
              cumulativeGross: 0,
              runningAvgMonthly: 0,
              runningProjectedAnnual: 0,
              provision: 0,
              net: 0,
              projectedTaxes: null,
              locked: true,
            }
      })
    : monthsWithCalculations

  return {
    year,
    rulesetYear: year,
    rulesetVersion,
    calculationRunId: calculationRun.id,
    billing,
    annualGross,
    isFirstYear,
    startMonth: effectiveStart,
    startMonthOverridden: clampMonth(settings.projectionStartMonth) !== null,
    activeMonths,
    monthsElapsed,
    projectedAnnualGross: projectedSummary.projectedAnnualGross,
    projectionBasis: projectedSummary.projection,
    recommendedMonthlySetAside,
    monthlyPayments,
    explanations,
    ytdTaxes: {
      ...ytdTaxes,
      recurringTotal,
      onetimeTotal,
      bolloTotal,
      paymentsTotal,
      effectiveRate: annualGross > 0 ? ((ytdTaxes.totalTax + paymentsTotal) / annualGross) * 100 : 0,
      annualNet: ytdTaxes.annualNet - paymentsTotal,
    },
    projectedTaxes: {
      ...projectedTaxes,
      recurringTotal,
      onetimeTotal,
      bolloTotal,
      paymentsTotal,
      effectiveRate: projectedSummary.projectedAnnualGross > 0
        ? ((projectedTaxes.totalTax + paymentsTotal) / projectedSummary.projectedAnnualGross) * 100
        : 0,
      annualNet: projectedTaxes.annualNet - paymentsTotal,
    },
    paymentDeadlines: billing.entitlements.canUseDeadlines ? paymentDeadlines : [],
    months: maskedAnnualMonths,
  }
})
