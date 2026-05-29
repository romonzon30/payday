import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppFooter from '../AppFooter'

describe('AppFooter', () => {
  it('renders the brand name', () => {
    render(<AppFooter />)
    expect(screen.getByText('PAYDAY')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<AppFooter />)
    expect(
      screen.getByText('Tu asistente inteligente para gestionar el monotributo sin estrés.')
    ).toBeInTheDocument()
  })

  it('renders social links with aria-labels', () => {
    render(<AppFooter />)
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders Empresa links section', () => {
    render(<AppFooter />)
    expect(screen.getByText('Empresa')).toBeInTheDocument()
    expect(screen.getByText('Sobre nosotros')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('Prensa')).toBeInTheDocument()
    expect(screen.getByText('Carreras')).toBeInTheDocument()
  })

  it('renders Contacto links section', () => {
    render(<AppFooter />)
    expect(screen.getByText('Contacto')).toBeInTheDocument()
    expect(screen.getByText('Soporte')).toBeInTheDocument()
    expect(screen.getByText('Centro de ayuda')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
  })

  it('renders compliance badges', () => {
    render(<AppFooter />)
    expect(screen.getByText('SSL Seguro')).toBeInTheDocument()
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument()
    expect(screen.getByText('Datos Encriptados')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    render(<AppFooter />)
    const currentYear = new Date().getFullYear()
    expect(
      screen.getByText(`© ${currentYear} PayDay. Todos los derechos reservados.`)
    ).toBeInTheDocument()
  })
})
