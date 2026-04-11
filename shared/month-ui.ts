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
  const isForecast = input.usesForecastGross

  return {
    availabilityLabel: isForecast
      ? 'Disponibile stimato'
      : (context === 'home' ? 'Disponibile ora' : 'Disponibile del mese'),
    availabilityNote: isForecast
      ? 'Stima del mese aperto dopo accantonamenti.'
      : 'Il netto dopo accantonamenti.',
    grossLabel: context === 'home' ? 'Incassato' : 'Incassato del mese',
    grossValue: input.displayGross,
    provisionLabel: isForecast ? 'Da accantonare stimato' : 'Da accantonare',
    provisionNote: isForecast
      ? 'Quota stimata sul mese aperto.'
      : (context === 'home' ? 'Quota da non spendere questo mese.' : 'Quota da non spendere.'),
    projectionHint: isForecast
      ? {
          label: context === 'home' ? 'Proiezione mese' : 'Proiezione del mese',
          value: input.projectionGross,
          text: input.lifecycle === 'pending'
            ? 'Il mese e terminato ma resta nel periodo di tolleranza per la fattura.'
            : 'La proiezione usa il ritmo atteso finche il mese non viene chiuso.',
        }
      : null,
  }
}
