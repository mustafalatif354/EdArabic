"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useLanguage } from "@/lib/LanguageContext"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { lang, toggleLang, t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === "/" || pathname === "/login") return null

  const navLinks = [
    { label: t("Dashboard", "Dashboard"), href: "/home",       icon: "🏠" },
    { label: t("Alfabet",   "Alphabet"),  href: "/alphabet",   icon: "🔤" },
    { label: t("Woorden",   "Vocabulary"),href: "/vocabulary", icon: "📖" },
    { label: t("Quran",     "Quran"),     href: "/quran",      icon: "📗" },
  ]

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home"
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div
            className="text-xl font-bold text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors shrink-0"
            onClick={() => router.push("/home")}
          >
            EdArabic
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive(link.href)
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          {/* Right side: language toggle + logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-all"
              title={lang === "nl" ? "Switch to English" : "Schakel naar Nederlands"}
            >
              <span>{lang === "nl" ? "🇳🇱" : "🇬🇧"}</span>
              <span>{lang === "nl" ? "NL" : "EN"}</span>
              <span className="text-gray-400">→</span>
              <span>{lang === "nl" ? "EN" : "NL"}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              {t("Uitloggen", "Logout")}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 pt-3">
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => { router.push(link.href); setMenuOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                  isActive(link.href)
                    ? "bg-emerald-500 text-white"
                    : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
            {/* Language toggle mobile */}
            <button
              onClick={() => { toggleLang(); setMenuOpen(false) }}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-emerald-50 flex items-center gap-3"
            >
              <span>{lang === "nl" ? "🇬🇧" : "🇳🇱"}</span>
              <span>{lang === "nl" ? "Switch to English" : "Schakel naar Nederlands"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-3"
            >
              <span>🚪</span>
              <span>{t("Uitloggen", "Logout")}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
