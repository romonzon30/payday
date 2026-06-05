import { useState, useEffect } from 'react'
import styles from './NuevoVencimientoModal.module.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

interface NuevoVencimientoModalProps {
  isoDate: string // YYYY-MM-DD inicial sugerido
  onClose: () => void
  onCreated: () => void
}

export default function NuevoVencimientoModal({ isoDate, onClose, onCreated }: NuevoVencimientoModalProps) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(isoDate)
  const [notifEmail, setNotifEmail] = useState(false)
  const [recurrente, setRecurrente] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFecha(isoDate)
  }, [isoDate])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!titulo.trim()) {
      setError('El título es obligatorio')
      return
    }
    if (!fecha) {
      setError('La fecha es obligatoria')
      return
    }
    if (monto === '' || Number.isNaN(Number(monto)) || Number(monto) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/user/vencimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || titulo.trim(),
          monto: monto ? Number(monto) : 0,
          fechaVencimiento: fecha,
          notificarEmail: notifEmail,
          recurrente,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'No se pudo crear el vencimiento')
        setLoading(false)
        return
      }

      onCreated()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Nuevo vencimiento</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="titulo">Título *</label>
            <input
              id="titulo"
              className={styles.input}
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Alquiler oficina"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="descripcion">Descripción (opcional)</label>
            <textarea
              id="descripcion"
              className={styles.textarea}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Notas adicionales"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="fecha">Fecha *</label>
              <input
                id="fecha"
                className={styles.input}
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="monto">Monto *</label>
              <input
                id="monto"
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <p className={styles.checkboxGroupTitle}>Recurrencia</p>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={recurrente}
                onChange={(e) => setRecurrente(e.target.checked)}
              />
              Repetir todos los meses del año
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <p className={styles.checkboxGroupTitle}>Notificaciones</p>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
              />
              Notificar por email
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Creando...' : 'Crear vencimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
