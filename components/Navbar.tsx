"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useLanguage } from "@/lib/LanguageContext"

const navStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');

  .edarabic-nav {
    background: rgba(10, 10, 15, 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(212, 175, 55, 0.18);
  }

  .nav-logo {
    font-family: 'Cormorant Garamond', serif;
    color: #d4af37;
    letter-spacing: 0.02em;
  }

  .nav-diamond {
    width: 24px;
    height: 24px;
    transform: rotate(45deg);
    background: linear-gradient(135deg, #d4af37, #b8941f);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.5);
    transition: box-shadow 0.4s, transform 0.4s;
  }
  .nav-logo-wrap:hover .nav-diamond {
    transform: rotate(135deg);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.8);
  }

  .nav-link {
    color: rgba(245, 236, 215, 0.7);
    transition: all 0.3s;
    position: relative;
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.03em;
  }
  .nav-link:hover {
    color: #d4af37;
  }
  .nav-link.active {
    color: #d4af37;
  }
  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: #d4af37;
    transform: translateX(-50%) rotate(45deg);
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.8);
  }

  .nav-toggle {
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.3);
    background: rgba(212, 175, 55, 0.05);
    transition: all 0.3s;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    padding: 6px 12px;
    border-radius: 2px;
  }
  .nav-toggle:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
  }

  .nav-logout {
    color: rgba(245, 236, 215, 0.5);
    font-size: 0.813rem;
    padding: 6px 14px;
    transition: color 0.3s;
  }
  .nav-logout:hover {
    color: #e74c3c;
  }

  .nav-hamburger {
    color: #d4af37;
    padding: 8px;
    border-radius: 4px;
    transition: background 0.3s;
  }
  .nav-hamburger:hover {
    background: rgba(212, 175, 55, 0.1);
  }

  .mobile-menu {
    border-top: 1px solid rgba(212, 175, 55, 0.15);
  }
  .mobile-link {
    color: rgba(245, 236, 215, 0.7);
    padding: 12px 16px;
    font-size: 0.875rem;
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s;
    width: 100%;
    text-align: left;
  }
  .mobile-link:hover {
    color: #d4af37;
    background: rgba(212, 175, 55, 0.05);
  }
  .mobile-link.active {
    color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
  }
`

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { lang, toggleLang, t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === "/" || pathname === "/login") return null

  const navLinks = [
    { label: t("Dashboard", "Dashboard"), href: "/home" },
    { label: t("Alfabet", "Alphabet"),    href: "/alphabet" },
    { label: t("Woorden", "Vocabulary"),  href: "/vocabulary" },
    { label: "Quran",                      href: "/quran" },
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
    <>
      <style dangerouslySetInnerHTML={{ __html: navStyles }} />
      <nav className="edarabic-nav fixed top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div
              className="nav-logo-wrap flex items-center gap-3 cursor-pointer"
              onClick={() => router.push("/home")}
            >
              <div className="nav-diamond" />
              <span className="nav-logo text-2xl font-medium">EdArabic</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`nav-link ${isActive(link.href) ? "active" : ""}`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={toggleLang}
                className="nav-toggle uppercase font-medium"
                title={lang === "nl" ? "Switch to English" : "Schakel naar Nederlands"}
              >
                {lang === "nl" ? "NL · EN" : "EN · NL"}
              </button>
              <button onClick={handleLogout} className="nav-logout">
                {t("Uitloggen", "Logout")}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden nav-hamburger"
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
            <div className="mobile-menu md:hidden pb-4 pt-2">
              {navLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => { router.push(link.href); setMenuOpen(false) }}
                  className={`mobile-link ${isActive(link.href) ? "active" : ""}`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => { toggleLang(); setMenuOpen(false) }}
                className="mobile-link"
              >
                {lang === "nl" ? "🇬🇧 English" : "🇳🇱 Nederlands"}
              </button>
              <button onClick={handleLogout} className="mobile-link" style={{ color: '#e74c3c' }}>
                {t("Uitloggen", "Logout")}
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
