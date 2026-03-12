import type { TaxBreakdown } from './taxes'

export function buildProvisionExplanations(input: {
  activeMonths: number
  monthlyPayments: number
  projectedTaxes: TaxBreakdown
}) {
  const months = Math.max(1, input.activeMonths)
  const taxMonthly = input.projectedTaxes.totalTax / months

  return [
    {
      id: 'tax-load',
      label: 'Accantonamento fiscale',
      value: Math.round(taxMonthly * 100) / 100,
      tone: 'danger',
      text: 'Distribuiamo imposta sostitutiva e contributi sui mesi attivi per non trasformare giugno e novembre in una sorpresa.',
    },
    {
      id: 'cost-load',
      label: 'Costi distribuiti',
      value: Math.round(input.monthlyPayments * 100) / 100,
      tone: input.monthlyPayments > 0 ? 'warning' : 'neutral',
      text: input.monthlyPayments > 0
        ? 'I costi ricorrenti e le uscite una tantum pesano sulle stime del mese per mostrarti un disponibile piu realistico.'
        : 'Non ci sono costi distribuiti oltre al carico fiscale salvato nel modello attuale.',
    },
    {
      id: 'net-logic',
      label: 'Disponibile del mese',
      value: Math.round((taxMonthly + input.monthlyPayments) * 100) / 100,
      tone: 'accent',
      text: 'Il disponibile non celebra il lordo: ti mostra quello che resta dopo aver escluso accantonamenti e costi gia previsti.',
    },
  ]
}
