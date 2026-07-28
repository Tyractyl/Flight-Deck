import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.dataset.theme = resolved
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('tyractyl_theme') as Theme) || 'dark',
  resolvedTheme: resolveTheme((localStorage.getItem('tyractyl_theme') as Theme) || 'dark'),
  setTheme: (theme) => {
    localStorage.setItem('tyractyl_theme', theme)
    applyTheme(theme)
    set({ theme, resolvedTheme: resolveTheme(theme) })
  },
  toggleTheme: () => {
    const current = get().theme
    const next: Theme = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark'
    localStorage.setItem('tyractyl_theme', next)
    applyTheme(next)
    set({ theme: next, resolvedTheme: resolveTheme(next) })
  },
}))

// Apply theme on load
if (typeof window !== 'undefined') {
  const saved = (localStorage.getItem('tyractyl_theme') as Theme) || 'dark'
  applyTheme(saved)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useThemeStore.getState().theme
    if (current === 'system') {
      applyTheme('system')
      useThemeStore.setState({ resolvedTheme: getSystemTheme() })
    }
  })
}
