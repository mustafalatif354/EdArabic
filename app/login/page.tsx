"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useLanguage } from "@/lib/LanguageContext"

export default function LoginPage() {
  const router = useRouter()
  const { t, lang, toggleLang } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (data.user) router.push("/home")
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(t("Login mislukt: ", "Login failed: ") + error.message)
      } else {
        router.push("/home")
      }
    } catch {
      setMessage(t("Er is een fout opgetreden tijdens het inloggen", "An error occurred during login"))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setMessage(t("Registratie mislukt: ", "Registration failed: ") + authError.message)
      } else if (authData.user) {
        const { error: profileError } = await supabase.from("user_profiles").insert({
          user_id: authData.user.id,
          username,
          email,
          created_at: new Date().toISOString(),
        })
        if (profileError) {
          setMessage(t("Account aangemaakt, maar profiel kon niet worden opgeslagen.", "Account created, but profile could not be saved."))
        } else {
          setMessage(t("Registratie succesvol! Je kunt nu inloggen.", "Registration successful! You can now log in."))
        }
        setEmail(""); setPassword(""); setUsername("")
        setTimeout(() => { setIsRegistering(false); setMessage("") }, 3000)
      }
    } catch {
      setMessage(t("Er is een fout opgetreden tijdens de registratie", "An error occurred during registration"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        {/* Language toggle at top */}
        <div className="flex justify-end mb-4">
          <button onClick={toggleLang}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:border-emerald-400 transition">
            <span>{lang === "nl" ? "🇬🇧" : "🇳🇱"}</span>
            <span>{lang === "nl" ? "English" : "Nederlands"}</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">
          {isRegistering ? t("Registreren", "Register") : t("Inloggen", "Log in")}
        </h1>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Gebruikersnaam (optioneel)", "Username (optional)")}
              </label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder={t("Kies een gebruikersnaam", "Choose a username")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Wachtwoord", "Password")}
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {isRegistering && (
              <p className="text-xs text-gray-500 mt-1">{t("Minimaal 6 karakters", "At least 6 characters")}</p>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes("succesvol") || message.includes("successful") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50">
            {loading
              ? (isRegistering ? t("Registreren...", "Registering...") : t("Inloggen...", "Logging in..."))
              : (isRegistering ? t("Registreren", "Register") : t("Inloggen", "Log in"))
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsRegistering(!isRegistering); setMessage(""); setEmail(""); setPassword(""); setUsername("") }}
            className="text-emerald-600 hover:text-emerald-700 text-sm">
            {isRegistering
              ? t("Al een account? Inloggen", "Already have an account? Log in")
              : t("Nog geen account? Registreren", "No account yet? Register")
            }
          </button>
        </div>
      </div>
    </main>
  )
}
