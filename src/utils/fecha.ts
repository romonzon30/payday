// Shared date/currency formatting helpers for the frontend.
// (Consolidates duplicates currently inlined across pages.)

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Formats an amount as Argentine pesos, e.g. 56501.85 -> "$ 56.501,85".
export function formatMonto(monto: number): string {
  return '$ ' + monto.toLocaleString('es-AR', { minimumFractionDigits: 0 })
}

// Reads the UTC day-of-month from an ISO date string (avoids TZ drift).
export function getUTCDay(iso: string): number {
  return new Date(iso).getUTCDate()
}

// Reads the UTC month index (0-11) from an ISO date string.
export function getUTCMonthIndex(iso: string): number {
  return new Date(iso).getUTCMonth()
}
