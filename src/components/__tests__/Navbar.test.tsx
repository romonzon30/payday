import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Navbar from '../Navbar'

describe('Navbar', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the brand name', () => {
    render(<Navbar isLoggedIn={false} />)
    expect(screen.getByText('PayDay')).toBeInTheDocument()
  })

  it('does not show menu when not logged in', () => {
    render(<Navbar isLoggedIn={false} />)
    expect(screen.queryByText('☰ Menú')).not.toBeInTheDocument()
  })

  it('shows menu button when logged in', () => {
    render(<Navbar isLoggedIn={true} />)
    expect(screen.getByText('☰ Menú')).toBeInTheDocument()
  })

  it('toggles dropdown on menu button click', () => {
    render(<Navbar isLoggedIn={true} />)
    
    // Dropdown is hidden initially
    expect(screen.queryByText('Configuración')).not.toBeInTheDocument()
    
    // Click to open
    fireEvent.click(screen.getByText('☰ Menú'))
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Datos personales')).toBeInTheDocument()
    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
    
    // Click again to close
    fireEvent.click(screen.getByText('☰ Menú'))
    expect(screen.queryByText('Configuración')).not.toBeInTheDocument()
  })

  it('calls logout on "Cerrar sesión" click', () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    })

    render(<Navbar isLoggedIn={true} />)
    fireEvent.click(screen.getByText('☰ Menú'))
    fireEvent.click(screen.getByText('Cerrar sesión'))

    expect(removeItemSpy).toHaveBeenCalledWith('token')
    expect(reloadSpy).toHaveBeenCalled()
  })
})
