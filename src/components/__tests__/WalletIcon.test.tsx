import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import WalletIcon from '../WalletIcon'

describe('WalletIcon', () => {
  it('renders a container div', () => {
    const { container } = render(<WalletIcon />)
    const div = container.firstChild as HTMLElement
    expect(div).toBeInTheDocument()
    expect(div.tagName).toBe('DIV')
  })

  it('has aria-hidden attribute on container', () => {
    const { container } = render(<WalletIcon />)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveAttribute('aria-hidden', 'true')
  })

  it('contains an SVG element', () => {
    const { container } = render(<WalletIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has correct SVG dimensions', () => {
    const { container } = render(<WalletIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '30')
    expect(svg).toHaveAttribute('height', '30')
  })
})
