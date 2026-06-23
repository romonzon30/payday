import type { View } from '../types'
import styles from './AppFooter.module.css'

interface AppFooterProps {
  onNavigate?: (view: View) => void
}

export default function AppFooter({ onNavigate }: AppFooterProps) {
  const nav = (view: View) => (e: React.MouseEvent) => {
    e.preventDefault()
    onNavigate?.(view)
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>PAYDAY</span>
          <p className={styles.footerTagline}>
            Tu asistente inteligente para gestionar el monotributo sin estrés.
          </p>
          <div className={styles.footerSocials}>
<a href="mailto:support@payday.ai" className={styles.socialLink} aria-label="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </a>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Empresa</h4>
            <a href="#" onClick={nav('sobreNosotros')} className={styles.footerLink}>Sobre nosotros</a>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Contacto</h4>
            <a href="mailto:support@payday.ai" className={styles.footerLink}>support@payday.ai</a>
            <a href="#" onClick={nav('ayuda')} className={styles.footerLink}>Centro de ayuda</a>
          </div>
        </div>
      </div>

      <div className={styles.footerDivider} />

      <div className={styles.footerBottom}>
        <p className={styles.footerCopy}>
          &copy; {new Date().getFullYear()} PayDay. Todos los derechos reservados.
        </p>
        <div className={styles.footerCompliance}>
          <span className={styles.complianceBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            SSL Seguro
          </span>
          <span className={styles.complianceBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            GDPR Compliant
          </span>
          <span className={styles.complianceBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Datos Encriptados
          </span>
        </div>
      </div>
    </footer>
  )
}
