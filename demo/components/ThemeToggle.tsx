'use client'

import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return '🌓'
    }
    return resolvedTheme === 'dark' ? '🌙' : '☀️'
  }

  const getLabel = () => {
    if (theme === 'system') {
      return 'System'
    }
    return resolvedTheme === 'dark' ? 'Dark' : 'Light'
  }

  return (
    <button
      onClick={cycleTheme}
      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors leading-none flex items-center"
      title={`Theme: ${getLabel()} (click to cycle)`}
      aria-label={`Switch theme (currently ${getLabel()})`}
    >
      <span className="text-sm leading-none">{getIcon()}</span>
      <span className="ml-1.5 text-xs hidden md:inline leading-none">{getLabel()}</span>
    </button>
  )
}

