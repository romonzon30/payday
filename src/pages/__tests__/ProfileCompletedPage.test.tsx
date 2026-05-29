import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProfileCompletedPage from '../ProfileCompletedPage'
import { mockUser } from '../../test/mocks'

// Mock lottie-react
vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie-animation" />,
}))

describe('ProfileCompletedPage', () => {
  const defaultProps = {
    user: mockUser,
    onGoToDashboard: vi.fn(),
  }

  it('renders the congratulations title', () => {
    render(<ProfileCompletedPage {...defaultProps} />)
    expect(screen.getByText('¡Felicidades!')).toBeInTheDocument()
  })

  it('renders the success subtitle', () => {
    render(<ProfileCompletedPage {...defaultProps} />)
    expect(
      screen.getByText('Tu perfil fue completado exitosamente')
    ).toBeInTheDocument()
  })

  it('renders the Lottie animation', () => {
    render(<ProfileCompletedPage {...defaultProps} />)
    expect(screen.getByTestId('lottie-animation')).toBeInTheDocument()
  })

  it('renders user data in monotributo card', () => {
    render(<ProfileCompletedPage {...defaultProps} />)
    expect(screen.getByText('Monotributo')).toBeInTheDocument()
    expect(screen.getByText('Categoría A')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('20-12345678-9')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('renders monthly due dates grid', () => {
    render(<ProfileCompletedPage {...defaultProps} />)
    expect(screen.getByText('Vencimientos mensuales')).toBeInTheDocument()
    // Check some month abbreviations
    expect(screen.getByText('Ene')).toBeInTheDocument()
    expect(screen.getByText('Feb')).toBeInTheDocument()
    expect(screen.getByText('Dic')).toBeInTheDocument()
  })

  it('calculates correct vencimiento day from CUIT', () => {
    // CUIT 20-12345678-9 → cleaned: 20123456789 → penúltimo dígito = 8 → vencDay = 21
    const { container } = render(<ProfileCompletedPage {...defaultProps} />)
    const textContent = container.textContent || ''
    expect(textContent).toContain('21')
  })

  it('calls onGoToDashboard when button is clicked', () => {
    render(<ProfileCompletedPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Ir al panel'))
    expect(defaultProps.onGoToDashboard).toHaveBeenCalled()
  })
})
