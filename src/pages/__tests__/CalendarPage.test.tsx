import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CalendarPage from '../CalendarPage'
import { mockUser, mockUserIncomplete } from '../../test/mocks'

// Mock AppFooter
vi.mock('../../components/AppFooter', () => ({
  default: () => <footer data-testid="app-footer">Footer</footer>,
}))

describe('CalendarPage', () => {
  const defaultProps = {
    user: mockUser,
    onBack: vi.fn(),
    onGoToProfile: vi.fn(),
    onLogout: vi.fn(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    defaultProps.onBack.mockClear()
    defaultProps.onGoToProfile.mockClear()
    defaultProps.onLogout.mockClear()

    // Mock fetch for vencimientos
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vencimientos: [
          {
            _id: 'v1',
            tipo: 'monotributo',
            descripcion: 'AFIP - Monotributo',
            monto: 1867.5,
            fechaVencimiento: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              19
            ).toISOString(),
            estado: 'pendiente',
          },
        ],
      }),
    })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token')
  })

  it('renders the brand in sidebar', () => {
    render(<CalendarPage {...defaultProps} />)
    expect(screen.getByText('PAYDAY')).toBeInTheDocument()
  })

  it('renders sidebar navigation', () => {
    render(<CalendarPage {...defaultProps} />)
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Calendario')).toBeInTheDocument()
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Salir')).toBeInTheDocument()
  })

  it('calls onBack when Inicio is clicked', () => {
    render(<CalendarPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Inicio'))
    expect(defaultProps.onBack).toHaveBeenCalled()
  })

  it('calls onGoToProfile when Configuración is clicked', () => {
    render(<CalendarPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Configuración'))
    expect(defaultProps.onGoToProfile).toHaveBeenCalled()
  })

  it('calls onLogout when Salir is clicked', () => {
    render(<CalendarPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Salir'))
    expect(defaultProps.onLogout).toHaveBeenCalled()
  })

  it('renders month name and year in page title', () => {
    render(<CalendarPage {...defaultProps} />)
    const now = new Date()
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]
    expect(
      screen.getByText(`${months[now.getMonth()]} ${now.getFullYear()}`)
    ).toBeInTheDocument()
  })

  it('renders calendar day headers', () => {
    render(<CalendarPage {...defaultProps} />)
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('Mié')).toBeInTheDocument()
    expect(screen.getByText('Jue')).toBeInTheDocument()
    expect(screen.getByText('Vie')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
    expect(screen.getByText('Dom')).toBeInTheDocument()
  })

  it('renders today button', () => {
    render(<CalendarPage {...defaultProps} />)
    expect(screen.getByText('Hoy')).toBeInTheDocument()
  })

  it('renders Vencimientos del Mes panel', () => {
    render(<CalendarPage {...defaultProps} />)
    expect(screen.getByText('Vencimientos del Mes')).toBeInTheDocument()
    expect(screen.getByText('Detalle de obligaciones')).toBeInTheDocument()
  })

  it('fetches vencimientos on mount', async () => {
    render(<CalendarPage {...defaultProps} />)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/vencimientos'),
        expect.any(Object)
      )
    })
  })

  it('renders vencimiento data after loading', async () => {
    render(<CalendarPage {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('AFIP - Monotributo')).toBeInTheDocument()
    })
  })

  it('navigates to next month', () => {
    render(<CalendarPage {...defaultProps} />)
    const now = new Date()
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]
    
    // Click next month button (the second nav button)
    const navButtons = screen.getAllByRole('button')
    const nextBtn = navButtons.find(btn => {
      const svg = btn.querySelector('svg path[d="m9 18 6-6-6-6"]')
      return svg !== null
    })
    if (nextBtn) {
      fireEvent.click(nextBtn)
      const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1
      const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
      expect(
        screen.getByText(`${months[nextMonth]} ${nextYear}`)
      ).toBeInTheDocument()
    }
  })

  it('renders user avatar or fallback', () => {
    const { container } = render(<CalendarPage {...defaultProps} />)
    const imgs = container.querySelectorAll('img.avatar')
    expect(imgs.length).toBeGreaterThan(0)
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders AppFooter', () => {
    render(<CalendarPage {...defaultProps} />)
    expect(screen.getByTestId('app-footer')).toBeInTheDocument()
  })
})
