export interface MonthUiInput {
  gross: number
  displayGross: number
  projectionGross: number
  net: number
  provision: number
  usesForecastGross: boolean
  lifecycle?: 'before_start' | 'future' | 'open' | 'pending' | 'closed'
}

export function getMonthSummaryUiState(input: MonthUiInput, context: 'home' | 'month') {
  return {
    availabilityLabel: context === 'home' ? 'Disponibile ora' : 'Disponibile del mese',
    availabilityNote: 'Il netto dopo costi e accantonamenti reali.',
    grossLabel: context === 'home' ? 'Incassato' : 'Incassato del mese',
    grossValue: input.displayGross,
    provisionLabel: 'Da accantonare',
    provisionNote: context === 'home' ? 'Quota reale da non spendere questo mese.' : 'Quota reale da non spendere.',
    projectionHint: null,
  }
}
