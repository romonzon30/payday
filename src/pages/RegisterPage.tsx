import RegisterCard from '../components/RegisterCard'
import styles from './RegisterPage.module.css'

interface RegisterPageProps {
  token: string
  user: { nombreCompleto: string; email: string }
  hasGoogleData: boolean
  onComplete: () => void
  onBackToLogin: () => void
}

export default function RegisterPage({ token, user, hasGoogleData, onComplete, onBackToLogin }: RegisterPageProps) {
  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <div className={styles.brand}>
          <h1>PAYDAY</h1>
          <p>Simplificando tu gestión financiera.</p>
        </div>

        <RegisterCard
          token={token}
          user={user}
          hasGoogleData={hasGoogleData}
          onComplete={onComplete}
          onBackToLogin={onBackToLogin}
        />

        <div className={styles.footer}>
          ¿Ya tienes una cuenta?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin() }} className={styles.footerLink}>
            Inicia sesión
          </a>
        </div>
      </main>
    </div>
  )
}
