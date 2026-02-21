"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import tr from '@/locales/tr.json'
import en from '@/locales/en.json'
import de from '@/locales/de.json'

type Language = 'tr' | 'en' | 'de'
type Translations = typeof tr

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, any> = { tr, en, de }

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language
    
    if (savedLang && (savedLang === 'tr' || savedLang === 'en' || savedLang === 'de')) {
      setLanguageState(savedLang)
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.split('-')[0] as Language
      if (['tr', 'en', 'de'].includes(browserLang)) {
        setLanguageState(browserLang)
      } else {
        setLanguageState('en') // Default fallback for international guests
      }
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('lang', lang)
  }

  const t = (path: string) => {
    const keys = path.split('.')
    let current = translations[language]
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return path // Fallback to key if not found
      }
      current = current[key]
    }
    
    return current as string
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

export const useLanguage = useTranslation
