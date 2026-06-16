import { useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import { api, setOnUnauthorized } from '../lib/apiClient'

// Session state: bootstraps the user from a stored token, exposes login/logout,
// and logs out automatically when the API reports 401.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setOnUnauthorized(() => setUser(null))
    return () => setOnUnauthorized(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get<{ user: User }>('/api/user/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return { user, setUser, loading, login, logout }
}
