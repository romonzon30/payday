import { useState, useCallback } from 'react'
import { useGoogleLogin } from "@react-oauth/google";
import styles from './RegisterCard.module.css'

interface RegisterCardProps {
  token: string
  user: { nombreCompleto: string; email: string }
  hasGoogleData: boolean
  onComplete: () => void
  onBackToLogin: () => void
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

export default function RegisterCard({ token, user, hasGoogleData, onComplete }: RegisterCardProps) {
  const [nombreCompleto, setNombreCompleto] = useState(user.nombreCompleto || '')
  const [dni, setDni] = useState('')
  const [emailNotificaciones, setEmailNotificaciones] = useState(user.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const doRegister = useCallback(async (authToken: string) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: authToken,
          nombreCompleto: nombreCompleto.trim(),
          dni: dni.trim(),
          emailNotificaciones: emailNotificaciones.trim(),
        }),
      })

      if (res.ok) {
        localStorage.setItem('token', authToken)
        onComplete()
      } else {
        const data = await res.json()
        setError(data.message || 'Error al completar registro')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [nombreCompleto, dni, emailNotificaciones, onComplete])

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (response) => {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/auth/google-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: response.access_token,
            nombreCompleto: nombreCompleto.trim(),
            dni: dni.trim(),
          }),
        })

        const data = await res.json()
        if (res.ok) {
          localStorage.setItem('token', data.token)
          onComplete()
        } else {
          setError(data.message || 'Error al autenticar con Google')
        }
      } catch {
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('Error al iniciar sesión con Google'),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombreCompleto.trim() || !dni.trim() || !emailNotificaciones.trim()) {
      setError('Completa todos los campos requeridos')
      return
    }
    setError('')

    if (hasGoogleData && token) {
      await doRegister(token)
    } else {
      googleLogin()
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.progress}>
        <div className={styles.progressLabel}>
          <span>Paso 1 de 2</span>
          <span>Información Básica</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.heading}>Crea tu cuenta</h2>
        <p className={styles.subtitle}>Comencemos con tus datos principales.</p>
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
              placeholder="Ej. Juan Pérez"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="dni">DNI / CUIL</label>
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
              id="dni"
              className={styles.input}
              type="text"
              placeholder="Ej. 20-12345678-9"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
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
              placeholder="tu@email.com"
              value={emailNotificaciones}
              onChange={(e) => setEmailNotificaciones(e.target.value)}
              disabled={hasGoogleData}
              required
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Guardando...' : 'Continuar'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
