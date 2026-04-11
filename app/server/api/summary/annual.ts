import { prisma } from '~/server/utils/prisma'
import { getBillingState } from '~/server/utils/billing'
import { getSettings } from '~/server/utils/taxes'
import { recordCalculationRun } from '~/server/utils/calculations'
import { buildProvisionExplanations } from '~/server/utils/explanations'
import { requireAppUser } from '~/server/utils/users'
import { buildAnnualSummaryData, getEffectiveEntryDate, isDateInYear } from '~~/shared/annual-summary'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const billing = getBillingState(currentUser)
  const query = getQuery(event)
  const now = new Date()
  const currentYear = now.getFullYear()
  const year = parseInt(query.year as string) || currentYear
  const source = typeof query.source === 'string' ? query.source : 'summary'

  if (source === 'month' && !billing.entitlements.canUseMonthlyLoop) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Core Clarity sblocca la vista mensile completa.',
    })
  }

  const rulesetVersion = '2026.3'
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year + 1, 0, 1)
  const previousYear = year - 1

  const [rawEntries, settings, recurringPayments, onetimePayments, rawPrevYearEntries] = await Promise.all([
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

  const entries = rawEntries.filter(entry => isDateInYear(getEffectiveEntryDate(entry), year))
  const previousYearEntriesCount = rawPrevYearEntries.filter(entry => isDateInYear(new Date(entry.competenceDate ?? entry.date), previousYear)).length

  const summary = buildAnnualSummaryData({
    year,
    referenceDate: now,
    entries,
    settings,
    recurringPayments,
    onetimePayments,
    previousYearEntriesCount,
    source,
    annualVisibilityLimitMonths: billing.entitlements.annualVisibilityLimitMonths,
    canUseDeadlines: billing.entitlements.canUseDeadlines,
  })

  const explanations = buildProvisionExplanations({
    activeMonths: summary.activeMonths,
    monthlyPayments: summary.monthlyPayments,
    projectedTaxes: summary.projectedTaxes,
  })

  const calculationRun = await recordCalculationRun({
    userId: currentUser.id,
    source,
    rulesetYear: year,
    rulesetVersion,
    inputSnapshot: {
      annualGross: summary.annualGross,
      activeMonths: summary.activeMonths,
      monthsElapsed: summary.monthsElapsed,
      monthlyPayments: summary.monthlyPayments,
      isFirstYear: summary.isFirstYear,
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
      projectedAnnualGross: summary.projectedAnnualGross,
      recommendedMonthlySetAside: summary.recommendedMonthlySetAside,
      projectedTaxes: summary.projectedTaxes,
      paymentDeadlines: summary.paymentDeadlines,
      projection: summary.projectionBasis,
    },
  })

  return {
    ...summary,
    rulesetYear: year,
    rulesetVersion,
    calculationRunId: calculationRun.id,
    billing,
    explanations,
  }
})
