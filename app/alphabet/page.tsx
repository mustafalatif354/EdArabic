"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { getAllLessons, Lesson } from "@/lib/lessonsData"
import { ProgressManager, ProgressData } from "@/lib/progress"

const BG_LETTERS = ['ا','ب','ت','ج','ح','س','ع','ك','ل','م','ن','ه']

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
      <main className="luxe-bg flex items-center justify-center">
        <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
      </main>
    )
  }

  const renderLessonCard = (lesson: Lesson, i: number) => {
    const progress = getLessonProgress(lesson.id)
    const unlocked = isLessonUnlocked(lesson.id)

    return (
      <div
        key={lesson.id}
        onClick={() => { if (unlocked) router.push(`/lessons/${lesson.id}`) }}
        className={`tilt-card glass-card rounded-lg p-8 reveal ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        style={{ animationDelay: `${i * 0.05}s`, opacity: unlocked ? 1 : 0.5 }}
      >
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-20 rounded-lg" style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="text-center">
              <div className="text-3xl mb-2" style={{ color: '#d4af37' }}>⟢</div>
              <div className="eyebrow" style={{ color: 'rgba(212,175,55,0.7)' }}>
                {lesson.id === 2 ? t("Voltooi les 1", "Complete lesson 1") : t("Vergrendeld", "Locked")}
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="mb-4">
            <span className="arabic-display" style={{ fontSize: '3.5rem' }}>
              {lesson.icon}
            </span>
          </div>
          <div className="ornament mb-4 mx-auto" style={{ maxWidth: 80 }}>
            <span className="ornament-dot" />
          </div>
          <h3 className="font-display text-xl mb-3" style={{ color: '#f5ecd7' }}>
            {lang === "nl" ? lesson.title_nl : lesson.title_en}
          </h3>
          {progress.completed ? (
            <span className="eyebrow" style={{ color: '#14a373' }}>✓ {t("Voltooid", "Completed")}</span>
          ) : (
            <span className="eyebrow" style={{ color: 'rgba(245,236,215,0.4)' }}>{t("Nog te doen", "Not started")}</span>
          )}
        </div>
      </div>
    )
  }

  const lesson2Completed = getLessonProgress(2).completed
  const comprehensiveCompleted = isComprehensiveTestCompleted()
  const canTakeTest = lesson2Completed && !comprehensiveCompleted

  return (
    <main className="luxe-bg">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        {BG_LETTERS.map((letter, i) => (
          <span key={i} className="floating-letter"
            style={{
              left: `${(i * 9) % 95}%`,
              top: `${(i * 14) % 90 + 5}%`,
              fontSize: `${3 + (i % 4)}rem`,
              animationDelay: `${i * 1.8}s`,
              animationDuration: `${22 + (i % 6)}s`,
            }}>{letter}</span>
        ))}
      </div>

      <div className="luxe-content max-w-6xl mx-auto px-6 lg:px-10 py-16">

        {/* Header */}
        <div className="mb-16 reveal">
          <p className="eyebrow mb-4">{t("Het fundament", "The foundation")}</p>
          <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            {t("Arabisch", "Arabic")}{' '}
            <span className="italic gold-shimmer">{t("alfabet", "alphabet")}</span>
          </h1>
          <p className="text-lg" style={{ color: 'rgba(245,236,215,0.6)', fontFamily: 'Cormorant Garamond' }}>
            {t("Achtentwintig letters — één reis", "Twenty-eight letters — one journey")}
          </p>
        </div>

        {/* Foundation lessons */}
        <div className="mb-20 reveal" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl" style={{ color: '#f5ecd7' }}>
              {t("Basis lessen", "Foundation lessons")}
            </h2>
            <div className="gold-divider flex-1 mx-6" />
            <span className="eyebrow">I & II</span>
          </div>

          <div className="scene-3d grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.slice(0, 2).map((l, i) => renderLessonCard(l, i))}

            {/* Comprehensive test card */}
            <div
              onClick={() => { if (canTakeTest || comprehensiveCompleted) router.push("/lessons/99/test") }}
              className={`tilt-card glass-card rounded-lg p-8 reveal ${canTakeTest || comprehensiveCompleted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              style={{ animationDelay: '0.1s', borderColor: 'rgba(20, 163, 115, 0.3)', opacity: lesson2Completed ? 1 : 0.5 }}
            >
              {!lesson2Completed && (
                <div className="absolute inset-0 flex items-center justify-center z-20 rounded-lg" style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(4px)' }}>
                  <div className="text-center">
                    <div className="text-3xl mb-2" style={{ color: '#d4af37' }}>⟢</div>
                    <div className="eyebrow" style={{ color: 'rgba(212,175,55,0.7)' }}>{t("Voltooi les 2", "Complete lesson 2")}</div>
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="mb-4">
                  <span className="arabic-display" style={{ fontSize: '3.5rem', color: '#14a373', textShadow: '0 0 30px rgba(20,163,115,0.4)' }}>✦</span>
                </div>
                <div className="ornament mb-4 mx-auto" style={{ maxWidth: 80 }}>
                  <span className="ornament-dot" style={{ background: '#14a373', boxShadow: '0 0 12px rgba(20,163,115,0.7)' }}/>
                </div>
                <h3 className="font-display text-xl mb-2" style={{ color: '#f5ecd7' }}>
                  {t("Grote Test", "Grand Test")}
                </h3>
                <p className="text-xs mb-3" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Alle 28 letters", "All 28 letters")}</p>
                {comprehensiveCompleted ? (
                  <span className="eyebrow" style={{ color: '#14a373' }}>✓ {t("Voltooid", "Completed")}</span>
                ) : canTakeTest ? (
                  <span className="eyebrow" style={{ color: '#d4af37' }}>{t("Min. 80%", "Min. 80%")}</span>
                ) : (
                  <span className="eyebrow" style={{ color: 'rgba(245,236,215,0.4)' }}>{t("Vergrendeld", "Locked")}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced lessons */}
        <div className="mb-20 reveal" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl" style={{ color: '#f5ecd7' }}>
              {t("Gevorderde lessen", "Advanced lessons")}
            </h2>
            <div className="gold-divider flex-1 mx-6" />
            <span className="eyebrow">III+</span>
          </div>

          <div className="scene-3d grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.slice(2).map((l, i) => renderLessonCard(l, i + 3))}
          </div>
        </div>

        {/* Practice CTA */}
        <div className="glass-card rounded-lg p-10 reveal flex flex-col sm:flex-row items-center justify-between gap-6" style={{ animationDelay: '0.3s' }}>
          <div>
            <p className="eyebrow mb-2">{t("Vrije oefening", "Free practice")}</p>
            <h3 className="font-display text-2xl mb-2" style={{ color: '#f5ecd7' }}>
              {t("Oefen naar eigen tempo", "Practice at your own pace")}
            </h3>
            <p className="text-sm" style={{ color: 'rgba(245,236,215,0.6)' }}>
              {t("Oefen individuele letters los van de lessen", "Practise individual letters outside of the lessons")}
            </p>
          </div>
          <button onClick={() => router.push("/exercises/letters")}
            className="btn-gold shrink-0 px-8 py-3 rounded font-medium tracking-wide">
            {t("Ga naar oefeningen", "Go to exercises")} →
          </button>
        </div>
      </div>
    </main>
  )
}
