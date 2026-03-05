export function useFmt() {
  function eur(value: number | undefined | null, compact = false): string {
    const v = value || 0
    if (compact && v >= 1000) {
      return '€' + (v / 1000).toFixed(1) + 'k'
    }
    return v.toLocaleString('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  function num(value: number | undefined | null): string {
    return (value || 0).toLocaleString('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  function pct(value: number | undefined | null): string {
    return (value || 0).toFixed(1) + '%'
  }

  function hours(value: number | undefined | null): string {
    return (value || 0).toFixed(1) + 'h'
  }

  function date(d: string | Date): string {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  }

  return { eur, num, pct, hours, date }
}
