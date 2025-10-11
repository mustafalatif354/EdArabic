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

  const lessons = [
    {
      id: 1,
      title: "Les 1: Arabisch Alfabet - Basis",
      description: "Leer de eerste vier letters van het Arabische alfabet",
      letters: ["ا", "ب", "ت", "ث"],
      ...getLessonProgress(1)
    },
    {
      id: 2,
      title: "Les 2: Meer Letters",
      description: "Uitbreiding van het Arabische alfabet",
      letters: ["ج", "ح", "خ", "د"],
      ...getLessonProgress(2)
    },
    {
      id: 3,
      title: "Les 3: Geavanceerde Letters",
      description: "Complexere Arabische letters leren",
      letters: ["ذ", "ر", "ز", "س"],
      ...getLessonProgress(3)
    },
    {
      id: 4,
      title: "Les 4: Nieuwe Vormen",
      description: "Leer meer Arabische lettervormen",
      letters: ["ش", "ص", "ض", "ط"],
      ...getLessonProgress(4)
    },
    {
      id: 5,
      title: "Les 5: Uitbreiding",
      description: "Meer letters van het Arabische alfabet",
      letters: ["ظ", "ع", "غ", "ف"],
      ...getLessonProgress(5)
    },
    {
      id: 6,
      title: "Les 6: Verder Leren",
      description: "Nog meer Arabische letters",
      letters: ["ق", "ك", "ل", "م"],
      ...getLessonProgress(6)
    },
    {
      id: 7,
      title: "Les 7: Bijna Klaar",
      description: "De laatste letters van het alfabet",
      letters: ["ن", "ه", "و", "ي"],
      ...getLessonProgress(7)
    },
    {
      id: 8,
      title: "Les 8: Complete Alfabet",
      description: "Alle 28 letters van het Arabische alfabet",
      letters: [],
      ...getLessonProgress(8)
    }
  ]

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

  const navigateToLesson = (lessonId: number) => {
    const isUnlocked = ProgressManager.isLessonUnlocked(lessonId, userProgress)
    if (isUnlocked) {
      router.push(`/lessons/${lessonId}`)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">EdArabic</h1>
              <p className="text-gray-600">
                Welkom terug, {userProfile?.username || user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Uitloggen
            </button>
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

        {/* Lessons Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Beschikbare Lessen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => {
              const isUnlocked = ProgressManager.isLessonUnlocked(lesson.id, userProgress)
              const isCompleted = lesson.completed
              
              return (
                <div
                  key={lesson.id}
                  className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
                    isUnlocked 
                      ? 'hover:shadow-xl cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => navigateToLesson(lesson.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{lesson.title}</h3>
                    <div className="flex items-center space-x-2">
                      {!isUnlocked && (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className={`w-3 h-3 rounded-full ${
                        isCompleted ? 'bg-green-500' : isUnlocked ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{lesson.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex space-x-2 mb-2">
                      {lesson.letters.map((letter, index) => (
                        <div
                          key={index}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${
                            isCompleted ? 'bg-green-100 text-green-800' : 'bg-emerald-100 text-gray-800'
                          }`}
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      {lesson.letters.length} letters
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isUnlocked && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Voortgang</span>
                        <span className="text-sm text-gray-600">{lesson.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${lesson.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {!isUnlocked ? 'Vergrendeld' : isCompleted ? 'Voltooid' : 'Beschikbaar'}
                    </div>
                    <button 
                      className={`px-4 py-2 rounded-lg transition ${
                        isUnlocked 
                          ? isCompleted
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!isUnlocked}
                    >
                      {!isUnlocked ? 'Vergrendeld' : isCompleted ? 'Herhaal' : 'Start Les'}
                    </button>
                  </div>
                </div>
              )
            })}
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
