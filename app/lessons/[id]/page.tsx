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
  const [playingId, setPlayingId] = useState<number | null>(null)

  const lessonId = parseInt(params.id as string)

  useEffect(() => { preloadArabicVoices() }, [])

  useEffect(() => {
    if (!user) return
    async function loadLesson() {
      const progress = await ProgressManager.getUserProgress()
      if (lessonId !== 1 && !ProgressManager.isLessonUnlocked(lessonId, progress)) {
        alert(t('Deze les is nog vergrendeld.', 'This lesson is still locked.'))
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

  const handlePlay = (id: number, soundFile: string | null, symbol: string) => {
    setPlayingId(id)
    playArabicFile(soundFile, symbol)
    setTimeout(() => setPlayingId(null), 1500)
  }

  const goBack = () => router.push("/alphabet")
  const goToTest = () => router.push(`/lessons/${lessonId}/test`)

  if (authLoading || dataLoading) return (
    <main className="luxe-bg flex items-center justify-center">
      <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  if (!lesson) return (
    <main className="luxe-bg flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-xl mb-4" style={{ color: '#d4af37' }}>{t("Les niet gevonden", "Lesson not found")}</p>
        <button onClick={goBack} className="btn-ghost px-6 py-2 rounded">{t("Terug", "Back")}</button>
      </div>
    </main>
  )

  return (
    <main className="luxe-bg">
      <div className="luxe-content max-w-5xl mx-auto px-6 lg:px-10 py-12">

        <button onClick={goBack} className="eyebrow mb-8" style={{ color: 'rgba(212,175,55,0.6)' }}>
          ← {t("Alfabet", "Alphabet")}
        </button>

        <div className="mb-12 reveal">
          <p className="eyebrow mb-3">{t("Les", "Lesson")} {lessonId}</p>
          <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            {lang === "nl" ? lesson.title_nl : lesson.title_en}
          </h1>
        </div>

        {/* Instructions */}
        <div className="glass-card rounded-lg p-8 mb-10 reveal" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <span style={{ color: '#d4af37', fontSize: '1.2rem' }}>♪</span>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl mb-2" style={{ color: '#f5ecd7' }}>
                {t("Instructies", "Instructions")}
              </h2>
              <p style={{ color: 'rgba(245,236,215,0.7)', fontFamily: 'Cormorant Garamond', fontSize: '1.1rem' }}>
                {t(
                  "Klik op elke letter om de uitspraak te horen. Zorg dat je geluid aanstaat.",
                  "Click each letter to hear its pronunciation. Make sure your sound is on."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Letters grid */}
        <div className="scene-3d grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {(lesson.letters ?? []).map((letter, i) => (
            <div key={letter.id}
              className="tilt-card glass-card rounded-lg p-8 reveal"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <button onClick={() => handlePlay(letter.id, letter.sound_file, letter.symbol)}
                className="w-full text-center focus:outline-none group">
                <div className="arabic-display mb-4 group-hover:scale-110 transition-transform duration-500"
                  style={{ fontSize: '6rem', textShadow: playingId === letter.id ? '0 0 50px rgba(212,175,55,0.8)' : '0 0 30px rgba(212,175,55,0.4)' }}>
                  {letter.symbol}
                </div>
              </button>

              <div className="ornament mb-4" style={{ maxWidth: 100, margin: '0 auto 1rem' }}>
                <span className="ornament-dot" />
              </div>

              <div className="text-center">
                <h3 className="font-display text-2xl mb-1" style={{ color: '#f5ecd7' }}>{letter.name}</h3>
                {letter.transliteration && (
                  <p className="font-mono text-xs mb-3" style={{ color: '#d4af37' }}>/{letter.transliteration}/</p>
                )}
                <p className="text-sm mb-5" style={{ color: 'rgba(245,236,215,0.6)', fontFamily: 'Cormorant Garamond' }}>
                  {lang === "nl" ? letter.description_nl : letter.description_en}
                </p>

                <button onClick={() => handlePlay(letter.id, letter.sound_file, letter.symbol)}
                  className="btn-ghost w-full py-2.5 rounded flex items-center justify-center gap-2 text-sm">
                  <span>♪</span>
                  <span>{t("Luister", "Listen")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Test section */}
        <div className="glass-card rounded-lg p-10 reveal" style={{ animationDelay: '0.3s' }}>
          <div className="mb-6">
            <p className="eyebrow mb-3">{t("Klaar om te testen?", "Ready to test?")}</p>
            <h2 className="font-display text-3xl mb-3" style={{ color: '#f5ecd7' }}>
              {t("Test Je Kennis", "Test Your Knowledge")}
            </h2>
            {lessonId === 2 ? (
              <>
                <p className="mb-2" style={{ color: 'rgba(245,236,215,0.7)', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem' }}>
                  {t(
                    "Na het voltooien van deze les kun je de Grote Test maken — alle 28 letters in één.",
                    "After completing this lesson you can take the Grand Test — all 28 letters at once."
                  )}
                </p>
                <p className="text-sm italic" style={{ color: 'rgba(245,236,215,0.5)' }}>
                  {t("Je moet minimaal 80% scoren om door te gaan.", "You need at least 80% to advance.")}
                </p>
              </>
            ) : (
              <p style={{ color: 'rgba(245,236,215,0.7)', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem' }}>
                {t(
                  "Een korte test — je moet 70% of hoger scoren om deze les te voltooien.",
                  "A short test — you need 70% or higher to complete this lesson."
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {(lesson.letters ?? []).map((letter) => (
              <button key={letter.id}
                onClick={() => handlePlay(letter.id, letter.sound_file, letter.symbol)}
                className="glass-card-sm px-4 py-2 rounded flex items-center gap-2 transition hover:scale-105">
                <span className="arabic-display text-2xl" style={{ lineHeight: 1 }}>{letter.symbol}</span>
                <span className="text-xs" style={{ color: 'rgba(245,236,215,0.7)' }}>{letter.name}</span>
              </button>
            ))}
          </div>

          <button onClick={goToTest} className="btn-gold w-full py-4 rounded tracking-wide text-lg">
            {t("Start Test", "Start Test")} →
          </button>
        </div>
      </div>
    </main>
  )
}
