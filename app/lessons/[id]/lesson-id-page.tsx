"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { getLessonWithLetters, Lesson } from "@/lib/lessonsData"
import { ProgressManager } from "@/lib/progress"

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [audio] = useState<HTMLAudioElement>(new Audio())

  const lessonId = parseInt(params.id as string)

  useEffect(() => {
    if (!user) return

    async function loadLesson() {
      // Fetch user progress
      const progress = await ProgressManager.getUserProgress()

      // Check if lesson is unlocked
      if (lessonId !== 1 && !ProgressManager.isLessonUnlocked(lessonId, progress)) {
        alert('Deze les is nog vergrendeld. Voltooi eerst de vereiste lessen. / This lesson is still locked. Complete the required lessons first.')
        router.push("/home")
        return
      }

      // Fetch lesson + letters from Supabase
      const lessonData = await getLessonWithLetters(lessonId)
      if (!lessonData) {
        setDataLoading(false)
        return
      }

      setLesson(lessonData)
      setDataLoading(false)
    }

    loadLesson()
  }, [user, lessonId, router])

  const playSound = (soundFile: string | null) => {
    if (!soundFile) return
    audio.src = soundFile
    audio.play().catch(error => {
      console.log("Audio play failed:", error)
    })
  }

  const goBack = () => router.push("/home")
  const goToTest = () => router.push(`/lessons/${lessonId}/test`)

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p>Bezig met laden...</p>
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Les niet gevonden / Lesson not found</h1>
          <button
            onClick={goBack}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition"
          >
            Terug naar Dashboard / Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              onClick={goBack}
              className="flex items-center text-emerald-600 hover:text-emerald-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Terug naar Dashboard
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title_nl}</h1>
              <p className="text-sm text-gray-400">{lesson.title_en}</p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Instructies / Instructions</h2>
          <p className="text-gray-600 mb-4">
            Klik op elke letter om de uitspraak te horen. Probeer elke letter meerdere keren uit te spreken. /
            Click each letter to hear its pronunciation. Try to say each letter out loud multiple times.
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Zorg dat je geluid aanstaat / Make sure your sound is on
          </div>
        </div>

        {/* Letters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(lesson.letters ?? []).map((letter) => (
            <div
              key={letter.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <button
                onClick={() => playSound(letter.sound_file)}
                className="w-full text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl"
              >
                <div className="text-8xl font-bold mb-4 text-gray-800 hover:text-emerald-600 transition-colors">
                  {letter.symbol}
                </div>
              </button>
              
              <div className="text-center">
                <h3 className="text-xl font-bold mb-1">{letter.name}</h3>
                {letter.transliteration && (
                  <p className="text-emerald-600 text-sm font-mono mb-2">/{letter.transliteration}/</p>
                )}
                <p className="text-gray-600 text-sm mb-1">{letter.description_nl}</p>
                <p className="text-gray-400 text-xs mb-4">{letter.description_en}</p>
                
                <button
                  onClick={() => playSound(letter.sound_file)}
                  className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Luister / Listen
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Test Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Test Je Kennis / Test Your Knowledge</h2>
          {lessonId === 2 ? (
            <>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">📚 Comprehensieve Test / Comprehensive Test</h3>
                <p className="text-blue-800 text-sm mb-2">
                  Na het voltooien van deze les kun je de <strong>comprehensieve test</strong> maken die alle 28 letters test. /
                  After completing this lesson you can take the <strong>comprehensive test</strong> covering all 28 letters.
                </p>
                <p className="text-blue-800 text-sm">
                  Je moet minimaal <strong>80%</strong> scoren om door te gaan naar les 3. /
                  You need at least <strong>80%</strong> to unlock lesson 3.
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Doe eerst de test over de letters van deze les (70% nodig). /
                First complete the test for this lesson's letters (70% required).
              </p>
            </>
          ) : (
            <p className="text-gray-600 mb-6">
              Nu ga je een korte test doen om te zien of je de letters goed kent. Je moet 70% of hoger scoren. /
              You'll now take a short test. You need 70% or higher to complete the lesson.
            </p>
          )}
          
          <div className="flex flex-wrap gap-4 mb-6">
            {(lesson.letters ?? []).map((letter) => (
              <button
                key={letter.id}
                onClick={() => playSound(letter.sound_file)}
                className="bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-600 px-4 py-2 rounded-lg transition flex items-center"
              >
                <span className="text-2xl mr-2">{letter.symbol}</span>
                <span className="text-sm">{letter.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={goToTest}
            className="w-full bg-emerald-500 text-white py-3 px-6 rounded-lg hover:bg-emerald-600 transition text-lg font-semibold"
          >
            Start Test
          </button>
        </div>
      </div>
    </main>
  )
}
