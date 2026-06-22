"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useLanguage } from "@/lib/LanguageContext"

const BG_LETTERS = ['ا','ب','ت','ج','ح','س','ع','ك','ل','م']

export default function LoginPage() {
  const router = useRouter()
  const { t, lang, toggleLang } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"error" | "success">("error")

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (data.user) router.push("/home")
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMessage("")
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessageType("error")
        setMessage(t("Login mislukt: ", "Login failed: ") + error.message)
      } else {
        router.push("/home")
      }
    } catch {
      setMessageType("error")
      setMessage(t("Er is een fout opgetreden", "An error occurred"))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMessage("")
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setMessageType("error")
        setMessage(t("Registratie mislukt: ", "Registration failed: ") + authError.message)
      } else if (authData.user) {
        const { error: profileError } = await supabase.from("user_profiles").insert({
          user_id: authData.user.id, username, email, created_at: new Date().toISOString(),
        })
        if (profileError) {
          setMessageType("error")
          setMessage(t("Account aangemaakt, maar profiel niet opgeslagen.", "Account created, but profile not saved."))
        } else {
          setMessageType("success")
          setMessage(t("Registratie succesvol! Je kunt nu inloggen.", "Registration successful! You can log in."))
        }
        setEmail(""); setPassword(""); setUsername("")
        setTimeout(() => { setIsRegistering(false); setMessage("") }, 3000)
      }
    } catch {
      setMessageType("error")
      setMessage(t("Er is een fout opgetreden", "An error occurred"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="luxe-bg min-h-screen flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        {BG_LETTERS.map((letter, i) => (
          <span key={i} className="floating-letter"
            style={{
              left: `${(i * 10) % 95}%`,
              top: `${(i * 13) % 90 + 5}%`,
              fontSize: `${3 + (i % 3)}rem`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${22 + (i % 6)}s`,
            }}>{letter}</span>
        ))}
      </div>

      <div className="luxe-content w-full max-w-md mx-auto px-6">

        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div style={{ width: 24, height: 24, transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #d4af37, #b8941f)', boxShadow: '0 0 12px rgba(212,175,55,0.5)' }} />
            <span className="font-display text-2xl" style={{ color: '#d4af37' }}>EdArabic</span>
          </div>
          <button onClick={toggleLang} className="btn-ghost text-xs px-3 py-2 rounded">
            {lang === "nl" ? "EN" : "NL"}
          </button>
        </div>

        <div className="glass-card rounded-lg p-10 reveal">
          <div className="text-center mb-8">
            <p className="eyebrow mb-3">
              {isRegistering ? t("Welkom", "Welcome") : t("Welkom terug", "Welcome back")}
            </p>
            <h1 className="font-display font-light" style={{ fontSize: '2.5rem', color: '#f5ecd7' }}>
              {isRegistering
                ? <>{t("Begin je", "Begin your")} <span className="italic gold-shimmer">{t("reis", "journey")}</span></>
                : <>{t("Ga", "Continue your")} <span className="italic gold-shimmer">{t("verder", "journey")}</span></>
              }
            </h1>
          </div>

          <div className="ornament mb-8">
            <span className="ornament-dot" />
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
            {isRegistering && (
              <div>
                <label className="eyebrow block mb-2" style={{ color: 'rgba(245,236,215,0.6)' }}>
                  {t("Gebruikersnaam", "Username")}
                </label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder={t("Optioneel", "Optional")}
                  className="luxe-input w-full px-4 py-3 rounded" />
              </div>
            )}
            <div>
              <label className="eyebrow block mb-2" style={{ color: 'rgba(245,236,215,0.6)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="luxe-input w-full px-4 py-3 rounded" />
            </div>
            <div>
              <label className="eyebrow block mb-2" style={{ color: 'rgba(245,236,215,0.6)' }}>
                {t("Wachtwoord", "Password")}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="luxe-input w-full px-4 py-3 rounded" />
              {isRegistering && (
                <p className="text-xs mt-2" style={{ color: 'rgba(245,236,215,0.4)' }}>
                  {t("Minimaal 6 karakters", "At least 6 characters")}
                </p>
              )}
            </div>

            {message && (
              <div className="glass-card-sm rounded p-3 text-sm" style={{
                borderColor: messageType === "error" ? 'rgba(231,76,60,0.3)' : 'rgba(20,163,115,0.3)',
                background: messageType === "error" ? 'rgba(231,76,60,0.05)' : 'rgba(20,163,115,0.05)',
                color: messageType === "error" ? '#e74c3c' : '#14a373',
              }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-4 rounded tracking-wide">
              {loading
                ? (isRegistering ? t("Registreren...", "Registering...") : t("Inloggen...", "Logging in..."))
                : (isRegistering ? t("Registreer", "Register") : t("Log in", "Log in"))
              }
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setMessage(""); setEmail(""); setPassword(""); setUsername("") }}
              className="eyebrow hover:text-yellow-400 transition" style={{ color: 'rgba(212,175,55,0.7)' }}>
              {isRegistering
                ? t("← Al een account? Inloggen", "← Already have an account? Log in")
                : t("Nog geen account? Registreer →", "No account yet? Register →")
              }
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-xs" style={{ color: 'rgba(245,236,215,0.3)', fontFamily: 'Cormorant Garamond', fontStyle: 'italic' }}>
          {t("Met zorg gemaakt voor de toegewijde leerling", "Crafted with care for the dedicated learner")}
        </p>
      </div>
    </main>
  )
}
