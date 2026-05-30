import type { User } from '../types'
import LoginCard from '../components/LoginCard'
import styles from './LoginPage.module.css'

interface LoginPageProps {
  onLoginSuccess: (token: string, user: User) => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <div className={styles.splitLayout}>
      <div className={styles.leftColumn}>
        <div className={styles.leftBg}>
          <img src="/login-bg.jpg" alt="" className={styles.leftBgImg} />
          <div className={styles.leftBgOverlay} />
        </div>
        <div className={styles.leftContent}>
          <h1 className={styles.brand}>PAYDAY</h1>
          <div className={styles.valueProp}>
            <div className={styles.badge}>
              <span className={styles.badgeIcon}>verified</span>
              AFIP Monotributo Simplificado
            </div>
            <h2 className={styles.tagline}>
              La claridad financiera<br />que tu negocio necesita.
            </h2>
            <p className={styles.description}>
              Gestiona tu facturación, controla tus vencimientos y mantén tus
              cuentas al día en una plataforma diseñada para reducir la carga
              burocrática.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.mobileBrand}>
          <h1>PAYDAY</h1>
        </div>
        <LoginCard onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  )
}