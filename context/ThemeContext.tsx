'use client'
import { createContext, useContext } from 'react'

interface ThemeContextType {
  theme: 'dark'
  isDark: true
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
