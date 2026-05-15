import GoogleIcon from './GoogleIcon'
import ShieldIcon from './ShieldIcon'
import WalletIcon from './WalletIcon'
import styles from './LoginCard.module.css'

interface LoginCardProps {
  onGoogleSignIn?: () => void
}

export default function LoginCard({ onGoogleSignIn }: LoginCardProps) {
  const handleGoogleSignIn = () => {
    if (onGoogleSignIn) {
      onGoogleSignIn()
    } else {
      // Default: redirect to Google OAuth
      console.log('Initiating Google Sign-In...')
    }
  }

  return (
    <div className={styles.card}>
      {/* Logo Icon */}
      <div className={styles.iconWrapper}>
        <WalletIcon />
      </div>

      {/* Heading */}
      <h1 className={styles.heading}>Simplifica tus impuestos</h1>

      {/* Subtitle */}
      <p className={styles.subtitle}>
        Accede a tu cuenta de PayDay de forma segura y gestiona tus obligaciones
        fiscales en segundos.
      </p>

      {/* Google Sign-In Button */}
      <button
        className={styles.googleBtn}
        onClick={handleGoogleSignIn}
        type="button"
        aria-label="Iniciar sesión con Google"
      >
        <GoogleIcon />
        <span>Iniciar sesión con Google</span>
      </button>

      {/* Divider */}
      <div className={styles.divider} role="separator" />

      {/* Security Badge */}
      <div className={styles.securityBadge}>
        <ShieldIcon />
        <span>CONEXIÓN SEGURA DE NIVEL BANCARIO</span>
      </div>
    </div>
  )
}
