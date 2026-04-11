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
  actualGrossObserved: number
  observedMonthsCount: number
  activeMonths: number
  settings: TaxSettings
  includeCurrentOpenMonthForecast?: boolean
  currentOpenMonthActualGross?: number
}) {
  const projection = resolveProjectionMeta(input.settings, input.actualGrossObserved, input.observedMonthsCount)
  const includeCurrentOpenMonthForecast = input.includeCurrentOpenMonthForecast === true
  const currentOpenMonthGross = includeCurrentOpenMonthForecast
    ? Math.max(0, input.currentOpenMonthActualGross || 0, projection.monthlyGross)
    : 0
  const remainingMonths = Math.max(0, input.activeMonths - input.observedMonthsCount - (includeCurrentOpenMonthForecast ? 1 : 0))

  return {
    projectedAnnualGross: input.actualGrossObserved + currentOpenMonthGross + projection.monthlyGross * remainingMonths,
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
  const activeMonths = 12 - effectiveStart
  const treatCurrentMonthAsForecast = isCurrentYear && settings.projectionMode !== 'ACTUAL_AVERAGE'
  const observedMonthEnd = isCurrentYear
    ? (treatCurrentMonthAsForecast ? currentMonth - 1 : currentMonth)
    : 11
  const monthsElapsed = Math.max(0, observedMonthEnd - effectiveStart + 1)
  const actualGrossObserved = monthsElapsed > 0 ? sumGross(months, effectiveStart, observedMonthEnd) : 0
  const projectedSummary = projectAnnualGross({
    actualGrossObserved,
    observedMonthsCount: monthsElapsed,
    activeMonths,
    settings,
    includeCurrentOpenMonthForecast: treatCurrentMonthAsForecast && currentMonth >= effectiveStart,
    currentOpenMonthActualGross: currentMonth >= effectiveStart ? (months[currentMonth]?.gross || 0) : 0,
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
    const isFutureMonth = isCurrentYear && idx > currentMonth
    const isCurrentOpenMonth = treatCurrentMonthAsForecast && idx === currentMonth
    const observedEnd = isCurrentYear
      ? Math.min(idx, treatCurrentMonthAsForecast ? currentMonth - 1 : currentMonth)
      : idx
    const observedMonthsCount = beforeStart ? 0 : Math.max(0, observedEnd - effectiveStart + 1)
    const cumulativeGross = observedMonthsCount > 0 ? sumGross(months, effectiveStart, observedEnd) : 0
    const projection = projectAnnualGross({
      actualGrossObserved: cumulativeGross,
      observedMonthsCount,
      activeMonths,
      settings,
      includeCurrentOpenMonthForecast: treatCurrentMonthAsForecast && idx >= currentMonth && currentMonth >= effectiveStart,
      currentOpenMonthActualGross: currentMonth >= effectiveStart ? (months[currentMonth]?.gross || 0) : 0,
    })
    const projected = calcTaxesWithSettings(projection.projectedAnnualGross, settings)
    const provision = beforeStart || isFutureMonth ? 0 : projected.totalTax / Math.max(1, activeMonths)
    const displayGross = isCurrentOpenMonth
      ? Math.max(month.gross, projection.projection.monthlyGross)
      : month.gross

    return {
      ...month,
      displayGross,
      cumulativeGross,
      runningAvgMonthly: projection.projection.monthlyGross,
      runningProjectedAnnual: beforeStart ? 0 : projection.projectedAnnualGross,
      provision,
      net: beforeStart || isFutureMonth ? 0 : displayGross - provision - monthlyPayments,
      projectedTaxes: beforeStart ? null : projected,
      isFutureMonth,
      usesForecastGross: isCurrentOpenMonth && displayGross > month.gross,
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
