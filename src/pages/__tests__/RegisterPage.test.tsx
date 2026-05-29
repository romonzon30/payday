import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RegisterPage from '../RegisterPage'

// Mock RegisterCard
vi.mock('../../components/RegisterCard', () => ({
  default: ({ onComplete, onBackToLogin }: any) => (
    <div data-testid="register-card">
      <button onClick={onComplete}>Complete</button>
      <button onClick={onBackToLogin}>Back to login</button>
    </div>
  ),
}))

describe('RegisterPage', () => {
  const defaultProps = {
    token: 'test-token',
    user: { nombreCompleto: 'Test User', email: 'test@test.com' },
    hasGoogleData: true,
    onComplete: vi.fn(),
    onBackToLogin: vi.fn(),
  }

  beforeEach(() => {
    defaultProps.onComplete.mockClear()
    defaultProps.onBackToLogin.mockClear()
  })

  it('renders the brand name', () => {
    render(<RegisterPage {...defaultProps} />)
    expect(screen.getByText('PAYDAY')).toBeInTheDocument()
  })

  it('renders the brand description', () => {
    render(<RegisterPage {...defaultProps} />)
    expect(
      screen.getByText('Simplificando tu gestión financiera.')
    ).toBeInTheDocument()
  })

  it('renders the RegisterCard component', () => {
    render(<RegisterPage {...defaultProps} />)
    expect(screen.getByTestId('register-card')).toBeInTheDocument()
  })

  it('renders the login link', () => {
    render(<RegisterPage {...defaultProps} />)
    expect(screen.getByText('¿Ya tienes una cuenta?')).toBeInTheDocument()
    expect(screen.getByText('Inicia sesión')).toBeInTheDocument()
  })

  it('calls onBackToLogin when login link is clicked', () => {
    render(<RegisterPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Inicia sesión'))
    expect(defaultProps.onBackToLogin).toHaveBeenCalled()
  })
})
