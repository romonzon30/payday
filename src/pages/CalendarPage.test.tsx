import { describe, expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import CalendarPage from './CalendarPage'
import type { User } from '../types'

// Render Lottie as a marker so we can assert it mounts without driving the
// real lottie-web player inside jsdom.
vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie" />,
}))

// Controls the loading flag the calendar reacts to.
let loading = true
vi.mock('../hooks/useVencimientos', () => ({
  useVencimientos: () => ({
    vencimientos: [],
    loading,
    error: false,
    refetch: vi.fn(),
    toggleEstado: vi.fn(),
    remove: vi.fn(),
  }),
}))

const user: User = {
  _id: 'u1',
  email: 'a@b.com',
  emailNotificaciones: 'a@b.com',
  nombreCompleto: 'Test User',
  perfilCompleto: true,
  activo: true,
}

const noop = () => {}

function renderPage() {
  return render(
    <CalendarPage user={user} onBack={noop} onGoToProfile={noop} onGoToImpuestos={noop} onLogout={noop} />,
  )
}

afterEach(cleanup)

describe('CalendarPage loading state', () => {
  test('shows the lottie loader and hides the calendar grid while loading', () => {
    loading = true
    renderPage()
    expect(screen.getByTestId('lottie')).toBeInTheDocument()
    expect(screen.getByText('Cargando vencimientos…')).toBeInTheDocument()
    // Day headers belong to the grid, which must not render during loading.
    expect(screen.queryByText('Lun')).not.toBeInTheDocument()
  })

  test('renders the calendar grid once loading finishes', () => {
    loading = false
    renderPage()
    expect(screen.queryByTestId('lottie')).not.toBeInTheDocument()
    expect(screen.getByText('Lun')).toBeInTheDocument()
  })
})
