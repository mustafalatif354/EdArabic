"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Lang = "nl" | "en"

interface LanguageContextType {
  lang: Lang
  toggleLang: () => void
  t: (nl: string, en: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "nl",
  toggleLang: () => {},
  t: (nl) => nl,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("nl")

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("edarabic-lang") as Lang | null
    if (saved === "nl" || saved === "en") setLang(saved)
  }, [])

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === "nl" ? "en" : "nl"
      localStorage.setItem("edarabic-lang", next)
      return next
    })
  }

  // Helper: pick nl or en string based on current lang
  const t = (nl: string, en: string) => lang === "nl" ? nl : en

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
