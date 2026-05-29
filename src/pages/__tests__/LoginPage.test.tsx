import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../LoginPage'

// Mock LoginCard component
vi.mock('../../components/LoginCard', () => ({
  default: ({ onLoginSuccess }: any) => (
    <div data-testid="login-card">
      <button onClick={() => onLoginSuccess('token', { nombreCompleto: 'Test' })}>
        Mock Login
      </button>
    </div>
  ),
}))

// Mock AppFooter
vi.mock('../../components/AppFooter', () => ({
  default: () => <footer data-testid="app-footer">Footer</footer>,
}))

describe('LoginPage', () => {
  const mockOnLoginSuccess = vi.fn()

  beforeEach(() => {
    mockOnLoginSuccess.mockClear()
  })

  it('renders the brand name', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />)
    const brands = screen.getAllByText('PAYDAY')
    expect(brands.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the tagline', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />)
    expect(
      screen.getByText(/La claridad financiera/)
    ).toBeInTheDocument()
  })

  it('renders the value proposition', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />)
    expect(
      screen.getByText(/Gestiona tu facturación/)
    ).toBeInTheDocument()
  })

  it('renders the AFIP badge', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />)
    expect(screen.getByText('AFIP Monotributo Simplificado')).toBeInTheDocument()
  })

  it('renders the LoginCard component', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />)
    expect(screen.getByTestId('login-card')).toBeInTheDocument()
  })
})
