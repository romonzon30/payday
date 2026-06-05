import type { User } from '../types'
import { useTheme } from '../hooks/useTheme'
import styles from './AppSidebar.module.css'

export type ActiveView = 'dashboard' | 'calendar' | 'impuestos' | 'profile'

interface AppSidebarProps {
  user: User
  activeView: ActiveView
  onGoToDashboard: () => void
  onGoToCalendar: () => void
  onGoToImpuestos: () => void
  onGoToProfile: () => void
  onLogout: () => void
}

export default function AppSidebar({
  user,
  activeView,
  onGoToDashboard,
  onGoToCalendar,
  onGoToImpuestos,
  onGoToProfile,
  onLogout,
}: AppSidebarProps) {
  const { dark, toggle: toggleTheme } = useTheme()

  const navItems = [
    {
      id: 'dashboard' as ActiveView,
      label: 'Inicio',
      onClick: onGoToDashboard,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'calendar' as ActiveView,
      label: 'Calendario',
      onClick: onGoToCalendar,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: 'impuestos' as ActiveView,
      label: 'Impuestos',
      onClick: onGoToImpuestos,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: 'profile' as ActiveView,
      label: 'Configuración',
      onClick: onGoToProfile,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.636-6.364-1.414 1.414M6.05 17.95l-1.414 1.414m0-12.728 1.414 1.414m11.314 11.314 1.414 1.414" />
        </svg>
      ),
    },
  ]

  return (
    <aside className={styles.sidebar}>
      <span className={styles.brand}>PAYDAY</span>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeView === item.id ? styles.navItemActive : ''}`}
            onClick={activeView !== item.id ? item.onClick : undefined}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.sidebarBottom}>
        {/* User info */}
        <div className={styles.userRow}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
          ) : (
            <span className={styles.userAvatarFallback}>
              {user.nombreCompleto.charAt(0).toUpperCase()}
            </span>
          )}
          <span className={styles.userName} title={user.nombreCompleto}>
            {user.nombreCompleto.split(' ')[0]}
          </span>
        </div>

        {/* Theme toggle */}
        <button className={styles.navItem} onClick={toggleTheme} title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
          {dark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        {/* Logout */}
        <button className={`${styles.navItem} ${styles.logoutItem}`} onClick={onLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Salir
        </button>
      </div>
    </aside>
  )
}
