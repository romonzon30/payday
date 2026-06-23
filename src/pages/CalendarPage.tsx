import { useState } from 'react'
import Lottie from 'lottie-react'
import type { User, Vencimiento, View } from '../types'
import loadingAnimation from '../assets/loading.json'
import AppFooter from '../components/AppFooter'
import AppSidebar from '../components/AppSidebar'
import NuevoVencimientoModal from '../components/NuevoVencimientoModal'
import VencimientoDetailModal from '../components/VencimientoDetailModal'
import { useVencimientos } from '../hooks/useVencimientos'
import { MONTH_NAMES, DAYS_HEADER, getCalendarDays, formatMonto, statusLabel, vencimientoDateLabel } from '../utils/fecha'
import styles from './CalendarPage.module.css'

interface CalendarPageProps {
  user: User
  onBack: () => void
  onGoToProfile: () => void
  onGoToImpuestos: () => void
  onLogout: () => void
  onNavigate: (view: View) => void
}

const MAX_FISCAL_YEAR = 2026

function statusClass(estado: string): string {
  if (estado === 'al_dia') return styles.statusAlDia
  if (estado === 'pendiente') return styles.statusPendiente
  return styles.statusVencido
}

export default function CalendarPage({ user, onBack, onGoToProfile, onGoToImpuestos, onLogout, onNavigate }: CalendarPageProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const { vencimientos, loading, error, refetch, toggleEstado, remove } = useVencimientos(currentYear, currentMonth)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState('')
  const [selectedVenc, setSelectedVenc] = useState<Vencimiento | null>(null)

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
    refetch()
  }

  async function deleteVencimiento(v: Vencimiento) {
    const ok = await remove(v)
    if (ok) setSelectedVenc(null)
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

  // Fiscal year cap: the tax data only covers 2026, so the calendar stops at
  // December 2026 — there's nothing to show beyond it.
  const atFiscalEnd = currentYear >= MAX_FISCAL_YEAR && currentMonth >= 11

  function goNext() {
    if (atFiscalEnd) return
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
              <button
                className={styles.calendarNavBtn}
                onClick={goNext}
                disabled={atFiscalEnd}
                aria-label="Mes siguiente"
                title={atFiscalEnd ? 'Diciembre 2026 es el último mes disponible' : undefined}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <button className={styles.newBtn} onClick={() => openNewModal()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo vencimiento
              </button>
            </div>

            {loading ? (
              <div className={styles.calendarLoading}>
                <Lottie animationData={loadingAnimation} loop className={styles.calendarLottie} />
                <p className={styles.calendarLoadingText}>Cargando vencimientos…</p>
              </div>
            ) : (
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
            )}
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
            ) : error ? (
              <div className={styles.vencEmpty}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className={styles.vencEmptyTitle}>No pudimos cargar tus vencimientos</p>
                <p className={styles.vencEmptyText}>Revisá tu conexión e intentá de nuevo.</p>
                <button className={styles.todayBtn} onClick={refetch} style={{ marginTop: 12 }}>Reintentar</button>
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
                {vencimientos.map(v => (
                  <div
                    key={v._id}
                    className={styles.vencCard}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalle de ${v.tipo === 'custom' ? (v.titulo || v.descripcion) : v.descripcion}`}
                    onClick={() => setSelectedVenc(v)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedVenc(v) } }}
                  >
                    <div className={styles.vencCardTop}>
                      <div>
                        <h3 className={styles.vencCardTitle}>{v.tipo === 'custom' ? (v.titulo || v.descripcion) : v.descripcion}</h3>
                        <span className={`${styles.vencCardStatus} ${statusClass(v.estado)}`}>
                          {statusLabel(v.estado)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.vencCardDate}>{vencimientoDateLabel(v.fechaVencimiento)}</p>
                    <div className={styles.vencCardBottom}>
                      <span className={styles.vencCardMonto}>{formatMonto(v.monto)}</span>
                      <button className={styles.vencCardBtnDetails} onClick={(e) => { e.stopPropagation(); setSelectedVenc(v) }}>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
        <AppFooter onNavigate={onNavigate} />
      </div>

      {modalOpen && (
        <NuevoVencimientoModal
          isoDate={modalDate}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {selectedVenc && (
        <VencimientoDetailModal
          venc={selectedVenc}
          onClose={() => setSelectedVenc(null)}
          onToggleEstado={(v) => { toggleEstado(v); setSelectedVenc(null) }}
          onDelete={deleteVencimiento}
        />
      )}
    </div>
  )
}
