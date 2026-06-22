"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function TajweedExercisePage() {
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
                <h1 className="text-3xl font-bold text-gray-900">🕌 Tajweed leren</h1>
                <p className="text-gray-600">Leer de regels voor correcte Quran recitatie</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coming Soon Message */}
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-6">🕌</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tajweed Oefeningen</h2>
          <p className="text-xl text-gray-600 mb-8">
            Binnenkort beschikbaar! Leer de essentiële tajweed regels zoals Idgham, Ikhfa, Madd, Qalqalah, Ghunnah en Makharij.
          </p>
          <div className="bg-purple-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-purple-800 mb-4">Wat je gaat leren:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">🔄</span>
                <span>Idgham - Letters samensmelten</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">👁️</span>
                <span>Ikhfa - Verborgen uitspraak</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">⏱️</span>
                <span>Madd - Verlengingen</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">🔊</span>
                <span>Qalqalah - Echo-effecten</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">👃</span>
                <span>Ghunnah - Nasale klanken</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">🗣️</span>
                <span>Makharij - Uitspraakplaatsen</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/home')}
            className="bg-purple-500 text-white px-8 py-3 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    </main>
  )
}
