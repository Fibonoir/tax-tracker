export const DEFAULT_TAX_SETTINGS = {
  hourlyRate: 30,
  coefficiente: 0.67,
  irpefRate: 0.15,
  inpsType: 'GESTIONE_SEPARATA',
  inpsRate: 0.2607,
  inpsFixedAnnual: 0,
  inpsMinimaleThreshold: 18808,
  inpsExcessRate: 0.156,
  accountantAnnual: 300,
} as const

export function createDefaultSettings(userId?: number) {
  return {
    ...DEFAULT_TAX_SETTINGS,
    ...(userId ? { userId } : {}),
  }
}
