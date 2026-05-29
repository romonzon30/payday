import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import GoogleIcon from '../GoogleIcon'

describe('GoogleIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<GoogleIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has aria-hidden attribute', () => {
    const { container } = render(<GoogleIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('has correct dimensions', () => {
    const { container } = render(<GoogleIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '18')
    expect(svg).toHaveAttribute('height', '18')
  })

  it('contains Google brand color paths', () => {
    const { container } = render(<GoogleIcon />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBe(4)

    const fills = Array.from(paths).map((p) => p.getAttribute('fill'))
    expect(fills).toContain('#4285F4')
    expect(fills).toContain('#34A853')
    expect(fills).toContain('#FBBC05')
    expect(fills).toContain('#EA4335')
  })
})
