import { prisma } from '~/server/utils/prisma'
import { getBillingState } from '~/server/utils/billing'
import { calcTaxesWithSettings, getSettings, type TaxSettings, type TaxBreakdown } from '~/server/utils/taxes'
import { recordCalculationRun } from '~/server/utils/calculations'
import { buildProvisionExplanations } from '~/server/utils/explanations'
import { requireAppUser } from '~/server/utils/users'

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
      label: 'Imposta sost. saldo + 1\u00B0 acconto + INPS ecc.',
      estimatedAmount: projected.irpef * 0.4 + projected.inpsExcess * 0.4,
    })
  }

  deadlines.push({ date: `${year}-08-20`, label: 'INPS fissi Q2 (Apr-Giu)', estimatedAmount: inpsQ })
  deadlines.push({ date: `${year}-11-16`, label: 'INPS fissi Q3 (Lug-Set)', estimatedAmount: inpsQ })

  if (!isFirstYear) {
    deadlines.push({
      date: `${year}-11-30`,
      label: 'Imposta sost. 2\u00B0 acconto + INPS ecc.',
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
  const rulesetVersion = '2026.1'

  const [entries, settings, recurringPayments, onetimePayments, prevYearCount] = await Promise.all([
    prisma.entry.findMany({
      where: {
        userId: currentUser.id,
        date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      },
    }),
    getSettings(currentUser.id),
    prisma.recurringPayment.findMany({
      where: { userId: currentUser.id },
    }),
    prisma.oneTimePayment.findMany({
      where: {
        userId: currentUser.id,
        date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      },
    }),
    prisma.entry.count({
      where: {
        userId: currentUser.id,
        date: { gte: new Date(year - 1, 0, 1), lt: new Date(year, 0, 1) },
      },
    }),
  ])

  const isFirstYear = prevYearCount === 0

  const months = Array.from({ length: 12 }, (_, i) => {
    const me = entries.filter(e => new Date(e.date).getMonth() === i)
    const hourlyGross = me.filter(e => e.type === 'HOURLY').reduce((s, e) => s + (e.hours || 0) * settings.hourlyRate, 0)
    const projectGross = me.filter(e => e.type === 'PROJECT').reduce((s, e) => s + (e.amount || 0), 0)
    const totalHours = me.filter(e => e.type === 'HOURLY').reduce((s, e) => s + (e.hours || 0), 0)
    const gross = hourlyGross + projectGross
    return { month: i, gross, hourlyGross, projectGross, totalHours, entryCount: me.length }
  })

  const annualGross = months.reduce((s, m) => s + m.gross, 0)

  const firstIncomeMonth = months.findIndex(m => m.gross > 0)
  const effectiveStart = firstIncomeMonth >= 0 ? firstIncomeMonth : (isCurrentYear ? currentMonth : 0)
  const activeMonths = 12 - effectiveStart
  const monthsElapsed = isCurrentYear
    ? Math.max(1, currentMonth - effectiveStart + 1)
    : activeMonths

  const ytdTaxes = calcTaxesWithSettings(annualGross, settings)

  const runningAvgTopLevel = monthsElapsed > 0 ? annualGross / monthsElapsed : 0
  const projectedAnnualGross = runningAvgTopLevel * activeMonths
  const projectedTaxes = calcTaxesWithSettings(projectedAnnualGross, settings)
  const recommendedMonthlySetAside = projectedTaxes.totalTax / activeMonths

  const recurringTotal = annualizeRecurring(recurringPayments)
  const onetimeTotal = onetimePayments.reduce((s, p) => s + p.amount, 0)
  const paymentsTotal = recurringTotal + onetimeTotal
  const monthlyPayments = paymentsTotal / activeMonths

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
      },
    },
    outputSnapshot: {
      projectedAnnualGross,
      recommendedMonthlySetAside,
      projectedTaxes,
      paymentDeadlines,
    },
  })

  const monthsWithCalculations = months.map((m, idx) => {
    const beforeStart = idx < effectiveStart
    const cumulativeGross = months.slice(0, idx + 1).reduce((s, x) => s + x.gross, 0)
    const monthsSinceStart = Math.max(1, idx - effectiveStart + 1)
    const runningAvg = beforeStart ? 0 : cumulativeGross / monthsSinceStart
    const runningProjectedAnnual = runningAvg * activeMonths

    const projected = calcTaxesWithSettings(runningProjectedAnnual, settings)
    const provision = beforeStart ? 0 : projected.totalTax / activeMonths

    return {
      ...m,
      cumulativeGross,
      runningAvgMonthly: runningAvg,
      runningProjectedAnnual,
      provision,
      net: beforeStart ? 0 : m.gross - provision - monthlyPayments,
      projectedTaxes: beforeStart ? null : projected,
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
    activeMonths,
    monthsElapsed,
    projectedAnnualGross,
    recommendedMonthlySetAside,
    monthlyPayments,
    explanations,
    ytdTaxes: { ...ytdTaxes, recurringTotal, onetimeTotal, paymentsTotal, annualNet: ytdTaxes.annualNet - paymentsTotal },
    projectedTaxes: { ...projectedTaxes, recurringTotal, onetimeTotal, paymentsTotal, annualNet: projectedTaxes.annualNet - paymentsTotal },
    paymentDeadlines: billing.entitlements.canUseDeadlines ? paymentDeadlines : [],
    months: maskedAnnualMonths,
  }
})
