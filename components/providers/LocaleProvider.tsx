'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

type Locale = 'fr' | 'en'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
}

const LocaleContext = createContext<LocaleContextType | null>(null)

// Type for nested translation object
type TranslationValue = string | { [key: string]: TranslationValue }
type Translations = { [key: string]: TranslationValue }

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')
  const [translations, setTranslations] = useState<Translations>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('locale') as Locale
    if (saved && (saved === 'fr' || saved === 'en')) {
      setLocaleState(saved)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    fetch(`/locales/${locale}.json`)
      .then((res) => res.json())
      .then(setTranslations)
      .catch(() => setTranslations({}))
  }, [locale, mounted])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }, [])

  const t = useCallback((key: string, fallback?: string): string => {
    const keys = key.split('.')
    let value: TranslationValue | undefined = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }

    return typeof value === 'string' ? value : fallback || key
  }, [translations])

  if (!mounted) {
    return null
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
