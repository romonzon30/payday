import { useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import AppFooter from '../components/AppFooter'
import NuevoVencimientoModal from '../components/NuevoVencimientoModal'
import styles from './CalendarPage.module.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

interface CalendarPageProps {
  user: User
  onBack: () => void
  onGoToProfile: () => void
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
  notificarSms?: boolean
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

export default function CalendarPage({ user, onBack, onGoToProfile, onLogout }: CalendarPageProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState('')

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

  // Map vencimiento dates to days
  const vencByDay: Record<number, Vencimiento[]> = {}
  for (const v of vencimientos) {
    const d = new Date(v.fechaVencimiento).getDate()
    if (!vencByDay[d]) vencByDay[d] = []
    vencByDay[d].push(v)
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <span className={styles.brand}>PAYDAY</span>
        <nav className={styles.nav}>
          <button className={styles.navItem} onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Inicio
          </button>
          <button className={`${styles.navItem} ${styles.navItemActive}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Calendario
          </button>
          <button className={styles.navItem} onClick={onGoToProfile}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.636-6.364-1.414 1.414M6.05 17.95l-1.414 1.414m0-12.728 1.414 1.414m11.314 11.314 1.414 1.414" /></svg>
            Configuración
          </button>
        </nav>
        <div className={styles.sidebarBottom}>
          <button className={styles.navItem} onClick={onLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>{MONTH_NAMES[currentMonth]} {currentYear}</h1>
            <p className={styles.pageSubtitle}>Monotributo y Vencimientos AFIP</p>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.profileBtn} onClick={onGoToProfile}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.avatarFallback}>
                  {user.nombreCompleto.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
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
              <div className={styles.vencLoading}>Cargando...</div>
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
                  const vDate = new Date(v.fechaVencimiento)
                  const dayNum = vDate.getDate()
                  const monthShort = MONTH_NAMES[vDate.getMonth()].slice(0, 3)
                  const isPast = vDate < today
                  return (
                    <div key={v._id} className={styles.vencCard}>
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
                        {v.estado === 'pendiente' && (
                          <button className={styles.vencCardBtnBlue}>Pagar ahora</button>
                        )}
                        {v.estado === 'vencido' && (
                          <button className={styles.vencCardBtnRed}>Regularizar</button>
                        )}
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
    </div>
  )
}
