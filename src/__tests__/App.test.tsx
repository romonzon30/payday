import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'

// Mock all page components
vi.mock('../pages/LoginPage', () => ({
  default: ({ onLoginSuccess }: any) => (
    <div data-testid="login-page">
      <button onClick={() =>
        onLoginSuccess('token123', {
          _id: '1',
          nombreCompleto: 'Test User',
          email: 'test@test.com',
          emailNotificaciones: 'test@test.com',
          perfilCompleto: false,
          activo: true,
          googleUid: 'g1',
        })
      }>
        Login
      </button>
    </div>
  ),
}))

vi.mock('../pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}))

vi.mock('../pages/UserProfilePage', () => ({
  default: () => <div data-testid="profile-page">Profile</div>,
}))

vi.mock('../pages/ProfileCompletedPage', () => ({
  default: () => <div data-testid="profile-completed-page">Profile Completed</div>,
}))

vi.mock('../pages/CalendarPage', () => ({
  default: () => <div data-testid="calendar-page">Calendar</div>,
}))

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    global.fetch = vi.fn()
  })

  it('renders LoginPage when no token is stored', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('fetches user data when token exists', async () => {
    localStorage.setItem('token', 'valid-token')
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          _id: '1',
          nombreCompleto: 'Stored User',
          email: 'stored@test.com',
          emailNotificaciones: 'stored@test.com',
          perfilCompleto: false,
          activo: true,
          googleUid: 'g2',
        },
      }),
    })

    render(<App />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/me'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-token' },
        })
      )
    })
  })

  it('shows dashboard for authenticated user with incomplete profile', async () => {
    localStorage.setItem('token', 'valid-token')
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          _id: '1',
          nombreCompleto: 'Stored User',
          email: 'stored@test.com',
          emailNotificaciones: 'stored@test.com',
          perfilCompleto: false,
          activo: true,
          googleUid: 'g2',
        },
      }),
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  it('shows calendar for authenticated user with complete profile', async () => {
    localStorage.setItem('token', 'valid-token')
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          _id: '1',
          nombreCompleto: 'Complete User',
          email: 'complete@test.com',
          emailNotificaciones: 'complete@test.com',
          perfilCompleto: true,
          activo: true,
          googleUid: 'g3',
        },
      }),
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('calendar-page')).toBeInTheDocument()
    })
  })

  it('removes invalid token and shows login', async () => {
    localStorage.setItem('token', 'invalid-token')
    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })

    render(<App />)

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull()
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('navigates to dashboard on login with incomplete profile', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    const { fireEvent } = await import('@testing-library/react')
    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })
})
