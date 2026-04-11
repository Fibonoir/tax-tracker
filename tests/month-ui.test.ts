import { describe, expect, it } from 'vitest'

import { getMonthSummaryUiState } from '../shared/month-ui.ts'

describe('month summary UI contract', () => {
  it('shows actual-month labels when the month is based on real gross', () => {
    const state = getMonthSummaryUiState({
      gross: 2200,
      displayGross: 2200,
      projectionGross: 2200,
      net: 1400,
      provision: 500,
      usesForecastGross: false,
    }, 'month')

    expect(state.availabilityLabel).toBe('Disponibile del mese')
    expect(state.grossLabel).toBe('Incassato del mese')
    expect(state.grossValue).toBe(2200)
    expect(state.provisionLabel).toBe('Da accantonare')
    expect(state.projectionHint).toBeNull()
  })

  it('shows actual gross but exposes a projection hint when the current month is still open', () => {
    const state = getMonthSummaryUiState({
      gross: 0,
      displayGross: 0,
      projectionGross: 3960,
      net: 2500,
      provision: 1100,
      usesForecastGross: true,
      lifecycle: 'open',
    }, 'month')

    expect(state.availabilityLabel).toBe('Disponibile stimato')
    expect(state.availabilityNote).toBe('Stima del mese aperto dopo accantonamenti.')
    expect(state.grossLabel).toBe('Incassato del mese')
    expect(state.grossValue).toBe(0)
    expect(state.provisionLabel).toBe('Da accantonare stimato')
    expect(state.projectionHint?.label).toBe('Proiezione del mese')
    expect(state.projectionHint?.value).toBe(3960)
  })

  it('uses the home-specific wording for the cockpit card', () => {
    const state = getMonthSummaryUiState({
      gross: 0,
      displayGross: 0,
      projectionGross: 3960,
      net: 2500,
      provision: 1100,
      usesForecastGross: true,
      lifecycle: 'pending',
    }, 'home')

    expect(state.availabilityLabel).toBe('Disponibile stimato')
    expect(state.grossLabel).toBe('Incassato')
    expect(state.provisionNote).toBe('Quota stimata sul mese aperto.')
    expect(state.projectionHint?.text).toContain('periodo di tolleranza')
  })
})
