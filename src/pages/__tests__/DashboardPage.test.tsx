import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DashboardPage from '../DashboardPage'
import { mockUser, mockUserIncomplete } from '../../test/mocks'

// Mock AppFooter
vi.mock('../../components/AppFooter', () => ({
  default: () => <footer data-testid="app-footer">Footer</footer>,
}))

describe('DashboardPage', () => {
  const defaultProps = {
    user: mockUser,
    onGoToProfile: vi.fn(),
    onGoToCalendar: vi.fn(),
    onLogout: vi.fn(),
  }

  beforeEach(() => {
    defaultProps.onGoToProfile.mockClear()
    defaultProps.onGoToCalendar.mockClear()
    defaultProps.onLogout.mockClear()
  })

  it('renders greeting with user first name (capitalized)', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText(/Hola, Juan/)).toBeInTheDocument()
  })

  it('renders welcome subtitle', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('Bienvenido a tu panel de control')).toBeInTheDocument()
  })

  it('renders brand name in sidebar', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('PAYDAY')).toBeInTheDocument()
  })

  it('renders navigation items', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Calendario')).toBeInTheDocument()
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Salir')).toBeInTheDocument()
  })

  it('calls onGoToCalendar when Calendario is clicked', () => {
    render(<DashboardPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Calendario'))
    expect(defaultProps.onGoToCalendar).toHaveBeenCalled()
  })

  it('calls onGoToProfile when Configuración is clicked', () => {
    render(<DashboardPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Configuración'))
    expect(defaultProps.onGoToProfile).toHaveBeenCalled()
  })

  it('calls onLogout when Salir is clicked', () => {
    render(<DashboardPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Salir'))
    expect(defaultProps.onLogout).toHaveBeenCalled()
  })

  it('shows "Completá tu perfil" banner when profile is incomplete', () => {
    render(<DashboardPage {...defaultProps} user={mockUserIncomplete} />)
    expect(screen.getByText('Completá tu perfil')).toBeInTheDocument()
    expect(
      screen.getByText(/Agregá tu CUIL para vincular tu monotributo/)
    ).toBeInTheDocument()
  })

  it('does not show incomplete profile banner when profile is complete', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.queryByText('Completá tu perfil')).not.toBeInTheDocument()
  })

  it('shows category and CUIL cards when user has categoriaMonotributo', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('Categoría')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('CUIL')).toBeInTheDocument()
    expect(screen.getByText('20-12345678-9')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('renders user avatar when avatarUrl is present', () => {
    const { container } = render(<DashboardPage {...defaultProps} />)
    const imgs = container.querySelectorAll('img.avatar')
    expect(imgs.length).toBeGreaterThan(0)
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders avatar fallback when no avatarUrl', () => {
    render(<DashboardPage {...defaultProps} user={mockUserIncomplete} />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('renders the marketing hero section', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('¿Sabías que...?')).toBeInTheDocument()
    expect(
      screen.getByText(/Más de 2 millones de monotributistas/)
    ).toBeInTheDocument()
  })

  it('renders hero stats', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('4.6M')).toBeInTheDocument()
    expect(screen.getByText('~45%')).toBeInTheDocument()
    expect(screen.getByText('5.91%')).toBeInTheDocument()
  })

  it('renders about section', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('¿Qué es PayDay?')).toBeInTheDocument()
    expect(screen.getByText('Calendario de vencimientos')).toBeInTheDocument()
    expect(screen.getByText('Alertas antes del vencimiento')).toBeInTheDocument()
    expect(screen.getByText('Estado de pagos al instante')).toBeInTheDocument()
    expect(screen.getByText('Datos seguros y privados')).toBeInTheDocument()
  })

  it('renders AppFooter', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByTestId('app-footer')).toBeInTheDocument()
  })
})
