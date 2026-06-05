import type { User } from '../types'
import AppFooter from '../components/AppFooter'
import AppSidebar from '../components/AppSidebar'
import styles from './DashboardPage.module.css'

interface DashboardPageProps {
  user: User
  onGoToProfile: () => void
  onGoToCalendar: () => void
  onGoToImpuestos: () => void
  onLogout: () => void
}

function upperCaseName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function DashboardPage({ user, onGoToProfile, onGoToCalendar, onGoToImpuestos, onLogout }: DashboardPageProps) {
  return (
    <div className={styles.page}>
      <AppSidebar
        user={user}
        activeView="dashboard"
        onGoToDashboard={() => {}}
        onGoToCalendar={onGoToCalendar}
        onGoToImpuestos={onGoToImpuestos}
        onGoToProfile={onGoToProfile}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>
              Hola, {upperCaseName(user.nombreCompleto.split(' ')[0])}
            </h1>
            <p className={styles.pageSubtitle}>
              Bienvenido a tu panel de control
            </p>
          </div>
        </header>

        <main className={styles.main}>
          {!user.perfilCompleto && (
            <div className={styles.cuilBanner}>
              <div className={styles.cuilBannerContent}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className={styles.cuilBannerTitle}>Completá tu perfil</p>
                  <p className={styles.cuilBannerText}>
                    Agregá tu CUIL para vincular tu monotributo y ver tus vencimientos.
                  </p>
                </div>
              </div>
              <button className={styles.cuilBannerBtn} onClick={onGoToProfile}>
                Completar perfil
              </button>
            </div>
          )}

          {user.categoriaMonotributo && (
            <div className={styles.cards}>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Categoría</span>
                <span className={styles.cardValue}>{user.categoriaMonotributo}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>CUIL</span>
                <span className={styles.cardValue}>{user.cuit}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Estado</span>
                <span className={styles.cardValue}>
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          )}

          {/* Marketing hero section */}
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>¿Sabías que...?</span>
              <h2 className={styles.heroTitle}>
                Más de 2 millones de monotributistas pagan fuera de término cada año
              </h2>
              <p className={styles.heroText}>
                AFIP aplica intereses resarcitorios del <strong>5,91% mensual</strong> por pago tardío.
                Un solo día de demora ya genera recargos. Si acumulás 10 meses sin pagar, perdés
                la cobertura de obra social y la prestación jubilatoria del período.
              </p>
              <p className={styles.heroText}>
                Con <strong>PayDay</strong> nunca más vas a olvidar una fecha de vencimiento.
                Te avisamos antes de que venza, calculamos tu cuota y te mostramos el estado
                de cada mes para que estés siempre al día.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatValue}>4.6M</span>
                  <span className={styles.heroStatLabel}>Monotributistas en Argentina</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatValue}>~45%</span>
                  <span className={styles.heroStatLabel}>Pagan fuera de término</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatValue}>5.91%</span>
                  <span className={styles.heroStatLabel}>Interés mensual por mora</span>
                </div>
              </div>
            </div>

            {/* Payment illustration */}
            <div className={styles.heroIllustration}>
              <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.heroSvg}>
                {/* Phone body */}
                <rect x="80" y="20" width="160" height="240" rx="20" fill="#1e293b" stroke="#334155" strokeWidth="2"/>
                <rect x="90" y="40" width="140" height="200" rx="4" fill="#0f172a"/>
                {/* Screen content - payment success */}
                <circle cx="160" cy="100" r="30" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="2"/>
                <path d="M145 100 l10 10 l20-20" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="160" y="150" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="600">Pago exitoso</text>
                <text x="160" y="170" textAnchor="middle" fill="#94a3b8" fontSize="10">Monotributo - Mayo 2026</text>
                <rect x="115" y="185" width="90" height="28" rx="8" fill="rgba(37, 99, 235, 0.2)" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="1"/>
                <text x="160" y="204" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="600">$ 26.600</text>
                {/* Floating elements */}
                <circle cx="55" cy="70" r="18" fill="rgba(251, 191, 36, 0.1)" stroke="#fbbf24" strokeWidth="1.5"/>
                <text x="55" y="75" textAnchor="middle" fill="#fbbf24" fontSize="14">$</text>
                <circle cx="270" cy="120" r="14" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" strokeWidth="1.5"/>
                <path d="M264 120 l4 4 l8-8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="60" cy="200" r="12" fill="rgba(96, 165, 250, 0.1)" stroke="#60a5fa" strokeWidth="1.5"/>
                <path d="M55 200 h10 M60 195 v10" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
                <rect x="250" y="55" width="40" height="28" rx="6" fill="rgba(52, 211, 153, 0.08)" stroke="rgba(52, 211, 153, 0.3)" strokeWidth="1"/>
                <text x="270" y="73" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="600">AL DÍA</text>
                <rect x="20" y="130" width="44" height="24" rx="6" fill="rgba(239, 68, 68, 0.08)" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1"/>
                <text x="42" y="146" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="600">VENCIDO</text>
                {/* Calendar icon floating */}
                <g transform="translate(255, 190)">
                  <rect width="32" height="32" rx="8" fill="rgba(37, 99, 235, 0.1)" stroke="rgba(37, 99, 235, 0.3)" strokeWidth="1"/>
                  <rect x="6" y="8" width="20" height="18" rx="2" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
                  <line x1="12" y1="5" x2="12" y2="11" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="20" y1="5" x2="20" y2="11" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="6" y1="15" x2="26" y2="15" stroke="#60a5fa" strokeWidth="1"/>
                </g>
              </svg>
            </div>
          </section>

          {/* About section */}
          <section className={styles.aboutSection}>
            <h3 className={styles.aboutTitle}>¿Qué es PayDay?</h3>
            <p className={styles.aboutText}>
              PayDay es tu asistente de gestión monotributista. Vinculá tu CUIL, 
              conocé tu categoría, visualizá tus vencimientos en un calendario intuitivo 
              y recibí alertas antes de cada fecha límite. Todo desde un solo lugar, 
              simple y sin complicaciones.
            </p>
            <div className={styles.aboutFeatures}>
              <div className={styles.aboutFeature}>
                <div className={styles.aboutFeatureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <span>Calendario de vencimientos</span>
              </div>
              <div className={styles.aboutFeature}>
                <div className={styles.aboutFeatureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                </div>
                <span>Alertas antes del vencimiento</span>
              </div>
              <div className={styles.aboutFeature}>
                <div className={styles.aboutFeatureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <span>Estado de pagos al instante</span>
              </div>
              <div className={styles.aboutFeature}>
                <div className={styles.aboutFeatureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                </div>
                <span>Datos seguros y privados</span>
              </div>
            </div>
          </section>

          <AppFooter />
        </main>
      </div>
    </div>
  )
}
