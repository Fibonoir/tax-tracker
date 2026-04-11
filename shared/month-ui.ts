export interface MonthUiInput {
  gross: number
  displayGross: number
  net: number
  provision: number
  usesForecastGross: boolean
}

export function getMonthSummaryUiState(input: MonthUiInput, context: 'home' | 'month') {
  const isForecast = input.usesForecastGross

  return {
    availabilityLabel: isForecast
      ? 'Disponibile stimato'
      : (context === 'home' ? 'Disponibile ora' : 'Disponibile del mese'),
    availabilityNote: isForecast
      ? 'Stima del mese aperto dopo accantonamenti.'
      : 'Il netto dopo accantonamenti.',
    grossLabel: isForecast
      ? (context === 'home' ? 'Ritmo atteso' : 'Ritmo atteso del mese')
      : (context === 'home' ? 'Incassato' : 'Incassato del mese'),
    grossValue: isForecast ? input.displayGross : input.gross,
    provisionLabel: isForecast ? 'Da accantonare stimato' : 'Da accantonare',
    provisionNote: isForecast
      ? 'Quota stimata sul mese aperto.'
      : (context === 'home' ? 'Quota da non spendere questo mese.' : 'Quota da non spendere.'),
  }
}
