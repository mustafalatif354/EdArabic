"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Check if user is already logged in
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push("/home") // Redirect to homepage if already logged in
      }
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage("Login mislukt: " + error.message)
      } else {
        router.push("/home") // Redirect to homepage after successful login
      }
    } catch (error) {
      setMessage("Er is een fout opgetreden tijdens het inloggen")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setMessage("Registratie mislukt: " + authError.message)
      } else if (authData.user) {
        // Save user profile with username
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            username: username,
            email: email,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setMessage("Account aangemaakt, maar profiel kon niet worden opgeslagen.")
        } else {
          setMessage("Registratie succesvol! Je kunt nu inloggen.")
        }

        // Clear form
        setEmail("")
        setPassword("")
        setUsername("")
        // Switch back to login after successful registration
        setTimeout(() => {
          setIsRegistering(false)
          setMessage("")
        }, 3000)
      }
    } catch (error) {
      setMessage("Er is een fout opgetreden tijdens de registratie")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isRegistering ? "Registreren" : "Inloggen"}
        </h1>
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Gebruikersnaam (optioneel)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kies een gebruikersnaam"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {isRegistering && (
              <p className="text-xs text-gray-500 mt-1">
                Minimaal 6 karakters
              </p>
            )}
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes("succesvol") 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading 
              ? (isRegistering ? "Registreren..." : "Inloggen...") 
              : (isRegistering ? "Registreren" : "Inloggen")
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering)
              setMessage("")
              setEmail("")
              setPassword("")
              setUsername("")
            }}
            className="text-emerald-600 hover:text-emerald-700 text-sm"
          >
            {isRegistering 
              ? "Al een account? Inloggen" 
              : "Nog geen account? Registreren"
            }
          </button>
        </div>
      </div>
    </main>
  )
}
