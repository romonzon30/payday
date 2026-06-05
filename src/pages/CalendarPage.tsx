import { useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import AppFooter from '../components/AppFooter'
import AppSidebar from '../components/AppSidebar'
import NuevoVencimientoModal from '../components/NuevoVencimientoModal'
import styles from './CalendarPage.module.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

interface CalendarPageProps {
  user: User
  onBack: () => void
  onGoToProfile: () => void
  onGoToImpuestos: () => void
  onLogout: () => void
}

interface Vencimiento {
  _id: string
  tipo: string
  titulo?: string
  descripcion: string
  monto: number
  fechaVencimiento: string
  estado: 'al_dia' | 'pendiente' | 'vencido'
  notificarEmail?: boolean
}

const DAYS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let startDow = firstDay.getDay()
  if (startDow === 0) startDow = 7 // Monday = 1
  const daysInMonth = lastDay.getDate()

  const days: { day: number; currentMonth: boolean }[] = []

  // Previous month padding
  const prevMonthLast = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i > 0; i--) {
    days.push({ day: prevMonthLast - i + 1, currentMonth: false })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, currentMonth: true })
  }

  // Next month padding
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, currentMonth: false })
    }
  }

  return days
}

function formatMonto(monto: number): string {
  return '$ ' + monto.toLocaleString('es-AR', { minimumFractionDigits: 0 })
}

function getUTCDay(isoString: string) {
  return new Date(isoString).getUTCDate()
}

function getUTCMonthIndex(isoString: string) {
  return new Date(isoString).getUTCMonth()
}

function statusLabel(estado: string): string {
  if (estado === 'al_dia') return 'Al día'
  if (estado === 'pendiente') return 'Pendiente'
  return 'Vencido'
}

function statusClass(estado: string): string {
  if (estado === 'al_dia') return styles.statusAlDia
  if (estado === 'pendiente') return styles.statusPendiente
  return styles.statusVencido
}

export default function CalendarPage({ user, onBack, onGoToProfile, onGoToImpuestos, onLogout }: CalendarPageProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState('')
  const [selectedVenc, setSelectedVenc] = useState<Vencimiento | null>(null)

  const fetchVencimientos = useCallback(async (year: number, month: number) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/user/vencimientos?year=${year}&month=${month + 1}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setVencimientos(data.vencimientos)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVencimientos(currentYear, currentMonth)
  }, [currentYear, currentMonth, fetchVencimientos])

  function openNewModal(day?: number) {
    const targetDay = day ?? today.getDate()
    const yyyy = currentYear.toString().padStart(4, '0')
    const mm = String(currentMonth + 1).padStart(2, '0')
    const dd = String(targetDay).padStart(2, '0')
    setModalDate(`${yyyy}-${mm}-${dd}`)
    setModalOpen(true)
  }

  function handleCreated() {
    setModalOpen(false)
    fetchVencimientos(currentYear, currentMonth)
  }

  async function toggleEstado(v: Vencimiento) {
    const nuevoEstado = v.estado === 'al_dia' ? 'pendiente' : 'pagado'
    const prev = vencimientos
    setVencimientos((list) =>
      list.map((x) =>
        x._id === v._id ? { ...x, estado: nuevoEstado === 'pagado' ? 'al_dia' : 'pendiente' } : x
      )
    )

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/user/vencimientos/${v._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) {
        setVencimientos(prev)
        return
      }
      // refetch para que el server recalcule estado real (pendiente vs vencido por fecha)
      fetchVencimientos(currentYear, currentMonth)
    } catch {
      setVencimientos(prev)
    }
  }

  async function deleteVencimiento(v: Vencimiento) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/user/vencimientos/${v._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setSelectedVenc(null)
        fetchVencimientos(currentYear, currentMonth)
      }
    } catch {
      // silently fail
    }
  }

  function goToday() {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  function goPrev() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function goNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const calendarDays = getCalendarDays(currentYear, currentMonth)
  const todayDay = today.getMonth() === currentMonth && today.getFullYear() === currentYear ? today.getDate() : -1

  // Map vencimiento dates to days (use UTC to avoid timezone day-offset)
  const vencByDay: Record<number, Vencimiento[]> = {}
  for (const v of vencimientos) {
    const d = new Date(v.fechaVencimiento).getUTCDate()
    if (!vencByDay[d]) vencByDay[d] = []
    vencByDay[d].push(v)
  }

  return (
    <div className={styles.page}>
      <AppSidebar
        user={user}
        activeView="calendar"
        onGoToDashboard={onBack}
        onGoToCalendar={() => {}}
        onGoToImpuestos={onGoToImpuestos}
        onGoToProfile={onGoToProfile}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>{MONTH_NAMES[currentMonth]} {currentYear}</h1>
            <p className={styles.pageSubtitle}>Monotributo y Vencimientos AFIP</p>
          </div>
        </header>

        <div className={styles.contentGrid}>
          {/* Calendar */}
          <section className={styles.calendarSection}>
            <div className={styles.calendarNav}>
              <button className={styles.calendarNavBtn} onClick={goPrev}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button className={styles.todayBtn} onClick={goToday}>Hoy</button>
              <button className={styles.calendarNavBtn} onClick={goNext}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <button className={styles.newBtn} onClick={() => openNewModal()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo vencimiento
              </button>
            </div>

            <div className={styles.calendarGrid}>
              {DAYS_HEADER.map(d => (
                <div key={d} className={styles.dayHeader}>{d}</div>
              ))}
              {calendarDays.map((cell, i) => {
                const isToday = cell.currentMonth && cell.day === todayDay
                const dayVenc = cell.currentMonth ? vencByDay[cell.day] : undefined
                return (
                  <div
                    key={i}
                    className={`${styles.dayCell} ${!cell.currentMonth ? styles.dayCellOther : ''} ${isToday ? styles.dayCellToday : ''}`}
                    onDoubleClick={() => cell.currentMonth && openNewModal(cell.day)}
                  >
                    <span className={styles.dayNumber}>{cell.day}</span>
                    {dayVenc && dayVenc.map((v) => (
                      <div
                        key={v._id}
                        className={`${styles.dayEvent} ${
                          v.estado === 'al_dia' ? styles.dayEventPaid :
                          v.estado === 'pendiente' ? styles.dayEventPending :
                          styles.dayEventOverdue
                        }`}
                        title={v.estado === 'al_dia' ? 'Doble click para marcar como pendiente' : 'Doble click para marcar como pagado'}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          toggleEstado(v)
                        }}
                      >
                        <span className={styles.dayEventLabel}>
                          {v.tipo === 'monotributo' ? 'Monotributo' : (v.titulo || v.descripcion)}
                        </span>
                        {v.estado === 'al_dia' && <span className={styles.dayEventBadge}>Pagado</span>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Vencimientos Panel */}
          <aside className={styles.vencPanel}>
            <div className={styles.vencPanelHeader}>
              <h2 className={styles.vencPanelTitle}>Vencimientos del Mes</h2>
              <p className={styles.vencPanelSubtitle}>Detalle de obligaciones</p>
            </div>

            {loading ? (
              <div className={styles.vencList}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.skeletonVencCard}>
                    <div className={styles.skeletonVencTop}>
                      <div className={styles.skeletonVencTitle} />
                      <div className={styles.skeletonVencBadge} />
                    </div>
                    <div className={styles.skeletonVencDate} />
                    <div className={styles.skeletonVencBottom}>
                      <div className={styles.skeletonVencMonto} />
                      <div className={styles.skeletonVencBtn} />
                    </div>
                  </div>
                ))}
              </div>
            ) : vencimientos.length === 0 ? (
              <div className={styles.vencEmpty}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className={styles.vencEmptyTitle}>Sin vencimientos</p>
                <p className={styles.vencEmptyText}>
                  {user.perfilCompleto
                    ? 'Estás al día con tus obligaciones de este mes.'
                    : 'Completá tu perfil para ver tus vencimientos.'}
                </p>
              </div>
            ) : (
              <div className={styles.vencList}>
                {vencimientos.map(v => {
                  const dayNum = getUTCDay(v.fechaVencimiento)
                  const monthShort = MONTH_NAMES[getUTCMonthIndex(v.fechaVencimiento)].slice(0, 3)
                  const isPast = new Date(v.fechaVencimiento) < today
                  return (
                    <div
                      key={v._id}
                      className={styles.vencCard}
                      onClick={() => setSelectedVenc(v)}
                    >
                      <div className={styles.vencCardTop}>
                        <div>
                          <h3 className={styles.vencCardTitle}>{v.tipo === 'custom' ? (v.titulo || v.descripcion) : v.descripcion}</h3>
                          <span className={`${styles.vencCardStatus} ${statusClass(v.estado)}`}>
                            {statusLabel(v.estado)}
                          </span>
                        </div>
                      </div>
                      <p className={styles.vencCardDate}>
                        {isPast ? `Venció el ${dayNum} de ${monthShort}` : `Vence el ${dayNum} de ${monthShort}`}
                      </p>
                      <div className={styles.vencCardBottom}>
                        <span className={styles.vencCardMonto}>{formatMonto(v.monto)}</span>
                        <button className={styles.vencCardBtnDetails} onClick={(e) => { e.stopPropagation(); setSelectedVenc(v) }}>
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div className={styles.vencAllGood}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div>
                    <p className={styles.vencAllGoodTitle}>Sin más vencimientos</p>
                    <p className={styles.vencAllGoodText}>Estás al día con tus obligaciones de este mes.</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
        <AppFooter />
      </div>

      {modalOpen && (
        <NuevoVencimientoModal
          isoDate={modalDate}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {selectedVenc && (
        <div className={styles.detailOverlay} onClick={() => setSelectedVenc(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.detailCloseBtn} onClick={() => setSelectedVenc(null)} aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <p className={styles.detailType}>{selectedVenc.tipo === 'monotributo' ? 'Monotributo AFIP' : 'Vencimiento custom'}</p>
            <h3 className={styles.detailTitle}>
              {selectedVenc.tipo === 'custom' ? (selectedVenc.titulo || selectedVenc.descripcion) : selectedVenc.descripcion}
            </h3>
            <span className={`${styles.vencCardStatus} ${statusClass(selectedVenc.estado)}`} style={{ marginBottom: 16, display: 'inline-block' }}>
              {statusLabel(selectedVenc.estado)}
            </span>

            <div className={styles.detailMonto}>{formatMonto(selectedVenc.monto)}</div>
            <p className={styles.detailDate}>
              {new Date(selectedVenc.fechaVencimiento) < today
                ? `Venció el ${getUTCDay(selectedVenc.fechaVencimiento)} de ${MONTH_NAMES[getUTCMonthIndex(selectedVenc.fechaVencimiento)]}`
                : `Vence el ${getUTCDay(selectedVenc.fechaVencimiento)} de ${MONTH_NAMES[getUTCMonthIndex(selectedVenc.fechaVencimiento)]}`}
            </p>

            <div className={styles.detailActions}>
              {selectedVenc.estado === 'pendiente' && (
                <button className={styles.vencCardBtnBlue} onClick={() => { toggleEstado(selectedVenc); setSelectedVenc(null) }}>
                  ✓ Marcar como pagado
                </button>
              )}
              {selectedVenc.estado === 'vencido' && (
                <button className={styles.vencCardBtnRed} onClick={() => { toggleEstado(selectedVenc); setSelectedVenc(null) }}>
                  Regularizar
                </button>
              )}
              {selectedVenc.estado === 'al_dia' && (
                <button className={styles.vencCardBtnGhost} onClick={() => { toggleEstado(selectedVenc); setSelectedVenc(null) }}>
                  Marcar como pendiente
                </button>
              )}
              {selectedVenc.tipo === 'custom' && (
                <button className={styles.detailDeleteBtn} onClick={() => deleteVencimiento(selectedVenc)}>
                  Eliminar vencimiento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
