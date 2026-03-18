import type { ReactNode } from 'react'

import type { ThemeMode } from '../types/quiz'

interface ShellProps {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  aside?: ReactNode
  theme: ThemeMode
  onToggleTheme: () => void
}

export function Shell({ eyebrow, title, subtitle, children, aside, theme, onToggleTheme }: ShellProps) {
  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div className="hero-panel__top">
          <div className="hero-panel__content">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="hero-copy">{subtitle}</p>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="theme-toggle__eyebrow">Theme</span>
            <span className="theme-toggle__value">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
        <div className="hero-panel__grid" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </header>

      <main className="content-grid">
        <section className="content-card">{children}</section>
        {aside ? <aside className="aside-card">{aside}</aside> : null}
      </main>
    </div>
  )
}
