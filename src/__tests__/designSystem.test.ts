import { describe, it, expect } from 'vitest'
import { DS } from '../constants/designSystem'

describe('Design System Constants', () => {
  describe('Colors', () => {
    it('has primary colors defined', () => {
      expect(DS.colors.primary).toBe('#004ac6')
      expect(DS.colors.primaryContainer).toBe('#2563eb')
      expect(DS.colors.onPrimary).toBe('#ffffff')
    })

    it('has error colors defined', () => {
      expect(DS.colors.error).toBe('#ba1a1a')
      expect(DS.colors.errorContainer).toBe('#ffdad6')
      expect(DS.colors.onError).toBe('#ffffff')
    })

    it('has surface colors defined', () => {
      expect(DS.colors.surface).toBe('#faf8ff')
      expect(DS.colors.onSurface).toBe('#191b23')
      expect(DS.colors.background).toBe('#faf8ff')
    })

    it('has all required color tokens', () => {
      const requiredColors = [
        'primary', 'secondary', 'tertiary', 'error',
        'surface', 'background', 'outline', 'outlineVariant',
      ]
      requiredColors.forEach((color) => {
        expect(DS.colors).toHaveProperty(color)
      })
    })
  })

  describe('Typography', () => {
    it('has font family defined', () => {
      expect(DS.typography.fontFamily).toContain('Inter')
    })

    it('has all size variants', () => {
      expect(DS.typography.display).toBeDefined()
      expect(DS.typography.h1).toBeDefined()
      expect(DS.typography.h2).toBeDefined()
      expect(DS.typography.h3).toBeDefined()
      expect(DS.typography.bodyLg).toBeDefined()
      expect(DS.typography.bodyMd).toBeDefined()
      expect(DS.typography.bodySm).toBeDefined()
      expect(DS.typography.labelCaps).toBeDefined()
      expect(DS.typography.mono).toBeDefined()
    })

    it('mono font family contains JetBrains Mono', () => {
      expect(DS.typography.mono.fontFamily).toContain('JetBrains Mono')
    })
  })

  describe('Roundness', () => {
    it('has all roundness values', () => {
      expect(DS.roundness.sm).toBe('0.25rem')
      expect(DS.roundness.md).toBe('0.5rem')
      expect(DS.roundness.lg).toBe('0.75rem')
      expect(DS.roundness.xl).toBe('1rem')
      expect(DS.roundness.xxl).toBe('1.5rem')
      expect(DS.roundness.full).toBe('9999px')
    })
  })

  describe('Spacing', () => {
    it('has base spacing values', () => {
      expect(DS.spacing[0]).toBe('0')
      expect(DS.spacing[1]).toBe('0.25rem')
      expect(DS.spacing[4]).toBe('1rem')
      expect(DS.spacing[8]).toBe('2rem')
    })
  })

  describe('Shadows', () => {
    it('has card, modal, and button shadows', () => {
      expect(DS.shadows.card).toBeDefined()
      expect(DS.shadows.modal).toBeDefined()
      expect(DS.shadows.btn).toBeDefined()
    })
  })

  describe('Transitions', () => {
    it('has fast and normal transitions', () => {
      expect(DS.transitions.fast).toBe('150ms ease')
      expect(DS.transitions.normal).toBe('250ms ease')
    })
  })
})
