import { useSyncExternalStore } from 'react'

// Single source of truth for the theme, shared across every component that
// calls useTheme (previously each call site held its own independent state and
// they only stayed in sync through the DOM attribute).

type Theme = 'dark' | 'light'

function readInitial(): Theme {
  const saved = localStorage.getItem('theme')
  return saved === 'light' ? 'light' : 'dark'
}

let current: Theme = readInitial()
const listeners = new Set<() => void>()

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}

// Apply synchronously on load to avoid a flash of the wrong theme.
apply(current)

function setTheme(theme: Theme) {
  current = theme
  apply(theme)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current)
  return {
    dark: theme === 'dark',
    toggle: () => setTheme(current === 'dark' ? 'light' : 'dark'),
  }
}
