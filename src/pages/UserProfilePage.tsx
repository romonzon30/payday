import { useState } from 'react'
import type { User } from '../types'
import AppSidebar from '../components/AppSidebar'
import styles from './UserProfilePage.module.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

interface UserProfilePageProps {
  user: User
  onBack: () => void
  onGoToCalendar: () => void
  onGoToImpuestos: () => void
  onUserUpdated: (user: User) => void
  onProfileCompleted: (user: User) => void
  onLogout: () => void
}

export default function UserProfilePage({ user, onBack, onGoToCalendar, onGoToImpuestos, onUserUpdated, onProfileCompleted, onLogout }: UserProfilePageProps) {
  const [nombreCompleto, setNombreCompleto] = useState(user.nombreCompleto)
  const [cuit, setCuit] = useState(user.cuit || '')
  const [categoriaMonotributo, setCategoriaMonotributo] = useState(user.categoriaMonotributo || '')
  const [emailNotificaciones, setEmailNotificaciones] = useState(user.emailNotificaciones)
  const [inicioActividad, setInicioActividad] = useState<'normal' | 'primer_anio' | 'segundo_anio'>(user.inicioActividad || 'normal')
  const [personasACargo, setPersonasACargo] = useState(user.personasACargo ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombreCompleto.trim() || !emailNotificaciones.trim()) {
      setError('Nombre y email son requeridos')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombreCompleto: nombreCompleto.trim(),
          cuit: cuit.trim() || undefined,
          categoriaMonotributo: categoriaMonotributo.trim() || undefined,
          emailNotificaciones: emailNotificaciones.trim(),
          inicioActividad,
          personasACargo,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const isNewCuil = cuit.trim() && !user.cuit
        onUserUpdated(data.user)
        if (isNewCuil) {
          onProfileCompleted(data.user)
        } else {
          setSuccess('Perfil actualizado correctamente.')
        }
      } else {
        setError(data.message || 'Error al actualizar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <AppSidebar
        user={user}
        activeView="profile"
        onGoToDashboard={onBack}
        onGoToCalendar={onGoToCalendar}
        onGoToImpuestos={onGoToImpuestos}
        onGoToProfile={() => {}}
        onLogout={onLogout}
      />

      <main className={styles.main}>
        <div className={styles.profileHeader}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
          ) : (
            <span className={styles.avatarFallback}>
              {user.nombreCompleto.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className={styles.title}>Información personal</h1>
            <p className={styles.subtitle}>{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="nombreCompleto">Nombre Completo</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="nombreCompleto"
                className={styles.input}
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cuit">
              CUIL
              {!user.cuit && <span className={styles.labelHint}> — Al agregar tu CUIL se vinculará con AFIP</span>}
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M7 15h.01M11 15h.01M15 15h.01" />
                  <path d="M7 11h.01M11 11h.01M15 11h.01" />
                  <path d="M7 7h.01M11 7h.01" />
                </svg>
              </span>
              <input
                id="cuit"
                className={styles.input}
                type="text"
                placeholder="Ej. 20-12345678-9"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="categoriaMonotributo">Categoría Monotributo</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
              <select
                id="categoriaMonotributo"
                className={styles.input}
                value={categoriaMonotributo}
                onChange={(e) => setCategoriaMonotributo(e.target.value)}
              >
                <option value="">Selecciona una categoría</option>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="emailNotificaciones">Email de Notificaciones</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="emailNotificaciones"
                className={styles.input}
                type="email"
                value={emailNotificaciones}
                onChange={(e) => setEmailNotificaciones(e.target.value)}
                required
              />
            </div>
          </div>

          {user.categoriaMonotributo && (
            <div className={styles.afipInfo}>
              <span className={styles.afipLabel}>Categoría Monotributo</span>
              <span className={styles.afipValue}>{user.categoriaMonotributo}</span>
            </div>
          )}

          {/* Modificadores de precio */}
          <div className={styles.modSection}>
            <h2 className={styles.modTitle}>Modificadores del monto</h2>
            <p className={styles.modSubtitle}>Estos parámetros ajustan el monto mensual generado.</p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="inicioActividad">Situación de inicio de actividad</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <select
                  id="inicioActividad"
                  className={styles.input}
                  value={inicioActividad}
                  onChange={(e) => setInicioActividad(e.target.value as 'normal' | 'primer_anio' | 'segundo_anio')}
                >
                  <option value="normal">Normal (100% del monto)</option>
                  <option value="primer_anio">Primer año de actividad (50% de descuento)</option>
                  <option value="segundo_anio">Segundo año de actividad (25% de descuento)</option>
                </select>
              </div>
            </div>

            {['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].includes(categoriaMonotributo) && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="personasACargo">
                  Personas a cargo en obra social
                  <span className={styles.labelHint}> — agrega el costo de OS por cada familiar</span>
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </span>
                  <select
                    id="personasACargo"
                    className={styles.input}
                    value={personasACargo}
                    onChange={(e) => setPersonasACargo(Number(e.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n === 0 ? 'Ninguna' : `${n} persona${n > 1 ? 's' : ''}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onBack}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
