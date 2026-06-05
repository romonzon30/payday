import { useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import AppSidebar from '../components/AppSidebar'
import styles from './ImpuestosPage.module.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const CATEGORIA_LABELS: Record<string, string> = {
  aportes: 'Aportes',
  empleadores: 'Empleadores',
  ganancias: 'Ganancias',
  provincial: 'Provincial',
  impuestos: 'Impuestos',
  retenciones: 'Retenciones',
}

interface ImpuestoPreview {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  cuitGrupo: number[]
  fechaVencimiento: string
  yaAgregado: boolean
  vencimientoId: string | null
}

interface ImpuestosPageProps {
  user: User
  onGoToCalendar: () => void
  onGoToDashboard: () => void
  onGoToProfile: () => void
  onLogout: () => void
}

const CATEGORIAS = ['todas', 'aportes', 'empleadores', 'ganancias', 'impuestos', 'retenciones', 'provincial']

export default function ImpuestosPage({ user, onGoToCalendar, onGoToDashboard, onGoToProfile, onLogout }: ImpuestosPageProps) {
  const today = new Date()
  const [year, setYear]   = useState(today.getUTCFullYear())
  const [month, setMonth] = useState(today.getUTCMonth())
  const [impuestos, setImpuestos] = useState<ImpuestoPreview[]>([])
  const [loading, setLoading]     = useState(true)
  const [catFilter, setCatFilter] = useState('todas')
  const [adding, setAdding] = useState<string | null>(null)
  const [montos, setMontos]       = useState<Record<string, string>>({})
  const [montoErrors, setMontoErrors] = useState<Record<string, string>>({})
  const [notif, setNotif]         = useState<Record<string, boolean>>({})
  const [periodico, setPeriodico] = useState<Record<string, boolean>>({})
  const [addResult, setAddResult] = useState<Record<string, string>>({})
  const [error, setError]         = useState<string | null>(null)

  const token = localStorage.getItem('token')

  const fetchPreview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/impuestos/preview?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al cargar impuestos')
      const data = await res.json()
      setImpuestos(data.impuestos)
      // initialize notif toggles to true for unadded
      const n: Record<string, boolean> = {}
      data.impuestos.forEach((i: ImpuestoPreview) => { n[i.id] = true })
      setNotif((prev) => ({ ...n, ...prev }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [year, month, token])

  useEffect(() => { fetchPreview() }, [fetchPreview])

  async function handleAgregar(imp: ImpuestoPreview) {
    // ── Validate monto ──────────────────────────────────────
    const montoVal = parseFloat(montos[imp.id] || '0')
    if (!montoVal || montoVal <= 0) {
      setMontoErrors(prev => ({ ...prev, [imp.id]: 'Ingresá un monto mayor a $0' }))
      return
    }
    setMontoErrors(prev => ({ ...prev, [imp.id]: '' }))

    const isPeriodico = periodico[imp.id] ?? false

    setAdding(imp.id)
    setAddResult(prev => ({ ...prev, [imp.id]: '' }))
    try {
      const res = await fetch(`${API_URL}/api/impuestos/agregar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impuestoId: imp.id,
          year,
          month,
          monto: montoVal,
          notificarEmail: notif[imp.id] ?? true,
          periodico: isPeriodico,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al agregar')
      if (isPeriodico && data.count != null) {
        setAddResult(prev => ({ ...prev, [imp.id]: `✓ Agregado para ${data.count} mes${data.count !== 1 ? 'es' : ''}` }))
      }
      await fetchPreview()
    } catch (e: unknown) {
      setMontoErrors(prev => ({ ...prev, [imp.id]: e instanceof Error ? e.message : 'Error al agregar' }))
    } finally {
      setAdding(null)
    }
  }

  async function handleEliminar(imp: ImpuestoPreview) {
    if (!imp.vencimientoId) return
    try {
      const res = await fetch(`${API_URL}/api/impuestos/${imp.vencimientoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al eliminar')
      await fetchPreview()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const filtered = catFilter === 'todas' ? impuestos : impuestos.filter(i => i.categoria === catFilter)
  const addedCount = impuestos.filter(i => i.yaAgregado).length

  return (
    <div className={styles.page}>
      <AppSidebar
        user={user}
        activeView="impuestos"
        onGoToDashboard={onGoToDashboard}
        onGoToCalendar={onGoToCalendar}
        onGoToImpuestos={() => {}}
        onGoToProfile={onGoToProfile}
        onLogout={onLogout}
      />

      {/* Main */}
      <div className={styles.mainWrapper}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>Impuestos AFIP</h1>
            <p className={styles.pageSubtitle}>
              Calendario Errepar 2026 · CUIT termina en <strong>{user.cuit ? user.cuit.replace(/[-\s]/g, '').slice(-1) : '–'}</strong>
              {addedCount > 0 && <span className={styles.addedBadge}>{addedCount} agregado{addedCount !== 1 ? 's' : ''}</span>}
            </p>
          </div>
        </header>

        {/* Month selector */}
        <div className={styles.monthBar}>
          <button className={styles.monthArrow} onClick={prevMonth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className={styles.monthLabel}>{MONTH_NAMES[month]} {year}</span>
          <button className={styles.monthArrow} onClick={nextMonth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {/* Category filters */}
        <div className={styles.filterBar}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${catFilter === cat ? styles.filterBtnActive : ''}`}
              onClick={() => setCatFilter(cat)}
            >
              {cat === 'todas' ? 'Todas' : CATEGORIA_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className={styles.main}>
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonBadge} />
                    <div className={styles.skeletonBadgeSmall} />
                  </div>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonSubtitle} />
                  <div className={styles.skeletonDateBlock}>
                    <div className={styles.skeletonDateNum} />
                    <div className={styles.skeletonDateLabel} />
                  </div>
                  <div className={styles.skeletonBar} />
                  <div className={styles.skeletonActions}>
                    <div className={styles.skeletonToggle} />
                    <div className={styles.skeletonToggle} />
                  </div>
                  <div className={styles.skeletonBtn} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={styles.stateMsg}>{error}</div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(imp => {
                const fecha = new Date(imp.fechaVencimiento)
                const day   = fecha.getUTCDate()
                const diffMs = fecha.getTime() - Date.now()
                const diffDays = Math.ceil(diffMs / 86400000)
                const grupoDigs = imp.cuitGrupo.length > 0
                  ? (imp.cuitGrupo[0] === imp.cuitGrupo[imp.cuitGrupo.length - 1]
                    ? `${imp.cuitGrupo[0]}`
                    : `${imp.cuitGrupo[0]}-${imp.cuitGrupo[imp.cuitGrupo.length - 1]}`)
                  : '–'

                return (
                  <div key={imp.id} className={`${styles.card} ${imp.yaAgregado ? styles.cardAdded : ''}`}>
                    <div className={styles.cardHeader}>
                      <span className={`${styles.catBadge} ${styles[`cat_${imp.categoria}`]}`}>
                        {CATEGORIA_LABELS[imp.categoria] || imp.categoria}
                      </span>
                      {imp.yaAgregado && (
                        <span className={styles.checkBadge}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Agregado
                        </span>
                      )}
                    </div>

                    <h3 className={styles.cardName}>{imp.nombre}</h3>
                    <p className={styles.cardDesc}>{imp.descripcion}</p>

                    <div className={styles.cardDate}>
                      <span className={styles.cardDay}>{day}</span>
                      <div className={styles.cardDateInfo}>
                        <span className={styles.cardMonthLabel}>{MONTH_NAMES[month]} {year}</span>
                        <span className={styles.cardCuit}>CUIT …{grupoDigs}</span>
                        {diffDays > 0
                          ? <span className={styles.cardCountdown}>en {diffDays} día{diffDays !== 1 ? 's' : ''}</span>
                          : diffDays === 0
                            ? <span className={`${styles.cardCountdown} ${styles.cardCountdownToday}`}>¡Hoy!</span>
                            : <span className={`${styles.cardCountdown} ${styles.cardCountdownPast}`}>hace {Math.abs(diffDays)} día{Math.abs(diffDays) !== 1 ? 's' : ''}</span>
                        }
                      </div>
                    </div>

                    {!imp.yaAgregado && (() => {
                      const isPast = new Date(imp.fechaVencimiento) < new Date()
                      const isPeriodico = periodico[imp.id] ?? false
                      const montoErr = montoErrors[imp.id]
                      const result = addResult[imp.id]
                      const btnDisabled = adding === imp.id || (isPast && !isPeriodico)

                      return (
                        <div className={styles.cardActions}>
                          {/* Monto */}
                          <div className={styles.inputGroup}>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className={`${styles.montoInput} ${montoErr ? styles.montoInputError : ''}`}
                              placeholder="Monto *"
                              value={montos[imp.id] ?? ''}
                              onChange={e => {
                                setMontos(prev => ({ ...prev, [imp.id]: e.target.value }))
                                setMontoErrors(prev => ({ ...prev, [imp.id]: '' }))
                              }}
                            />
                            {montoErr && <span className={styles.fieldError}>{montoErr}</span>}
                          </div>

                          {/* Past date warning */}
                          {isPast && !isPeriodico && (
                            <div className={styles.pastWarning}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              Esta fecha ya venció. Usá la opción periódica o cambiá el mes.
                            </div>
                          )}

                          {/* Options row */}
                          <div className={styles.optionsRow}>
                            <label className={styles.toggleLabel}>
                              <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={notif[imp.id] ?? true}
                                onChange={e => setNotif(prev => ({ ...prev, [imp.id]: e.target.checked }))}
                              />
                              <span className={styles.toggleTrack} />
                              <span className={styles.toggleText}>Notificarme</span>
                            </label>
                            <label className={styles.toggleLabel}>
                              <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={isPeriodico}
                                onChange={e => setPeriodico(prev => ({ ...prev, [imp.id]: e.target.checked }))}
                              />
                              <span className={styles.toggleTrack} />
                              <span className={styles.toggleText}>Repetir mensualmente</span>
                            </label>
                          </div>

                          {isPeriodico && (
                            <div className={styles.periodicoHint}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                              Se agregará en todos los meses restantes del año con fecha futura
                            </div>
                          )}

                          {result && <div className={styles.resultMsg}>{result}</div>}

                          <button
                            className={styles.addBtn}
                            onClick={() => handleAgregar(imp)}
                            disabled={btnDisabled}
                          >
                            {adding === imp.id ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinner}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            )}
                            {isPeriodico ? 'Agregar para todos los meses' : 'Agregar al calendario'}
                          </button>
                        </div>
                      )
                    })()}

                    {imp.yaAgregado && (
                      <div className={styles.cardActionsAdded}>
                        <span className={styles.addedNote}>Aparece en tu calendario</span>
                        <button className={styles.removeBtn} onClick={() => handleEliminar(imp)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
