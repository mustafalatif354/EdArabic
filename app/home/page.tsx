"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ProgressManager, ProgressData } from "@/lib/progress"
import { LevelingSystem, UserLevelData } from "@/lib/leveling"
import InstallPWA from "@/components/InstallPWA"

// Custom styles for 3D effects
const customStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  
  .transform-3d {
    transform-style: preserve-3d;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

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
  const [userLevelData, setUserLevelData] = useState<UserLevelData | null>(null)

  // Lessons data organized by category
  const alphabetLessons = [
    { id: 1, title: "Les 1: Arabisch Alfabet - Eerste Helft", color: "from-emerald-400 to-emerald-600", icon: "📚" },
    { id: 2, title: "Les 2: Arabisch Alfabet - Tweede Helft", color: "from-blue-400 to-blue-600", icon: "🔤" },
    { id: 3, title: "Les 3: Geavanceerde Letters", color: "from-purple-400 to-purple-600", icon: "✨" },
    { id: 4, title: "Les 4: Nieuwe Vormen", color: "from-pink-400 to-pink-600", icon: "🎨" },
    { id: 5, title: "Les 5: Uitbreiding", color: "from-indigo-400 to-indigo-600", icon: "📖" },
    { id: 6, title: "Les 6: Verder Leren", color: "from-cyan-400 to-cyan-600", icon: "🌟" },
    { id: 7, title: "Les 7: Bijna Klaar", color: "from-teal-400 to-teal-600", icon: "🎯" },
    { id: 8, title: "Les 8: Complete Alfabet", color: "from-emerald-500 to-blue-500", icon: "🏆" },
  ]

  const tajweedLessons: any[] = []
  const quranReadLessons: any[] = []
  const quranListenLessons: any[] = []

  const getLessonProgress = (lessonId: number) => {
    if (!userProgress) return { completed: false, progress: 0 }
    const progress = userProgress.find((p: any) => p.lesson_id === lessonId)
    return progress ? { completed: progress.completed, progress: progress.completed ? 100 : 0 } : { completed: false, progress: 0 }
  }

  const isLessonUnlocked = (lessonId: number) => {
    return ProgressManager.isLessonUnlocked(lessonId, userProgress)
  }

  const isComprehensiveTestCompleted = () => {
    return ProgressManager.isComprehensiveTestCompleted(userProgress)
  }

  // Helper function to render lesson cards
  const renderLessonCard = (lesson: any) => {
    const progress = getLessonProgress(lesson.id)
    const unlocked = isLessonUnlocked(lesson.id)
    const isLocked = !unlocked
    return (
      <div
        key={lesson.id}
        onClick={() => {
          if (!isLocked) {
            router.push(`/lessons/${lesson.id}`)
          }
        }}
        className={`group relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl transition-all duration-500 overflow-hidden ${
          isLocked 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 cursor-pointer'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <div className="text-sm font-bold text-gray-700">Vergrendeld</div>
              <div className="text-xs text-gray-600 mt-1">
                {lesson.id === 2 ? 'Voltooi les 1 eerst' : 'Voltooi de comprehensieve test eerst'}
              </div>
            </div>
          </div>
        )}
        {/* Gradient Background on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${lesson.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        
        {/* Icon */}
        <div className="relative z-10 text-center mb-4">
          <div className="inline-block text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
            {lesson.icon}
          </div>
          <div className={`w-16 h-1 bg-gradient-to-r ${lesson.color} mx-auto rounded-full`} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors duration-300">
            {lesson.title}
          </h3>
          
          {/* Progress Indicator */}
          {progress.completed ? (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-emerald-600 text-sm font-medium">✓ Voltooid</span>
            </div>
          ) : progress.progress > 0 ? (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${lesson.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 mt-1">{progress.progress}%</span>
            </div>
          ) : (
            <span className="text-gray-500 text-sm mt-2 block">Nog niet gestart</span>
          )}
        </div>

        {/* Floating particles on hover */}
        <div className={`absolute top-4 right-4 w-2 h-2 bg-gradient-to-r ${lesson.color} rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-300`} />
        <div className={`absolute bottom-4 left-4 w-3 h-3 bg-gradient-to-r ${lesson.color} rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-300`} 
             style={{ animationDelay: '0.5s' }} />
      </div>
    )
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
        
        // Fetch user level data
        const levelData = await LevelingSystem.getUserLevelData()
        setUserLevelData(levelData)
        
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
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="min-h-screen relative overflow-hidden">
        {/* 3D Background Elements */}
        <div className="fixed inset-0 -z-10">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-blue-50 to-purple-100 animate-pulse" />
          
          {/* Floating 3D shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full opacity-20 animate-bounce" 
               style={{ animationDuration: '6s', animationDelay: '0s' }} />
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-20 animate-bounce" 
               style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full opacity-20 animate-bounce" 
               style={{ animationDuration: '7s', animationDelay: '4s' }} />
          <div className="absolute top-60 right-1/3 w-28 h-28 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full opacity-20 animate-bounce" 
               style={{ animationDuration: '9s', animationDelay: '1s' }} />
          
          {/* Geometric shapes */}
          <div className="absolute top-32 right-10 w-16 h-16 bg-gradient-to-r from-emerald-300 to-blue-300 rotate-45 opacity-30 animate-spin" 
               style={{ animationDuration: '20s' }} />
          <div className="absolute bottom-32 left-10 w-12 h-12 bg-gradient-to-r from-blue-300 to-purple-300 rotate-12 opacity-30 animate-spin" 
               style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-emerald-400 rounded-full opacity-60 animate-ping" 
               style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-ping" 
               style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-ping" 
               style={{ animationDelay: '2s' }} />
          
          {/* Background pattern overlay */}
          <div className="absolute inset-0 opacity-5" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                 backgroundSize: '60px 60px'
               }} />
        </div>

        {/* Navigation */}
        <nav className="fixed top-1 w-full bg-white/90 backdrop-blur-sm shadow-sm z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <h1 
                  className="text-2xl font-bold text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors"
                  onClick={() => router.push('/')}
                >
                  EdArabic
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Welkom terug, {userProfile?.username || user?.email?.split('@')[0]}
                </p>
                {userLevelData && (
                  <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 rounded-lg border border-emerald-200">
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Level</div>
                      <div className="text-xl font-bold text-emerald-600">{userLevelData.level}</div>
                    </div>
                    <div className="w-px h-8 bg-emerald-200"></div>
                    <div className="text-center min-w-[60px]">
                      <div className="text-xs text-gray-600">XP</div>
                      <div className="text-lg font-bold text-emerald-600">{userLevelData.xp}</div>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${userLevelData.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
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
        </nav>

        {/* Main Content */}
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                 <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Kies een les om te beginnen of verder te gaan
              </p>
              
              {/* Level Display - Always visible */}
              <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6">
                {userLevelData ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-600 mb-1">Level {userLevelData.level}</div>
                      <div className="text-sm text-gray-600">Huidig Level</div>
                    </div>
                    <div className="hidden sm:block w-px h-16 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{userLevelData.xp}</div>
                      <div className="text-sm text-gray-600">Totaal XP</div>
                    </div>
                    <div className="hidden sm:block w-px h-16 bg-gray-300"></div>
                    <div className="flex-1 max-w-xs w-full">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Naar Level {userLevelData.level + 1}</span>
                        <span>{userLevelData.xpProgress}/{userLevelData.xpForNextLevel - LevelingSystem.getXPForLevel(userLevelData.level)} XP</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${userLevelData.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-600 mb-1">Level 1</div>
                      <div className="text-sm text-gray-600">Huidig Level</div>
                    </div>
                    <div className="w-px h-16 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
                      <div className="text-sm text-gray-600">Totaal XP</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alphabet Lessons Section */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">📚</div>
                <h2 className="text-3xl font-bold text-gray-900">Arabisch Alfabet</h2>
                <div className="flex-1 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Lessons 1 & 2 */}
                {alphabetLessons.slice(0, 2).map((lesson) => renderLessonCard(lesson))}
                
                {/* Comprehensive Test Block */}
                {(() => {
                  const comprehensiveProgress = getLessonProgress(99)
                  const lesson2Completed = getLessonProgress(2).completed
                  const canTakeTest = lesson2Completed && !comprehensiveProgress.completed
                  const testCompleted = comprehensiveProgress.completed
                  
                  return (
                    <div
                      key="comprehensive-test"
                      onClick={() => {
                        if (canTakeTest || testCompleted) {
                          router.push('/lessons/99/test')
                        }
                      }}
                      className={`group relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl transition-all duration-500 overflow-hidden ${
                        canTakeTest || testCompleted
                          ? 'hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                        border: '2px solid rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {!lesson2Completed && (
                        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🔒</div>
                            <div className="text-sm font-bold text-gray-700">Vergrendeld</div>
                            <div className="text-xs text-gray-600 mt-1">Voltooi les 2 eerst</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="relative z-10">
                        <div className="text-center mb-4">
                          <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                            🎯
                          </div>
                          <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-600 mx-auto rounded-full"></div>
                        </div>
                        
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                            Comprehensieve Test
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            Alle 28 letters
                          </p>
                          
                          {testCompleted ? (
                            <div className="flex items-center justify-center gap-2 mt-3">
                              <span className="text-emerald-600 text-sm font-medium">✓ Voltooid</span>
                            </div>
                          ) : canTakeTest ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-3">
                              <p className="text-blue-800 text-xs font-medium">
                                Minimaal 80% nodig
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-xs mt-3">Voltooi les 2 eerst</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
                
                {/* Lessons 3+ */}
                {alphabetLessons.slice(2).map((lesson) => renderLessonCard(lesson))}
              </div>
            </div>

            {/* Tajweed Lessons Section */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🕌</div>
                <h2 className="text-3xl font-bold text-gray-900">Tajweed Leren</h2>
                <div className="flex-1 h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
              </div>
              {tajweedLessons.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tajweedLessons.map((lesson) => renderLessonCard(lesson))}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl">
                  <div className="text-6xl mb-4">🕌</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Tajweed Lessen</h3>
                  <p className="text-gray-600 mb-4">Leer de regels voor correcte Quran recitatie</p>
                  <p className="text-gray-500 text-sm">Binnenkort beschikbaar</p>
                </div>
              )}
            </div>

            {/* Reading Quran Lessons Section */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">📖</div>
                <h2 className="text-3xl font-bold text-gray-900">Quran Lezen</h2>
                <div className="flex-1 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              </div>
              {quranReadLessons.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quranReadLessons.map((lesson) => renderLessonCard(lesson))}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl">
                  <div className="text-6xl mb-4">📖</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Quran Lezen</h3>
                  <p className="text-gray-600 mb-4">Lees de heilige Quran</p>
                  <p className="text-gray-500 text-sm">Binnenkort beschikbaar</p>
                </div>
              )}
            </div>

            {/* Listening to Quran Lessons Section */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🎧</div>
                <h2 className="text-3xl font-bold text-gray-900">Quran Luisteren</h2>
                <div className="flex-1 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"></div>
              </div>
              {quranListenLessons.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quranListenLessons.map((lesson) => renderLessonCard(lesson))}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl">
                  <div className="text-6xl mb-4">🎧</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Quran Luisteren</h3>
                  <p className="text-gray-600 mb-4">Luister en leer van mooie Quran recitatie</p>
                  <p className="text-gray-500 text-sm">Binnenkort beschikbaar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* PWA Install Prompt */}
      <InstallPWA />
    </>
  )
}