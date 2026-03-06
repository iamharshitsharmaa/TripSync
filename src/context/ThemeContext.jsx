import { createContext, useContext, useState, useEffect } from 'react'

export const LIGHT = {
  bg:         '#F4EFE6',
  bgAlt:      '#EDE6DA',
  bgCard:     '#FFFFFF',
  bgCardAlt:  '#FAFAF7',
  border:     '#D6CEBC',
  borderCard: '#E2DAC8',
  text:       '#162224',
  textMid:    '#3E5A5C',
  textMuted:  '#7A9496',
  inputBg:    '#F8F5F0',
  skyTeal:    '#5BB8C4',
  deepTeal:   '#1C6B72',
  sage:       '#6B9E62',
  shadow:     'rgba(28,107,114,0.10)',
  sidebar:    '#FFFFFF',
  sidebarAlt: '#F8F5F0',
  activeBg:   'rgba(28,107,114,0.08)',
  hoverBg:    'rgba(28,107,114,0.05)',
  isDark:     false,
}

export const DARK = {
  bg:         '#0e1a1c',
  bgAlt:      '#152022',
  bgCard:     '#1a2c2e',
  bgCardAlt:  '#172426',
  border:     'rgba(91,184,196,0.14)',
  borderCard: 'rgba(91,184,196,0.11)',
  text:       '#e6f0f1',
  textMid:    '#a4c2c4',
  textMuted:  '#628486',
  inputBg:    'rgba(91,184,196,0.07)',
  skyTeal:    '#5BB8C4',
  deepTeal:   '#3a9aa4',
  sage:       '#7aae70',
  shadow:     'rgba(0,0,0,0.40)',
  sidebar:    '#101e20',
  sidebarAlt: '#142224',
  activeBg:   'rgba(91,184,196,0.10)',
  hoverBg:    'rgba(91,184,196,0.06)',
  isDark:     true,
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('ts-theme') === 'dark' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('ts-theme', dark ? 'dark' : 'light') } catch {}
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  const T = dark ? DARK : LIGHT
  const toggle = () => setDark(d => !d)

  return (
    <ThemeContext.Provider value={{ T, dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Safe hook — falls back to LIGHT if used outside ThemeProvider
export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { T: LIGHT, dark: false, toggle: () => {} }
  return ctx
}