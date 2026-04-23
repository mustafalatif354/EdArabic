"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { getLessonWithLetters, Lesson } from "@/lib/lessonsData"
import { ProgressManager } from "@/lib/progress"
import { playArabicFile, preloadArabicVoices } from "@/lib/playArabic"

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const lessonId = parseInt(params.id as string)

  useEffect(() => { preloadArabicVoices() }, [])

  useEffect(() => {
    if (!user) return
    async function loadLesson() {
      const progress = await ProgressManager.getUserProgress()
      if (lessonId !== 1 && !ProgressManager.isLessonUnlocked(lessonId, progress)) {
        alert(t('Deze les is nog vergrendeld. Voltooi eerst de vereiste lessen.', 'This lesson is still locked. Complete the required lessons first.'))
        router.push("/home")
        return
      }
      const lessonData = await getLessonWithLetters(lessonId)
      if (!lessonData) { setDataLoading(false); return }
      setLesson(lessonData)
      setDataLoading(false)
    }
    loadLesson()
  }, [user, lessonId, router])

  const handlePlay = (soundFile: string | null, symbol: string) => {
    playArabicFile(soundFile, symbol)
  }

  const goBack = () => router.push("/alphabet")
  const goToTest = () => router.push(`/lessons/${lessonId}/test`)

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p>{t("Bezig met laden...", "Loading...")}</p>
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("Les niet gevonden", "Lesson not found")}</h1>
          <button onClick={goBack} className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition">
            {t("Terug naar Alfabet", "Back to Alphabet")}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-emerald-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button onClick={goBack} className="flex items-center text-emerald-600 hover:text-emerald-700 transition">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("Terug naar Alfabet", "Back to Alphabet")}
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {lang === "nl" ? lesson.title_nl : lesson.title_en}
              </h1>
            </div>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">{t("Instructies", "Instructions")}</h2>
          <p className="text-gray-600 mb-3">
            {t(
              "Klik op elke letter om de uitspraak te horen. Probeer elke letter meerdere keren uit te spreken.",
              "Click each letter to hear its pronunciation. Try to say each letter out loud multiple times."
            )}
          </p>
          <div className="flex items-center text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            {t(
              "Audio werkt via je browser — zorg dat je geluid aanstaat.",
              "Audio plays through your browser — make sure your sound is on."
            )}
          </div>
        </div>

        {/* Letters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(lesson.letters ?? []).map((letter) => (
            <div key={letter.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <button
                onClick={() => handlePlay(letter.sound_file, letter.symbol)}
                className="w-full text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl group"
              >
                <div className="text-8xl font-bold mb-4 text-gray-800 group-hover:text-emerald-600 transition-colors" style={{ fontFamily: 'serif', lineHeight: '1.4' }}>
                  {letter.symbol}
                </div>
              </button>

              <div className="text-center">
                <h3 className="text-xl font-bold mb-1">{letter.name}</h3>
                {letter.transliteration && (
                  <p className="text-emerald-600 text-sm font-mono mb-2">/{letter.transliteration}/</p>
                )}
                <p className="text-gray-600 text-sm mb-1">
                  {lang === "nl" ? letter.description_nl : letter.description_en}
                </p>

                <button
                  onClick={() => handlePlay(letter.sound_file, letter.symbol)}
                  className="w-full mt-4 bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  {t("Luister", "Listen")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Test section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">{t("Test Je Kennis", "Test Your Knowledge")}</h2>

          {lessonId === 2 ? (
            <>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">📚 {t("Comprehensieve Test", "Comprehensive Test")}</h3>
                <p className="text-blue-800 text-sm mb-2">
                  {t(
                    "Na het voltooien van deze les kun je de comprehensieve test maken die alle 28 letters test.",
                    "After completing this lesson you can take the comprehensive test covering all 28 letters."
                  )}
                </p>
                <p className="text-blue-800 text-sm">
                  {t("Je moet minimaal 80% scoren om door te gaan naar les 3.", "You need at least 80% to unlock lesson 3.")}
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                {t("Doe eerst de test over de letters van deze les (70% nodig).", "First complete the test for this lesson's letters (70% required).")}
              </p>
            </>
          ) : (
            <p className="text-gray-600 mb-6">
              {t("Nu ga je een korte test doen. Je moet 70% of hoger scoren.", "You'll now take a short test. You need 70% or higher to complete the lesson.")}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mb-6">
            {(lesson.letters ?? []).map((letter) => (
              <button
                key={letter.id}
                onClick={() => handlePlay(letter.sound_file, letter.symbol)}
                className="bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <span className="text-2xl" style={{ fontFamily: 'serif' }}>{letter.symbol}</span>
                <span className="text-sm">{letter.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={goToTest}
            className="w-full bg-emerald-500 text-white py-3 px-6 rounded-lg hover:bg-emerald-600 transition text-lg font-semibold"
          >
            {t("Start Test", "Start Test")}
          </button>
        </div>
      </div>
    </main>
  )
}
