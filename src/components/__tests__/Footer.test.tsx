import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

describe('Footer', () => {
  it('renders the brand name', () => {
    render(<Footer />)
    expect(screen.getByText('PayDay')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(
      screen.getByText(`© ${currentYear} PayDay Tax Compliance. All rights reserved.`)
    ).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Footer />)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('Security Disclosure')).toBeInTheDocument()
    expect(screen.getByText('Accessibility')).toBeInTheDocument()
  })

  it('has correct hrefs on links', () => {
    render(<Footer />)
    expect(screen.getByText('Privacy Policy').closest('a')).toHaveAttribute('href', '/privacy')
    expect(screen.getByText('Terms of Service').closest('a')).toHaveAttribute('href', '/terms')
    expect(screen.getByText('Security Disclosure').closest('a')).toHaveAttribute('href', '/security')
    expect(screen.getByText('Accessibility').closest('a')).toHaveAttribute('href', '/accessibility')
  })

  it('has footer navigation with aria-label', () => {
    render(<Footer />)
    expect(screen.getByLabelText('Footer navigation')).toBeInTheDocument()
  })
})
