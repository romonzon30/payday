// Shared date/currency formatting helpers for the frontend.
// (Consolidates duplicates currently inlined across pages.)

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const DAYS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Builds the day cells for a month grid (Monday-first), padded with the
// trailing/leading days of the adjacent months.
export function getCalendarDays(year: number, month: number): { day: number; currentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let startDow = firstDay.getDay()
  if (startDow === 0) startDow = 7 // Monday = 1
  const daysInMonth = lastDay.getDate()

  const days: { day: number; currentMonth: boolean }[] = []

  const prevMonthLast = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i > 0; i--) {
    days.push({ day: prevMonthLast - i + 1, currentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, currentMonth: true })
  }
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, currentMonth: false })
    }
  }
  return days
}

// Human label for a vencimiento estado.
export function statusLabel(estado: string): string {
  if (estado === 'al_dia') return 'Al día'
  if (estado === 'pendiente') return 'Pendiente'
  return 'Vencido'
}

// Relative label for a vencimiento's due date: "Vence hoy" / "Vence el 22 de Jun"
// / "Venció el 22 de Jun". Compares the stored UTC date against the current local
// date (matching how the calendar grid maps days), so an item due today is never
// shown as already expired. Pass long=true for the full month name.
export function vencimientoDateLabel(iso: string, long = false, now: Date = new Date()): string {
  const d = new Date(iso)
  const cmp =
    d.getUTCFullYear() - now.getFullYear() ||
    d.getUTCMonth() - now.getMonth() ||
    d.getUTCDate() - now.getDate()
  if (cmp === 0) return 'Vence hoy'
  const dayNum = d.getUTCDate()
  const monthName = long ? MONTH_NAMES[d.getUTCMonth()] : MONTH_NAMES[d.getUTCMonth()].slice(0, 3)
  return `${cmp < 0 ? 'Venció' : 'Vence'} el ${dayNum} de ${monthName}`
}

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
