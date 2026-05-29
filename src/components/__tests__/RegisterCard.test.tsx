import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterCard from '../RegisterCard'

// Mock @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: ({ onSuccess, onError }: any) => () => {
    onSuccess({ access_token: 'mock-access-token' })
  },
}))

describe('RegisterCard', () => {
  const defaultProps = {
    token: 'test-token',
    user: { nombreCompleto: 'Test User', email: 'test@test.com' },
    hasGoogleData: true,
    onComplete: vi.fn(),
    onBackToLogin: vi.fn(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    defaultProps.onComplete.mockClear()
    defaultProps.onBackToLogin.mockClear()
    global.fetch = vi.fn()
  })

  it('renders the heading and subtitle', () => {
    render(<RegisterCard {...defaultProps} />)
    expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument()
    expect(screen.getByText('Comencemos con tus datos principales.')).toBeInTheDocument()
  })

  it('renders progress indicator', () => {
    render(<RegisterCard {...defaultProps} />)
    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument()
    expect(screen.getByText('Información Básica')).toBeInTheDocument()
  })

  it('renders form fields with correct labels', () => {
    render(<RegisterCard {...defaultProps} />)
    expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument()
    expect(screen.getByLabelText('DNI / CUIL')).toBeInTheDocument()
    expect(screen.getByLabelText('Email de Notificaciones')).toBeInTheDocument()
  })

  it('pre-fills nombre and email from user prop', () => {
    render(<RegisterCard {...defaultProps} />)
    expect(screen.getByLabelText('Nombre Completo')).toHaveValue('Test User')
    expect(screen.getByLabelText('Email de Notificaciones')).toHaveValue('test@test.com')
  })

  it('disables email when hasGoogleData is true', () => {
    render(<RegisterCard {...defaultProps} />)
    expect(screen.getByLabelText('Email de Notificaciones')).toBeDisabled()
  })

  it('enables email when hasGoogleData is false', () => {
    render(<RegisterCard {...defaultProps} hasGoogleData={false} />)
    expect(screen.getByLabelText('Email de Notificaciones')).not.toBeDisabled()
  })

  it('shows error when submitting without required fields', async () => {
    const { container } = render(<RegisterCard {...defaultProps} user={{ nombreCompleto: 'Test', email: 'test@test.com' }} />)
    
    // Clear the nombre field to trigger validation
    const nombreInput = screen.getByLabelText('Nombre Completo')
    fireEvent.change(nombreInput, { target: { value: '' } })
    
    // Submit the form directly
    const form = container.querySelector('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Completa todos los campos requeridos')).toBeInTheDocument()
    })
  })

  it('calls API on valid submit with hasGoogleData', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    render(<RegisterCard {...defaultProps} />)

    fireEvent.change(screen.getByLabelText('DNI / CUIL'), {
      target: { value: '20-12345678-9' },
    })
    fireEvent.click(screen.getByText('Continuar'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows error message on API failure', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Registration failed' }),
    })

    render(<RegisterCard {...defaultProps} />)

    fireEvent.change(screen.getByLabelText('DNI / CUIL'), {
      target: { value: '20-12345678-9' },
    })
    fireEvent.click(screen.getByText('Continuar'))

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument()
    })
  })

  it('updates input values on change', () => {
    render(<RegisterCard {...defaultProps} />)

    const nombreInput = screen.getByLabelText('Nombre Completo')
    fireEvent.change(nombreInput, { target: { value: 'Nuevo Nombre' } })
    expect(nombreInput).toHaveValue('Nuevo Nombre')

    const dniInput = screen.getByLabelText('DNI / CUIL')
    fireEvent.change(dniInput, { target: { value: '30-98765432-1' } })
    expect(dniInput).toHaveValue('30-98765432-1')
  })
})
