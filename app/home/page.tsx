"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ProgressManager, ProgressData } from "@/lib/progress"
import InstallPWA from "@/components/InstallPWA"

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<ProgressData[]>([])
  const [progressStats, setProgressStats] = useState({
    completedLessons: 0,
    totalLessons: 8,
    averageProgress: 0,
    overallProgress: 0
  })

  const getLessonProgress = (lessonId: number) => {
    if (!userProgress) return { completed: false, progress: 0 }
    const progress = userProgress.find((p: any) => p.lesson_id === lessonId)
    return progress ? { completed: progress.completed, progress: progress.completed ? 100 : 0 } : { completed: false, progress: 0 }
  }


  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        setUserProfile(profile)

        // Fetch user progress using ProgressManager
        const progress = await ProgressManager.getUserProgress()
        setUserProgress(progress)
        
        // Calculate progress statistics
        const stats = ProgressManager.calculateProgressStats(progress)
        setProgressStats(stats)
        
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }


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
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                onClick={() => router.push('/')}
              >
                EdArabic
              </h1>
              <p className="text-gray-600">
                Welkom terug, {userProfile?.username || user?.email}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/')}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Homepage
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Jouw Voortgang</h2>
          
          {/* Overall Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Algemene Voortgang</span>
              <span className="text-sm font-medium text-gray-700">{progressStats.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressStats.overallProgress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <div className="text-3xl font-bold text-emerald-600">
                {progressStats.completedLessons}/{progressStats.totalLessons}
              </div>
              <div className="text-gray-600">Voltooide Lessen</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">
                {progressStats.averageProgress}%
              </div>
              <div className="text-gray-600">Gemiddelde Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">
                {progressStats.completedLessons * 4}
              </div>
              <div className="text-gray-600">Geleerde Letters</div>
            </div>
          </div>
        </div>

        {/* Exercise Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Oefeningen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Letters leren Category */}
            <div
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-l-4 border-emerald-500"
              onClick={() => router.push('/exercises/letters')}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Letters leren</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Leer het Arabische alfabet stap voor stap
                </p>
                <div className="text-xs text-gray-500">
                  {progressStats.completedLessons}/{progressStats.totalLessons} lessen voltooid
                </div>
              </div>
            </div>

            {/* Tajweed leren Category */}
            <div
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-l-4 border-purple-500"
              onClick={() => router.push('/exercises/tajweed')}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🕌</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tajweed leren</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Leer de regels voor correcte Quran recitatie
                </p>
                <div className="text-xs text-gray-500">
                  Binnenkort beschikbaar
                </div>
              </div>
            </div>

            {/* Quran lezen Category */}
            <div
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-l-4 border-blue-500"
              onClick={() => router.push('/exercises/quran-read')}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">📖</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quran lezen</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Oefen met het lezen van Quran verzen
                </p>
                <div className="text-xs text-gray-500">
                  Binnenkort beschikbaar
                </div>
              </div>
            </div>

            {/* Quran luisteren Category */}
            <div
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-l-4 border-indigo-500"
              onClick={() => router.push('/exercises/quran-listen')}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎧</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quran luisteren</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Luister en leer van mooie Quran recitatie
                </p>
                <div className="text-xs text-gray-500">
                  Binnenkort beschikbaar
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Snelle Statistieken</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{progressStats.totalLessons}</div>
              <div className="text-sm text-gray-600">Totale Lessen</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">28</div>
              <div className="text-sm text-gray-600">Totale Letters</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{progressStats.completedLessons}</div>
              <div className="text-sm text-gray-600">Voltooid</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{progressStats.averageProgress}%</div>
              <div className="text-sm text-gray-600">Gem. Score</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PWA Install Prompt */}
      <InstallPWA />
    </main>
  )
}
