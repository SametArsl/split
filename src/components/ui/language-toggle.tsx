"use client"

import * as React from "react"
import { useLanguage } from "@/context/language-context"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-8 w-12 sm:h-9 sm:w-14">
        TR
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-12 sm:h-9 sm:w-14 shadow-sm font-bold"
      onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
      title={language === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
    >
      {language.toUpperCase()}
    </Button>
  )
}
