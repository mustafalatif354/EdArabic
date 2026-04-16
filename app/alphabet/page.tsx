"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { getAllLessons, Lesson } from "@/lib/lessonsData"
import { ProgressManager, ProgressData } from "@/lib/progress"

export default function AlphabetPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [userProgress, setUserProgress] = useState<ProgressData[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function loadData() {
      const [allLessons, progress] = await Promise.all([
        getAllLessons(),
        ProgressManager.getUserProgress(),
      ])
      setLessons(allLessons.filter(l => l.category === "alphabet"))
      setUserProgress(progress)
      setDataLoading(false)
    }
    loadData()
  }, [user])

  const getLessonProgress = (lessonId: number) => {
    const p = userProgress.find(p => p.lesson_id === lessonId)
    return p ? { completed: p.completed, progress: p.completed ? 100 : 0 } : { completed: false, progress: 0 }
  }

  const isLessonUnlocked = (lessonId: number) => ProgressManager.isLessonUnlocked(lessonId, userProgress)
  const isComprehensiveTestCompleted = () => ProgressManager.isComprehensiveTestCompleted(userProgress)

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p className="text-gray-600">{t("Bezig met laden...", "Loading...")}</p>
      </main>
    )
  }

  const renderLessonCard = (lesson: Lesson) => {
    const progress = getLessonProgress(lesson.id)
    const unlocked = isLessonUnlocked(lesson.id)

    return (
      <div key={lesson.id} onClick={() => { if (unlocked) router.push(`/lessons/${lesson.id}`) }}
        className={`group relative bg-white rounded-3xl p-6 shadow-lg transition-all duration-300 overflow-hidden ${
          unlocked ? "hover:shadow-2xl hover:-translate-y-2 cursor-pointer" : "opacity-50 cursor-not-allowed"
        }`}>
        {!unlocked && (
          <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
            <div className="text-center">
              <div className="text-3xl mb-1">🔒</div>
              <div className="text-xs font-bold text-gray-700">
                {lesson.id === 2
                  ? t("Voltooi les 1 eerst", "Complete lesson 1 first")
                  : t("Voltooi de vorige les", "Complete the previous lesson")}
              </div>
            </div>
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-br ${lesson.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`} />
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{lesson.icon}</div>
          <div className={`w-12 h-1 bg-gradient-to-r ${lesson.color} mx-auto rounded-full mb-4`} />
          <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
            {lang === "nl" ? lesson.title_nl : lesson.title_en}
          </h3>
          {progress.completed
            ? <span className="text-emerald-600 text-sm font-medium">✓ {t("Voltooid", "Completed")}</span>
            : <span className="text-gray-400 text-xs">{t("Nog niet gestart", "Not started")}</span>
          }
        </div>
      </div>
    )
  }

  const lesson2Completed = getLessonProgress(2).completed
  const comprehensiveCompleted = isComprehensiveTestCompleted()
  const canTakeTest = lesson2Completed && !comprehensiveCompleted

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔤 {t("Arabisch Alfabet", "Arabic Alphabet")}</h1>
          <p className="text-gray-500">{t("Leer alle 28 letters", "Learn all 28 letters")}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4">{t("Basis lessen", "Foundation lessons")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.slice(0, 2).map(renderLessonCard)}

            {/* Comprehensive test card */}
            <div onClick={() => { if (canTakeTest || comprehensiveCompleted) router.push("/lessons/99/test") }}
              className={`group relative bg-white rounded-3xl p-6 shadow-lg transition-all duration-300 overflow-hidden border-2 border-blue-100 ${
                canTakeTest || comprehensiveCompleted ? "hover:shadow-2xl hover:-translate-y-2 cursor-pointer" : "opacity-50 cursor-not-allowed"
              }`}>
              {!lesson2Completed && (
                <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🔒</div>
                    <div className="text-xs font-bold text-gray-700">{t("Voltooi les 2 eerst", "Complete lesson 2 first")}</div>
                  </div>
                </div>
              )}
              <div className="relative z-10 text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🎯</div>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full mb-4" />
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {t("Comprehensieve Test", "Comprehensive Test")}
                </h3>
                <p className="text-xs text-gray-400 mb-3">{t("Alle 28 letters", "All 28 letters")}</p>
                {comprehensiveCompleted
                  ? <span className="text-emerald-600 text-sm font-medium">✓ {t("Voltooid", "Completed")}</span>
                  : canTakeTest
                    ? <span className="text-blue-600 text-xs font-medium">{t("Min. 80% nodig", "Min. 80% required")}</span>
                    : <span className="text-gray-400 text-xs">{t("Voltooi les 2 eerst", "Complete lesson 2 first")}</span>
                }
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-700 mb-4">{t("Gevorderde lessen", "Advanced lessons")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.slice(2).map(renderLessonCard)}
          </div>
        </div>

        <div className="mt-10 bg-white rounded-3xl shadow-lg p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{t("Letter oefeningen", "Letter exercises")}</h3>
            <p className="text-gray-500 text-sm">{t("Oefen individuele letters los van de lessen", "Practise individual letters outside of lessons")}</p>
          </div>
          <button onClick={() => router.push("/exercises/letters")}
            className="shrink-0 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-blue-600 transition">
            {t("Ga naar oefeningen", "Go to exercises")} →
          </button>
        </div>
      </div>
    </main>
  )
}
