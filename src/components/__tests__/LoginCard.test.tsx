import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginCard from '../LoginCard'

// Mock @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <button
      data-testid="google-login-btn"
      onClick={() => onSuccess({ credential: 'mock-credential-token' })}
    >
      Login with Google
    </button>
  ),
}))

// Mock lottie-react
vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie-animation" />,
}))

describe('LoginCard', () => {
  const mockOnLoginSuccess = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    mockOnLoginSuccess.mockClear()
    global.fetch = vi.fn()
  })

  it('renders the heading and subtitle', () => {
    render(<LoginCard onLoginSuccess={mockOnLoginSuccess} />)
    expect(screen.getByText('Bienvenido')).toBeInTheDocument()
    expect(
      screen.getByText('Ingresa tus credenciales para acceder a tu panel de control.')
    ).toBeInTheDocument()
  })

  it('renders Google login button', () => {
    render(<LoginCard onLoginSuccess={mockOnLoginSuccess} />)
    expect(screen.getByTestId('google-login-btn')).toBeInTheDocument()
  })

  it('calls onLoginSuccess after successful Google login', async () => {
    const mockUser = { _id: '1', nombreCompleto: 'Test User', email: 'test@test.com' }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'jwt-token', user: mockUser }),
    })

    render(<LoginCard onLoginSuccess={mockOnLoginSuccess} />)
    fireEvent.click(screen.getByTestId('google-login-btn'))

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith('jwt-token', mockUser)
    })
  })

  it('shows alert on API error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Google error' }),
    })

    render(<LoginCard onLoginSuccess={mockOnLoginSuccess} />)
    fireEvent.click(screen.getByTestId('google-login-btn'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Google error')
    })
  })

  it('shows alert on network error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<LoginCard onLoginSuccess={mockOnLoginSuccess} />)
    fireEvent.click(screen.getByTestId('google-login-btn'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error de conexión')
    })
  })
})
