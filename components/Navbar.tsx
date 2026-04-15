"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

const navLinks = [
  { label: "Dashboard",   labelEn: "Dashboard",   href: "/home",       icon: "🏠" },
  { label: "Alfabet",     labelEn: "Alphabet",     href: "/alphabet",   icon: "🔤" },
  { label: "Woordenschat",labelEn: "Vocabulary",   href: "/vocabulary", icon: "📖" },
  { label: "Quran",       labelEn: "Quran",        href: "/quran",      icon: "📗" },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Hide navbar on landing and login pages
  if (pathname === "/" || pathname === "/login") return null

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

          {/* Logout button — desktop */}
          <button
            onClick={handleLogout}
            className="hidden md:block text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
          >
            Uitloggen / Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Menu"
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
                <span className="text-base">{link.icon}</span>
                <span>{link.label} / {link.labelEn}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-3"
            >
              <span>🚪</span>
              <span>Uitloggen / Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
