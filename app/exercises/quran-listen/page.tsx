"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function QuranListenExercisePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p>Bezig met laden...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/home')}
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                ← Terug naar Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🎧 Quran luisteren</h1>
                <p className="text-gray-600">Luister en leer van mooie Quran recitatie</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coming Soon Message */}
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-6">🎧</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quran Luisteren Oefeningen</h2>
          <p className="text-xl text-gray-600 mb-8">
            Binnenkort beschikbaar! Luister naar mooie Quran recitatie en verbeter je uitspraak en memorisatie.
          </p>
          <div className="bg-indigo-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-indigo-800 mb-4">Wat je gaat leren:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-indigo-600">🎵</span>
                <span>Luister & Herhaal (5-10 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-indigo-600">👂</span>
                <span>Tajweed Luisteren (10-15 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-indigo-600">🧠</span>
                <span>Memorisatie (15-20 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-indigo-600">⚡</span>
                <span>Snelheid Training (10-15 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-indigo-600">❤️</span>
                <span>Emotionele Recitatie (20-30 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-indigo-600">🔄</span>
                <span>Vergelijk & Leer (15-25 min)</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/home')}
            className="bg-indigo-500 text-white px-8 py-3 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    </main>
  )
}
