import { useState, useEffect, useCallback } from 'react'
import type { User } from './types'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UserProfilePage from './pages/UserProfilePage'
import ProfileCompletedPage from './pages/ProfileCompletedPage'
import CalendarPage from './pages/CalendarPage'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

type View = 'login' | 'dashboard' | 'profile' | 'profileCompleted' | 'calendar'

export default function App() {

  
  // View actual
  const [view, setView] = useState<View>('login')
  // User object
  const [user, setUser] = useState<User | null>(null)
  
  // State de carga inicial para verificar token guardado y obtener datos del usuario
  const [loading, setLoading] = useState(true)

  // Al montar, verificar si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    fetch(`${API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setUser(data.user)
        setView(data.user.perfilCompleto ? 'calendar' : 'dashboard')
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLoginSuccess = useCallback((token: string, userData: User) => {
    localStorage.setItem('token', token)
    setUser(userData)
    setView(userData.perfilCompleto ? 'calendar' : 'dashboard')
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    setView('login')
  }, [])

  const handleUserUpdated = useCallback((updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  if (loading) return null

  if (view === 'profileCompleted' && user) {
    return (
      <ProfileCompletedPage
        user={user}
        onGoToDashboard={() => setView('calendar')}
      />
    )
  }

  if (view === 'profile' && user) {
    return (
      <UserProfilePage
        user={user}
        onBack={() => setView('dashboard')}
        onUserUpdated={handleUserUpdated}
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
        onLogout={handleLogout}
      />
    )
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />
}
