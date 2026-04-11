import { calcTaxesWithSettings, type ProjectionMode, type TaxBreakdown, type TaxSettings } from './tax-engine.ts'

export interface SummaryEntry {
  date: Date
  competenceDate: Date | null
  type: 'HOURLY' | 'PROJECT'
  hours: number | null
  amount: number | null
}

export interface SummaryRecurringPayment {
  amount: number
  frequency: string
  active: boolean
}

export interface SummaryOneTimePayment {
  amount: number
  date: Date
}

export interface ProjectionMeta {
  mode: ProjectionMode
  label: string
  monthlyGross: number
  monthlyHours: number | null
  manualStartMonth: number | null
}

export interface AnnualSummaryMonth {
  month: number
  gross: number
  displayGross: number
  projectionGross: number
  hourlyGross: number
  projectGross: number
  totalHours: number
  entryCount: number
  cumulativeGross: number
  runningAvgMonthly: number
  runningProjectedAnnual: number
  provision: number
  net: number
  projectedTaxes: TaxBreakdown | null
  isFutureMonth: boolean
  usesForecastGross: boolean
  lifecycle: 'before_start' | 'future' | 'open' | 'pending' | 'closed'
  locked?: boolean
}

export interface AnnualSummaryResult {
  year: number
  annualGross: number
  isFirstYear: boolean
  startMonth: number
  startMonthOverridden: boolean
  activeMonths: number
  monthsElapsed: number
  projectedAnnualGross: number
  projectionBasis: ProjectionMeta
  recommendedMonthlySetAside: number
  monthlyPayments: number
  ytdTaxes: TaxBreakdown & {
    recurringTotal: number
    onetimeTotal: number
    bolloTotal: number
    paymentsTotal: number
  }
  projectedTaxes: TaxBreakdown & {
    recurringTotal: number
    onetimeTotal: number
    bolloTotal: number
    paymentsTotal: number
  }
  paymentDeadlines: { date: string; label: string; estimatedAmount: number; isPast: boolean }[]
  months: AnnualSummaryMonth[]
}

export const DEFAULT_INVOICE_GRACE_DAYS = 7

export function annualizeRecurring(payments: SummaryRecurringPayment[]) {
  return payments
    .filter(payment => payment.active)
    .reduce((sum, payment) => {
      const multiplier = payment.frequency === 'MONTHLY' ? 12 : payment.frequency === 'QUARTERLY' ? 4 : 1
      return sum + payment.amount * multiplier
    }, 0)
}

export function buildPaymentDeadlines(
  year: number,
  projected: TaxBreakdown,
  settings: TaxSettings,
  isFirstYear: boolean,
  referenceDate: Date,
) {
  const inpsQuarter = settings.inpsFixedAnnual / 4

  const deadlines: { date: string; label: string; estimatedAmount: number }[] = [
    { date: `${year}-05-16`, label: 'INPS fissi Q1 (Gen-Mar)', estimatedAmount: inpsQuarter },
  ]

  if (!isFirstYear) {
    deadlines.push({
      date: `${year}-06-30`,
      label: 'Imposta sost. saldo + 1° acconto + INPS ecc.',
      estimatedAmount: projected.irpef * 0.4 + projected.inpsExcess * 0.4,
    })
  }

  deadlines.push({ date: `${year}-08-20`, label: 'INPS fissi Q2 (Apr-Giu)', estimatedAmount: inpsQuarter })
  deadlines.push({ date: `${year}-11-16`, label: 'INPS fissi Q3 (Lug-Set)', estimatedAmount: inpsQuarter })

  if (!isFirstYear) {
    deadlines.push({
      date: `${year}-11-30`,
      label: 'Imposta sost. 2° acconto + INPS ecc.',
      estimatedAmount: projected.irpef * 0.6 + projected.inpsExcess * 0.6,
    })
  }

  deadlines.push({ date: `${year + 1}-02-16`, label: 'INPS fissi Q4 (Ott-Dic)', estimatedAmount: inpsQuarter })

  return deadlines.map(deadline => ({
    ...deadline,
    estimatedAmount: Math.round(deadline.estimatedAmount * 100) / 100,
    isPast: new Date(deadline.date) < referenceDate,
  }))
}

export function clampMonth(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isInteger(value))
    return null

  if (value < 0 || value > 11)
    return null

  return value
}

export function getMonthLifecycle(input: {
  year: number
  monthIndex: number
  effectiveStart: number
  referenceDate: Date
  graceDays?: number
}): AnnualSummaryMonth['lifecycle'] {
  if (input.monthIndex < input.effectiveStart)
    return 'before_start'

  const graceDays = input.graceDays ?? DEFAULT_INVOICE_GRACE_DAYS
  const refYear = input.referenceDate.getFullYear()
  const refMonth = input.referenceDate.getMonth()

  if (input.year < refYear)
    return 'closed'

  if (input.year > refYear)
    return 'future'

  if (input.monthIndex > refMonth)
    return 'future'

  if (input.monthIndex === refMonth)
    return 'open'

  const graceDeadline = new Date(input.year, input.monthIndex + 1, 1 + graceDays)
  return input.referenceDate < graceDeadline ? 'pending' : 'closed'
}

export function getEffectiveEntryDate(entry: SummaryEntry) {
  return new Date(entry.competenceDate ?? entry.date)
}

export function isDateInYear(value: Date, year: number) {
  return value >= new Date(year, 0, 1) && value < new Date(year + 1, 0, 1)
}

export function getEntryGross(entry: SummaryEntry, settings: TaxSettings) {
  return entry.type === 'HOURLY'
    ? (entry.hours || 0) * settings.hourlyRate
    : (entry.amount || 0)
}

export function resolveProjectionMeta(
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

export function projectAnnualGross(input: {
  months: Array<{ gross: number; lifecycle: AnnualSummaryMonth['lifecycle'] }>
  settings: TaxSettings
  actualGrossObserved: number
  observedMonthsCount: number
}) {
  const projection = resolveProjectionMeta(input.settings, input.actualGrossObserved, input.observedMonthsCount)
  const projectedAnnualGross = input.months.reduce((sum, month) => {
    if (month.lifecycle === 'before_start')
      return sum

    if (month.lifecycle === 'closed')
      return sum + month.gross

    if (month.lifecycle === 'open' || month.lifecycle === 'pending')
      return sum + Math.max(month.gross, projection.monthlyGross)

    return sum + projection.monthlyGross
  }, 0)

  return {
    projectedAnnualGross,
    projection,
  }
}

export function sumGross(months: { gross: number }[], startMonth: number, endMonth: number) {
  if (endMonth < startMonth)
    return 0

  return months.slice(startMonth, endMonth + 1).reduce((sum, month) => sum + month.gross, 0)
}

export function buildAnnualSummaryData(input: {
  year: number
  referenceDate: Date
  entries: SummaryEntry[]
  settings: TaxSettings
  recurringPayments: SummaryRecurringPayment[]
  onetimePayments: SummaryOneTimePayment[]
  previousYearEntriesCount: number
  source?: string
  annualVisibilityLimitMonths?: number | null
  canUseDeadlines?: boolean
}) : AnnualSummaryResult {
  const { year, referenceDate, settings } = input
  const currentYear = referenceDate.getFullYear()
  const currentMonth = referenceDate.getMonth()
  const isCurrentYear = year === currentYear
  const entries = input.entries.filter(entry => isDateInYear(getEffectiveEntryDate(entry), year))
  const isFirstYear = input.previousYearEntriesCount === 0

  const months = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthEntries = entries.filter(entry => getEffectiveEntryDate(entry).getMonth() === monthIndex)
    const hourlyGross = monthEntries
      .filter(entry => entry.type === 'HOURLY')
      .reduce((sum, entry) => sum + getEntryGross(entry, settings), 0)
    const projectGross = monthEntries
      .filter(entry => entry.type === 'PROJECT')
      .reduce((sum, entry) => sum + getEntryGross(entry, settings), 0)
    const totalHours = monthEntries
      .filter(entry => entry.type === 'HOURLY')
      .reduce((sum, entry) => sum + (entry.hours || 0), 0)

    return {
      month: monthIndex,
      gross: hourlyGross + projectGross,
      hourlyGross,
      projectGross,
      totalHours,
      entryCount: monthEntries.length,
    }
  })

  const annualGross = months.reduce((sum, month) => sum + month.gross, 0)
  const firstIncomeMonth = months.findIndex(month => month.gross > 0)
  const effectiveStart = clampMonth(settings.projectionStartMonth)
    ?? (firstIncomeMonth >= 0 ? firstIncomeMonth : (isCurrentYear ? currentMonth : 0))
  const lifecycleByMonth = months.map(month => getMonthLifecycle({
    year,
    monthIndex: month.month,
    effectiveStart,
    referenceDate,
  }))
  const activeMonths = lifecycleByMonth.filter(lifecycle => lifecycle !== 'before_start').length
  const actualAverageObservedMonths = months.filter((month) =>
    month.month >= effectiveStart && month.month <= (isCurrentYear ? currentMonth : 11)
  )
  const closedMonths = months.filter((month, index) => lifecycleByMonth[index] === 'closed')
  const observedMonths = settings.projectionMode === 'ACTUAL_AVERAGE'
    ? actualAverageObservedMonths
    : closedMonths
  const monthsElapsed = observedMonths.length
  const actualGrossObserved = observedMonths.reduce((sum, month) => sum + month.gross, 0)
  const projectedSummary = projectAnnualGross({
    months: months.map((month, index) => ({
      gross: month.gross,
      lifecycle: lifecycleByMonth[index],
    })),
    settings,
    actualGrossObserved,
    observedMonthsCount: monthsElapsed,
  })

  const ytdTaxesBase = calcTaxesWithSettings(annualGross, settings)
  const projectedTaxesBase = calcTaxesWithSettings(projectedSummary.projectedAnnualGross, settings)

  const recurringTotal = annualizeRecurring(input.recurringPayments)
  const onetimeTotal = input.onetimePayments.reduce((sum, payment) => sum + payment.amount, 0)
  const bolloTotal = settings.applyBollo ? entries.length * settings.bolloAmount : 0
  const paymentsTotal = recurringTotal + onetimeTotal + bolloTotal
  const monthlyPayments = paymentsTotal / Math.max(1, activeMonths)
  const recommendedMonthlySetAside = projectedTaxesBase.totalTax / Math.max(1, activeMonths)

  const paymentDeadlines = input.canUseDeadlines === false
    ? []
    : buildPaymentDeadlines(year, projectedTaxesBase, settings, isFirstYear, referenceDate)

  const monthsWithCalculations: AnnualSummaryMonth[] = months.map((month, idx) => {
    const beforeStart = idx < effectiveStart
    const lifecycle = lifecycleByMonth[idx]
    const isFutureMonth = lifecycle === 'future'
    const observedMonths = settings.projectionMode === 'ACTUAL_AVERAGE'
      ? months.slice(effectiveStart, idx + 1)
      : months
          .slice(0, idx + 1)
          .filter((_, monthIndex) => lifecycleByMonth[monthIndex] === 'closed' && monthIndex >= effectiveStart)
    const observedMonthsCount = observedMonths.length
    const cumulativeGross = observedMonths.reduce((sum, observedMonth) => sum + observedMonth.gross, 0)
    const projection = projectAnnualGross({
      months: months.map((candidateMonth, candidateIndex) => {
        let scenarioLifecycle: AnnualSummaryMonth['lifecycle']

        if (candidateIndex < effectiveStart) {
          scenarioLifecycle = 'before_start'
        } else if (candidateIndex < idx) {
          scenarioLifecycle = 'closed'
        } else if (candidateIndex === idx) {
          scenarioLifecycle = lifecycle
        } else {
          scenarioLifecycle = 'future'
        }

        return {
          gross: candidateMonth.gross,
          lifecycle: scenarioLifecycle,
        }
      }),
      settings,
      actualGrossObserved: cumulativeGross,
      observedMonthsCount,
    })
    const projected = calcTaxesWithSettings(projection.projectedAnnualGross, settings)
    const projectionGross = lifecycle === 'open' || lifecycle === 'pending'
      ? Math.max(month.gross, projection.projection.monthlyGross)
      : lifecycle === 'future'
        ? projection.projection.monthlyGross
        : month.gross
    const projectedProvision = beforeStart || isFutureMonth ? 0 : projected.totalTax / Math.max(1, activeMonths)
    const displayGross = month.gross
    const provisionScale = projectionGross > 0 ? Math.min(month.gross / projectionGross, 1) : 0
    const provision = beforeStart || isFutureMonth ? 0 : projectedProvision * provisionScale

    return {
      ...month,
      displayGross,
      projectionGross,
      cumulativeGross,
      runningAvgMonthly: projection.projection.monthlyGross,
      runningProjectedAnnual: beforeStart ? 0 : projection.projectedAnnualGross,
      provision,
      net: beforeStart || isFutureMonth ? 0 : month.gross - provision - monthlyPayments,
      projectedTaxes: beforeStart ? null : projected,
      isFutureMonth,
      usesForecastGross: projectionGross > month.gross,
      lifecycle,
    }
  })

  const visibilityLimit = input.annualVisibilityLimitMonths ?? null
  const annualPreviewEnd = visibilityLimit === null
    ? 12
    : Math.min(12, effectiveStart + visibilityLimit)

  const maskedMonths = input.source === 'annual' && visibilityLimit !== null
    ? monthsWithCalculations.map((month, idx) => {
        const isVisible = idx >= effectiveStart && idx < annualPreviewEnd
        return isVisible
          ? month
          : {
              ...month,
              gross: 0,
              displayGross: 0,
              projectionGross: 0,
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
              usesForecastGross: false,
              lifecycle: 'before_start',
              locked: true,
            }
      })
    : monthsWithCalculations

  return {
    year,
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
    ytdTaxes: {
      ...ytdTaxesBase,
      recurringTotal,
      onetimeTotal,
      bolloTotal,
      paymentsTotal,
      effectiveRate: annualGross > 0 ? ((ytdTaxesBase.totalTax + paymentsTotal) / annualGross) * 100 : 0,
      annualNet: ytdTaxesBase.annualNet - paymentsTotal,
    },
    projectedTaxes: {
      ...projectedTaxesBase,
      recurringTotal,
      onetimeTotal,
      bolloTotal,
      paymentsTotal,
      effectiveRate: projectedSummary.projectedAnnualGross > 0
        ? ((projectedTaxesBase.totalTax + paymentsTotal) / projectedSummary.projectedAnnualGross) * 100
        : 0,
      annualNet: projectedTaxesBase.annualNet - paymentsTotal,
    },
    paymentDeadlines,
    months: maskedMonths,
  }
}
