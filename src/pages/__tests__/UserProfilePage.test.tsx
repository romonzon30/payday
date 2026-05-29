import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserProfilePage from '../UserProfilePage'
import { mockUser } from '../../test/mocks'

// Mock AppFooter
vi.mock('../../components/AppFooter', () => ({
  default: () => <footer data-testid="app-footer">Footer</footer>,
}))

describe('UserProfilePage', () => {
  const defaultProps = {
    user: mockUser,
    onBack: vi.fn(),
    onUserUpdated: vi.fn(),
    onProfileCompleted: vi.fn(),
    onLogout: vi.fn(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    defaultProps.onBack.mockClear()
    defaultProps.onUserUpdated.mockClear()
    defaultProps.onProfileCompleted.mockClear()
    defaultProps.onLogout.mockClear()
    global.fetch = vi.fn()
  })

  it('renders page title', () => {
    render(<UserProfilePage {...defaultProps} />)
    expect(screen.getByText('Información personal')).toBeInTheDocument()
  })

  it('renders user email as subtitle', () => {
    render(<UserProfilePage {...defaultProps} />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders the PAYDAY brand', () => {
    render(<UserProfilePage {...defaultProps} />)
    expect(screen.getByText('PAYDAY')).toBeInTheDocument()
  })

  it('renders the Volver button', () => {
    render(<UserProfilePage {...defaultProps} />)
    expect(screen.getByText('Volver')).toBeInTheDocument()
  })

  it('calls onBack when Volver is clicked', () => {
    render(<UserProfilePage {...defaultProps} />)
    fireEvent.click(screen.getByText('Volver'))
    expect(defaultProps.onBack).toHaveBeenCalled()
  })

  it('calls onBack when Cancelar is clicked', () => {
    render(<UserProfilePage {...defaultProps} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(defaultProps.onBack).toHaveBeenCalled()
  })

  it('pre-fills form with user data', () => {
    render(<UserProfilePage {...defaultProps} />)
    expect(screen.getByLabelText('Nombre Completo')).toHaveValue('Juan Pérez')
    expect(screen.getByLabelText('CUIL')).toHaveValue('20-12345678-9')
    expect(screen.getByLabelText('Email de Notificaciones')).toHaveValue('test@example.com')
  })

  it('shows avatar when user has avatarUrl', () => {
    const { container } = render(<UserProfilePage {...defaultProps} />)
    const imgs = container.querySelectorAll('img.avatar')
    expect(imgs.length).toBeGreaterThan(0)
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('shows categoría monotributo when available', () => {
    render(<UserProfilePage {...defaultProps} />)
    expect(screen.getByText('Categoría Monotributo')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    render(<UserProfilePage {...defaultProps} />)

    const nombreInput = screen.getByLabelText('Nombre Completo')
    fireEvent.change(nombreInput, { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(screen.getByText('Nombre y email son requeridos')).toBeInTheDocument()
    })
  })

  it('submits profile update successfully', async () => {
    const updatedUser = { ...mockUser, nombreCompleto: 'New Name' }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: updatedUser }),
    })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token')

    render(<UserProfilePage {...defaultProps} />)
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(defaultProps.onUserUpdated).toHaveBeenCalledWith(updatedUser)
    })
  })

  it('calls onProfileCompleted when adding CUIL for first time', async () => {
    const userWithoutCuit = { ...mockUser, cuit: undefined }
    const updatedUser = { ...mockUser, cuit: '20-99999999-9', perfilCompleto: true }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: updatedUser }),
    })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token')

    render(<UserProfilePage {...defaultProps} user={userWithoutCuit} />)

    const cuilInput = screen.getByPlaceholderText('Ej. 20-12345678-9')
    fireEvent.change(cuilInput, {
      target: { value: '20-99999999-9' },
    })
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(defaultProps.onProfileCompleted).toHaveBeenCalledWith(updatedUser)
    })
  })

  it('shows error on API failure', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Error al actualizar' }),
    })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token')

    render(<UserProfilePage {...defaultProps} />)
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(screen.getByText('Error al actualizar')).toBeInTheDocument()
    })
  })

  it('shows error on network failure', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token')

    render(<UserProfilePage {...defaultProps} />)
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument()
    })
  })
})
