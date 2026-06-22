import { useState, useEffect, useCallback } from 'react'
import type { User, View } from './types'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UserProfilePage from './pages/UserProfilePage'
import ProfileCompletedPage from './pages/ProfileCompletedPage'
import CalendarPage from './pages/CalendarPage'
import ImpuestosPage from './pages/ImpuestosPage'

const homeView = (u: User): View => (u.perfilCompleto ? 'calendar' : 'dashboard')

export default function App() {
  useTheme() // initialize theme from localStorage on mount

  const { user, setUser, loading, login, logout } = useAuth()
  const [view, setView] = useState<View>('login')

  // Once the session bootstrap settles, route to the user's home view.
  useEffect(() => {
    if (!loading && user) setView(homeView(user))
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoginSuccess = useCallback((token: string, userData: User) => {
    login(token, userData)
    setView(homeView(userData))
  }, [login])

  const handleLogout = useCallback(() => {
    logout()
    setView('login')
  }, [logout])

  if (loading) return null

  if (view === 'profileCompleted' && user) {
    return <ProfileCompletedPage user={user} onGoToDashboard={() => setView('calendar')} />
  }

  if (view === 'profile' && user) {
    return (
      <UserProfilePage
        user={user}
        onBack={() => setView(user.perfilCompleto ? 'calendar' : 'dashboard')}
        onGoToCalendar={() => setView('calendar')}
        onGoToImpuestos={() => setView('impuestos')}
        onUserUpdated={setUser}
        onProfileCompleted={(updatedUser: User) => {
          setUser(updatedUser)
          setView('profileCompleted')
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'calendar' && user) {
    return (
      <CalendarPage
        user={user}
        onBack={() => setView('dashboard')}
        onGoToProfile={() => setView('profile')}
        onGoToImpuestos={() => setView('impuestos')}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'impuestos' && user) {
    return (
      <ImpuestosPage
        user={user}
        onGoToCalendar={() => setView('calendar')}
        onGoToDashboard={() => setView('dashboard')}
        onGoToProfile={() => setView('profile')}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'dashboard' && user) {
    return (
      <DashboardPage
        user={user}
        onGoToProfile={() => setView('profile')}
        onGoToCalendar={() => setView('calendar')}
        onGoToImpuestos={() => setView('impuestos')}
        onLogout={handleLogout}
      />
    )
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />
}
