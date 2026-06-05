import Lottie from 'lottie-react'
import type { User } from '../types'
import celebrationAnimation from '../assets/celebration.json'
import styles from './ProfileCompletedPage.module.css'

interface ProfileCompletedPageProps {
  user: User
  onGoToDashboard: () => void
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function adjustToNextBusinessDay(date: Date): Date {
  const d = new Date(date)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

function getMonotributoVencimientoDay(year: number, month: number): number {
  const fecha = adjustToNextBusinessDay(new Date(year, month, 20, 12, 0, 0))
  return fecha.getDate()
}

export default function ProfileCompletedPage({ user, onGoToDashboard }: ProfileCompletedPageProps) {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.lottieWrapper}>
          <Lottie animationData={celebrationAnimation} loop={false} className={styles.lottie} />
        </div>

        <h1 className={styles.title}>¡Felicidades!</h1>
        <p className={styles.subtitle}>Tu perfil fue completado exitosamente</p>

        <div className={styles.monotributoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardBadge}>Monotributo</div>
            <span className={styles.cardCategory}>Categoría {user.categoriaMonotributo || '—'}</span>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>Nombre</span>
              <span className={styles.cardValue}>{user.nombreCompleto}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>CUIL</span>
              <span className={styles.cardValue}>{user.cuit || '—'}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>Email</span>
              <span className={styles.cardValue}>{user.emailNotificaciones}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>Estado</span>
              <span className={`${styles.cardValue} ${styles.statusActive}`}>
                {user.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className={styles.vencimientosSection}>
            <h3 className={styles.vencimientosTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Vencimientos mensuales
            </h3>
            <div className={styles.vencimientosGrid}>
              {MESES.map((mes, i) => {
                const isPast = i < currentMonth
                const isCurrent = i === currentMonth
                const vencDay = getMonotributoVencimientoDay(currentYear, i)
                return (
                  <div
                    key={mes}
                    className={`${styles.vencItem} ${isPast ? styles.vencPast : ''} ${isCurrent ? styles.vencCurrent : ''}`}
                  >
                    <span className={styles.vencMes}>{mes.slice(0, 3)}</span>
                    <span className={styles.vencDay}>{vencDay}</span>
                    <span className={styles.vencYear}>{currentYear}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <button className={styles.dashboardBtn} onClick={onGoToDashboard}>
          Ir al panel
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
