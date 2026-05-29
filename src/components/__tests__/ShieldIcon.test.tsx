import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ShieldIcon from '../ShieldIcon'

describe('ShieldIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<ShieldIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has aria-hidden attribute', () => {
    const { container } = render(<ShieldIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('has correct dimensions', () => {
    const { container } = render(<ShieldIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '14')
    expect(svg).toHaveAttribute('height', '14')
  })
})
