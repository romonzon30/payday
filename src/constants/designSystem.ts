export const DS = {
  colors: {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#eeefff',
    inversePrimary: '#b4c5ff',
    primaryFixed: '#dbe1ff',
    primaryFixedDim: '#b4c5ff',
    onPrimaryFixed: '#00174b',
    onPrimaryFixedVariant: '#003ea8',

    secondary: '#396477',
    secondaryContainer: '#bae6fd',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#3d687c',
    secondaryFixed: '#bee9ff',
    secondaryFixedDim: '#a1cde3',
    onSecondaryFixed: '#001f2a',
    onSecondaryFixedVariant: '#1e4c5f',

    tertiary: '#943700',
    tertiaryContainer: '#bc4800',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#ffede6',
    tertiaryFixed: '#ffdbcd',
    tertiaryFixedDim: '#ffb596',
    onTertiaryFixed: '#360f00',
    onTertiaryFixedVariant: '#7d2d00',

    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',

    surface: '#faf8ff',
    surfaceDim: '#d9d9e5',
    surfaceBright: '#faf8ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f3f3fe',
    surfaceContainer: '#ededf9',
    surfaceContainerHigh: '#e7e7f3',
    surfaceContainerHighest: '#e1e2ed',
    onSurface: '#191b23',
    onSurfaceVariant: '#434655',
    inverseSurface: '#2e3039',
    inverseOnSurface: '#f0f0fb',
    surfaceTint: '#0053db',
    surfaceVariant: '#e1e2ed',

    background: '#faf8ff',
    onBackground: '#191b23',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
  } as const,

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: {
      fontSize: '48px',
      fontWeight: '700',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    },
    h1: {
      fontSize: '30px',
      fontWeight: '600',
      lineHeight: '36px',
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '32px',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '20px',
      fontWeight: '600',
      lineHeight: '28px',
    },
    bodyLg: {
      fontSize: '18px',
      fontWeight: '400',
      lineHeight: '28px',
    },
    bodyMd: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '24px',
    },
    bodySm: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '20px',
    },
    labelCaps: {
      fontSize: '12px',
      fontWeight: '600',
      lineHeight: '16px',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    mono: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '14px',
      fontWeight: '400',
    },
  } as const,

  roundness: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    xxl: '1.5rem',
    full: '9999px',
  } as const,

  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
  } as const,

  shadows: {
    card: '0px 1px 3px rgba(0,0,0,0.1), 0px 10px 20px -5px rgba(0,0,0,0.04)',
    modal: '0px 20px 25px -5px rgba(0,0,0,0.1)',
    btn: '0px 1px 2px rgba(0,0,0,0.08)',
  } as const,

  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
  } as const,
} as const

export type DSType = typeof DS
