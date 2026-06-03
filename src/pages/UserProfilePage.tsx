import { useState } from 'react'
import type { User } from '../types'
import styles from './UserProfilePage.module.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

interface UserProfilePageProps {
  user: User
  onBack: () => void
  onUserUpdated: (user: User) => void
  onProfileCompleted: (user: User) => void
  onLogout: () => void
}

export default function UserProfilePage({ user, onBack, onUserUpdated, onProfileCompleted, onLogout }: UserProfilePageProps) {
  const [nombreCompleto, setNombreCompleto] = useState(user.nombreCompleto)
  const [cuit, setCuit] = useState(user.cuit || '')
  const [emailNotificaciones, setEmailNotificaciones] = useState(user.emailNotificaciones)
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
          emailNotificaciones: emailNotificaciones.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
  const isNewCuil = cuit.trim() && !user.cuit

  if (isNewCuil) {
    await fetch(`${API_URL}/api/due-dates/generate-monotributo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  onUserUpdated(data.user)

  if (isNewCuil) {
    onProfileCompleted(data.user)
  } else {
    setSuccess('Perfil actualizado correctamente.')
  }
}
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
      <header className={styles.navbar}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Volver
        </button>
        <span className={styles.brand}>PAYDAY</span>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

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
