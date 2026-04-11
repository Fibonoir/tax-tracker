import { describe, expect, it } from 'vitest'

import { buildAnnualSummaryData } from '../shared/annual-summary.ts'
import type { SummaryEntry } from '../shared/annual-summary.ts'
import type { TaxSettings } from '../shared/tax-engine.ts'

function createSettings(overrides: Partial<TaxSettings> = {}): TaxSettings {
  return {
    hourlyRate: 30,
    coefficiente: 0.67,
    irpefRate: 0.15,
    inpsType: 'GESTIONE_SEPARATA',
    inpsRate: 0.2607,
    inpsFixedAnnual: 0,
    inpsMinimaleThreshold: 18808,
    inpsExcessRate: 0.156,
    accountantAnnual: 300,
    projectionStartMonth: null,
    projectionMode: 'ACTUAL_AVERAGE',
    projectionMonthlyHours: null,
    projectionMonthlyGross: null,
    applyBollo: false,
    bolloAmount: 2,
    ...overrides,
  }
}

function hourlyEntry(date: string, hours: number, competenceDate: string | null = null): SummaryEntry {
  return {
    date: new Date(date),
    competenceDate: competenceDate ? new Date(competenceDate) : null,
    type: 'HOURLY',
    hours,
    amount: null,
  }
}

function projectEntry(date: string, amount: number, competenceDate: string | null = null): SummaryEntry {
  return {
    date: new Date(date),
    competenceDate: competenceDate ? new Date(competenceDate) : null,
    type: 'PROJECT',
    hours: null,
    amount,
  }
}

describe('annual summary projection logic', () => {
it('actual average mode annualizes a single high first invoice', () => {
  const summary = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-05', 5700)],
    settings: createSettings(),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  expect(summary.startMonth).toBe(3)
  expect(summary.activeMonths).toBe(9)
  expect(summary.monthsElapsed).toBe(1)
  expect(summary.projectionBasis.mode).toBe('ACTUAL_AVERAGE')
  expect(summary.projectionBasis.monthlyGross).toBe(5700)
  expect(summary.projectedAnnualGross).toBe(51300)
})

it('expected monthly hours mode dampens a bonus month instead of using it as baseline', () => {
  const summary = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-05', 5700)],
    settings: createSettings({
      projectionMode: 'EXPECTED_MONTHLY_HOURS',
      projectionMonthlyHours: 132,
    }),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  expect(summary.projectionBasis.mode).toBe('EXPECTED_MONTHLY_HOURS')
  expect(summary.projectionBasis.monthlyGross).toBe(3960)
  expect(summary.projectedAnnualGross).toBe(37380)
})

it('expected monthly gross mode uses the configured monthly gross for future months', () => {
  const summary = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-05', 5700)],
    settings: createSettings({
      projectionMode: 'EXPECTED_MONTHLY_GROSS',
      projectionMonthlyGross: 4100,
    }),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  expect(summary.projectionBasis.mode).toBe('EXPECTED_MONTHLY_GROSS')
  expect(summary.projectionBasis.monthlyGross).toBe(4100)
  expect(summary.projectedAnnualGross).toBe(38500)
})

it('manual start month override keeps empty opening months inside the observed baseline', () => {
  const summary = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-05', 5000)],
    settings: createSettings({
      projectionStartMonth: 2,
    }),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  expect(summary.startMonth).toBe(2)
  expect(summary.startMonthOverridden).toBe(true)
  expect(summary.activeMonths).toBe(10)
  expect(summary.monthsElapsed).toBe(2)
  expect(summary.projectionBasis.monthlyGross).toBe(2500)
  expect(summary.projectedAnnualGross).toBe(25000)
})

it('competence month groups an April-issued invoice into March totals', () => {
  const summary = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-03', 2800, '2026-03-01')],
    settings: createSettings(),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  expect(summary.months[2].gross).toBe(2800)
  expect(summary.months[3].gross).toBe(0)
  expect(summary.startMonth).toBe(2)
})

it('bollo is distributed as an extra cost when enabled', () => {
  const summary = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [
      projectEntry('2026-04-03', 1000),
      projectEntry('2026-04-10', 1000),
      hourlyEntry('2026-04-11', 10),
    ],
    settings: createSettings({
      applyBollo: true,
      bolloAmount: 2,
    }),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  expect(summary.projectedTaxes.bolloTotal).toBe(6)
  expect(summary.projectedTaxes.paymentsTotal).toBe(6)
  expect(summary.monthlyPayments).toBe(6 / 9)
})

it('recurring and one-time payments reduce projected net through distributed monthly payments', () => {
  const input = {
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-05', 3000)],
    settings: createSettings(),
    previousYearEntriesCount: 0,
  } as const

  const withoutPayments = buildAnnualSummaryData({
    ...input,
    recurringPayments: [],
    onetimePayments: [],
  })

  const summary = buildAnnualSummaryData({
    ...input,
    recurringPayments: [{ amount: 100, frequency: 'MONTHLY', active: true }],
    onetimePayments: [{ amount: 450, date: new Date('2026-07-01') }],
  })

  expect(summary.projectedTaxes.recurringTotal).toBe(1200)
  expect(summary.projectedTaxes.onetimeTotal).toBe(450)
  expect(summary.projectedTaxes.paymentsTotal).toBe(1650)
  expect(summary.monthlyPayments).toBe(1650 / 9)
  expect(summary.projectedTaxes.annualNet).toBeLessThan(withoutPayments.projectedTaxes.annualNet)
})

it('first-year deadlines exclude June and November acconti', () => {
  const firstYear = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-05', 3000)],
    settings: createSettings(),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  const laterYear = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [projectEntry('2026-04-05', 3000)],
    settings: createSettings(),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 2,
  })

  expect(firstYear.paymentDeadlines.some(deadline => deadline.date === '2026-06-30')).toBe(false)
  expect(firstYear.paymentDeadlines.some(deadline => deadline.date === '2026-11-30')).toBe(false)
  expect(laterYear.paymentDeadlines.some(deadline => deadline.date === '2026-06-30')).toBe(true)
  expect(laterYear.paymentDeadlines.some(deadline => deadline.date === '2026-11-30')).toBe(true)
})

it('past-year summaries observe the full active period instead of stopping at the current month', () => {
  const summary = buildAnnualSummaryData({
    year: 2025,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [
      projectEntry('2025-03-05', 1000),
      projectEntry('2025-04-05', 2000),
      projectEntry('2025-12-05', 3000),
    ],
    settings: createSettings({
      projectionStartMonth: 2,
    }),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
  })

  expect(summary.monthsElapsed).toBe(10)
  expect(summary.projectionBasis.monthlyGross).toBe(600)
  expect(summary.projectedAnnualGross).toBe(6000)
})

it('annual visibility masking remains deterministic in the pure summary function', () => {
  const summary = buildAnnualSummaryData({
    year: 2026,
    referenceDate: new Date('2026-04-11T12:00:00Z'),
    entries: [
      projectEntry('2026-04-05', 1000),
      projectEntry('2026-05-05', 1000),
      projectEntry('2026-06-05', 1000),
    ],
    settings: createSettings(),
    recurringPayments: [],
    onetimePayments: [],
    previousYearEntriesCount: 0,
    source: 'annual',
    annualVisibilityLimitMonths: 2,
  })

  expect(summary.months[3].locked).toBeUndefined()
  expect(summary.months[4].locked).toBeUndefined()
  expect(summary.months[5].locked).toBe(true)
})
})
