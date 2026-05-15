import LoginCard from '../components/LoginCard'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    // TODO: implement Google OAuth flow
    // e.g. window.location.href = '/auth/google'
    alert('Redirecting to Google OAuth...')
  }

  return (
    <main className={styles.page}>
      <LoginCard onGoogleSignIn={handleGoogleSignIn} />
    </main>
  )
}
