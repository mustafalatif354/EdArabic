"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { supabase } from "@/lib/supabaseClient"
import { LevelingSystem } from "@/lib/leveling"

interface Ayah { number: number; numberInSurah: number; text: string; translation?: string }
interface Surah { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; ayahs: Ayah[] }
interface CQuestion { question: string; options: string[]; correct: number }

type Phase = "read" | "listen" | "quiz" | "results"

const RECITERS = [
  { id: "ar.alafasy",        name: "Mishary Alafasy" },
  { id: "ar.abdurrahmaanas", name: "Abdur-Rahman as-Sudais" },
  { id: "ar.minshawi",       name: "Mohamed Siddiq al-Minshawi" },
]

function generateQuestions(surah: Surah, translations: Ayah[]): CQuestion[] {
  const questions: CQuestion[] = []
  const q1opts = [surah.numberOfAyahs.toString(), (surah.numberOfAyahs + 3).toString(), (surah.numberOfAyahs - 2).toString(), (surah.numberOfAyahs + 7).toString()].sort(() => Math.random() - 0.5)
  questions.push({ question: `How many ayahs does Surah ${surah.englishName} have?`, options: q1opts, correct: q1opts.indexOf(surah.numberOfAyahs.toString()) })

  if (translations.length > 0 && translations[0].translation) {
    const firstWords = translations[0].translation.split(" ").slice(0, 3).join(" ")
    const q2opts = [firstWords, "In the name of God", "Praise be to Allah", "Say: He is Allah"].filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5)
    questions.push({ question: `The first ayah of Surah ${surah.englishName} begins with...`, options: q2opts, correct: q2opts.indexOf(firstWords) })
  }

  const q3opts = [surah.englishNameTranslation, "The Merciful", "The Opening", "The People"].filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5)
  questions.push({ question: `What is the meaning of "${surah.englishName}"?`, options: q3opts, correct: q3opts.indexOf(surah.englishNameTranslation) })

  return questions.slice(0, 5)
}

export default function QuranSurahPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const surahId = parseInt(params.surahId as string)

  const [surah, setSurah] = useState<Surah | null>(null)
  const [translations, setTranslations] = useState<Ayah[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>("read")
  const [showTranslation, setShowTranslation] = useState(true)
  const [reciter, setReciter] = useState(RECITERS[0].id)
  const [currentAyah, setCurrentAyah] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [questions, setQuestions] = useState<CQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [quizResults, setQuizResults] = useState<boolean[]>([])
  const [xpEarned, setXpEarned] = useState(0)

  useEffect(() => {
    if (!user) return
    async function loadSurah() {
      try {
        const arabicRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}`)
        if (!arabicRes.ok) throw new Error("Failed")
        const arabicJson = await arabicRes.json()
        setSurah(arabicJson.data)
        const transRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.sahih`)
        if (transRes.ok) { const tj = await transRes.json(); setTranslations(tj.data.ayahs) }
      } catch {
        setError(t("Kon soera niet laden.", "Could not load surah."))
      } finally { setDataLoading(false) }
    }
    loadSurah()
  }, [user, surahId])

  useEffect(() => {
    if (surah && translations.length > 0) setQuestions(generateQuestions(surah, translations))
  }, [surah, translations])

  const playAyah = (ayahIndex: number) => {
    if (!surah) return
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciter}/${surah.ayahs[ayahIndex].number}.mp3`
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = audioUrl
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
      setCurrentAyah(ayahIndex)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        if (phase === "listen" && ayahIndex + 1 < surah.ayahs.length) setTimeout(() => playAyah(ayahIndex + 1), 800)
      }
    }
  }

  const stopAudio = () => { audioRef.current?.pause(); setIsPlaying(false) }

  const handleQuizAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(optionIndex)
    const correct = optionIndex === questions[currentQ].correct
    const newResults = [...quizResults, correct]
    setTimeout(() => {
      if (currentQ + 1 < questions.length) {
        setCurrentQ(currentQ + 1); setSelectedAnswer(null); setQuizResults(newResults)
      } else {
        const score = Math.round((newResults.filter(Boolean).length / questions.length) * 100)
        const xp = LevelingSystem.calculateXPForScore(score)
        setXpEarned(xp); setQuizResults(newResults)
        supabase.from("quran_progress").upsert({
          user_id: user!.id, surah_id: surahId, completed: true, score, xp_earned: xp, completed_at: new Date().toISOString()
        }, { onConflict: "user_id,surah_id" })
        setPhase("results")
      }
    }, 1000)
  }

  if (authLoading || dataLoading) return (
    <main className="luxe-bg flex items-center justify-center">
      <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  if (error || !surah) return (
    <main className="luxe-bg flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg mb-4" style={{ color: '#e74c3c' }}>{error || t("Soera niet gevonden", "Surah not found")}</p>
        <button onClick={() => router.push("/quran")} className="btn-ghost px-6 py-2 rounded">{t("Terug", "Back")}</button>
      </div>
    </main>
  )

  // RESULTS
  if (phase === "results") {
    const score = Math.round((quizResults.filter(Boolean).length / questions.length) * 100)
    return (
      <main className="luxe-bg">
        <div className="luxe-content max-w-3xl mx-auto px-6 lg:px-10 py-16">
          <div className="glass-card rounded-lg p-12 text-center mb-8 reveal">
            <div className="mb-6">
              <span className="arabic-display" style={{ fontSize: '5rem' }}>
                {score >= 80 ? "✦" : score >= 60 ? "❋" : "⟢"}
              </span>
            </div>
            <p className="eyebrow mb-2">Surah {surah.englishName}</p>
            <p className="font-display text-lg italic mb-4" style={{ color: 'rgba(245,236,215,0.5)' }}>
              {t("Begripsresultaten", "Comprehension Results")}
            </p>
            <div className="font-display gold-shimmer mb-4" style={{ fontSize: '6rem', lineHeight: 1 }}>{score}%</div>
            <p className="text-lg mb-8" style={{ color: 'rgba(245,236,215,0.7)' }}>
              {quizResults.filter(Boolean).length} / {questions.length} {t("correct", "correct")}
            </p>
            <div className="inline-block glass-card-sm rounded-full px-6 py-2 mb-8">
              <span className="eyebrow" style={{ color: '#d4af37' }}>+{xpEarned} XP {t("verdiend", "earned")}</span>
            </div>

            <div className="text-left space-y-3 mt-6">
              {questions.map((q, i) => (
                <div key={i} className="glass-card-sm rounded-lg p-4" style={{
                  borderColor: quizResults[i] ? 'rgba(20,163,115,0.3)' : 'rgba(231,76,60,0.3)',
                  background: quizResults[i] ? 'rgba(20,163,115,0.05)' : 'rgba(231,76,60,0.05)',
                }}>
                  <div className="flex gap-3">
                    <span className="text-lg" style={{ color: quizResults[i] ? '#14a373' : '#e74c3c' }}>
                      {quizResults[i] ? "✓" : "✗"}
                    </span>
                    <div>
                      <p className="text-sm mb-1" style={{ color: '#f5ecd7' }}>{q.question}</p>
                      <p className="text-xs eyebrow" style={{ color: '#14a373' }}>{q.options[q.correct]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => { setPhase("read"); setCurrentQ(0); setQuizResults([]); setSelectedAnswer(null) }}
              className="btn-gold flex-1 px-6 py-4 rounded tracking-wide">
              ↻ {t("Opnieuw", "Try again")}
            </button>
            <button onClick={() => router.push("/quran")} className="btn-ghost flex-1 px-6 py-4 rounded tracking-wide">
              {t("Alle soera's", "All surahs")}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // QUIZ
  if (phase === "quiz") {
    const q = questions[currentQ]
    if (!q) return null
    return (
      <main className="luxe-bg">
        <div className="luxe-content max-w-3xl mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => setPhase("read")} className="eyebrow" style={{ color: 'rgba(212,175,55,0.6)' }}>
              ← {t("Terug", "Back")}
            </button>
            <div className="luxe-bar flex-1">
              <div className="luxe-bar-fill" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
            </div>
            <span className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>{currentQ + 1}/{questions.length}</span>
          </div>

          <div className="glass-card rounded-lg p-10">
            <p className="eyebrow text-center mb-4" style={{ color: 'rgba(245,236,215,0.5)' }}>
              Surah {surah.englishName} · {t("Vraag", "Question")} {currentQ + 1}
            </p>
            <h2 className="font-display text-2xl text-center mb-10" style={{ color: '#f5ecd7' }}>{q.question}</h2>
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((option, i) => {
                let style: React.CSSProperties = { padding: '1rem 1.25rem', borderRadius: 8, color: '#f5ecd7', textAlign: 'left' as const }
                if (selectedAnswer !== null) {
                  if (i === q.correct) style = { ...style, borderColor: '#14a373', background: 'rgba(20,163,115,0.15)', color: '#14a373' }
                  else if (i === selectedAnswer && selectedAnswer !== q.correct) style = { ...style, borderColor: '#e74c3c', background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }
                  else style = { ...style, opacity: 0.3 }
                }
                return (
                  <button key={i} onClick={() => handleQuizAnswer(i)} disabled={selectedAnswer !== null}
                    className="glass-card-sm transition" style={style}>
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // READ / LISTEN
  return (
    <main className="luxe-bg">
      <audio ref={audioRef} />

      <div className="luxe-content max-w-4xl mx-auto px-6 lg:px-10 py-10">
        <button onClick={() => { stopAudio(); router.push("/quran") }} className="eyebrow mb-6" style={{ color: 'rgba(212,175,55,0.6)' }}>
          ← Quran
        </button>

        <div className="mb-10 reveal">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <p className="eyebrow mb-2">Surah</p>
              <h1 className="font-display font-light mb-2" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#f5ecd7' }}>
                {surah.englishName}
              </h1>
              <p className="text-sm" style={{ color: 'rgba(245,236,215,0.5)' }}>
                {surah.numberOfAyahs} {t("ayahs", "ayahs")}
              </p>
            </div>
            <div className="arabic-display text-right" dir="rtl" style={{ fontSize: '3.5rem' }}>
              {surah.name}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => { stopAudio(); setPhase("read") }}
              className={phase === "read" ? "btn-gold px-5 py-2 rounded text-sm" : "btn-ghost px-5 py-2 rounded text-sm"}>
              📖 {t("Lezen", "Read")}
            </button>
            <button onClick={() => setPhase("listen")}
              className={phase === "listen" ? "btn-gold px-5 py-2 rounded text-sm" : "btn-ghost px-5 py-2 rounded text-sm"}>
              🎧 {t("Luisteren", "Listen")}
            </button>
            <button onClick={() => setShowTranslation(!showTranslation)}
              className={showTranslation ? "btn-emerald px-5 py-2 rounded text-sm" : "btn-ghost px-5 py-2 rounded text-sm"}>
              ✦ {t("Vertaling", "Translation")}
            </button>
            <button onClick={() => { stopAudio(); setPhase("quiz") }} className="btn-gold px-5 py-2 rounded text-sm ml-auto">
              🧠 Quiz
            </button>
          </div>

          {phase === "listen" && (
            <div className="mt-4">
              <select value={reciter} onChange={e => setReciter(e.target.value)}
                className="luxe-input px-4 py-2 rounded text-sm">
                {RECITERS.map(r => <option key={r.id} value={r.id} style={{ background: '#14141c' }}>{r.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {phase === "listen" && (
          <div className="glass-card rounded-lg p-4 mb-6 flex items-center justify-between sticky top-20 z-30" style={{ background: 'rgba(13,107,71,0.15)', borderColor: 'rgba(20,163,115,0.4)' }}>
            <span className="eyebrow" style={{ color: '#14a373' }}>
              {t("Ayah", "Ayah")} {currentAyah + 1} / {surah.ayahs.length}
            </span>
            <div className="flex gap-2">
              <button onClick={() => { if (currentAyah > 0) playAyah(currentAyah - 1) }} disabled={currentAyah === 0}
                className="btn-ghost px-4 py-2 rounded text-sm disabled:opacity-30">← {t("Vorige", "Prev")}</button>
              {isPlaying
                ? <button onClick={stopAudio} className="btn-gold px-4 py-2 rounded text-sm">⏸ {t("Pauzeer", "Pause")}</button>
                : <button onClick={() => playAyah(currentAyah)} className="btn-gold px-4 py-2 rounded text-sm">▶ {t("Speel", "Play")}</button>
              }
              <button onClick={() => { if (currentAyah + 1 < surah.ayahs.length) playAyah(currentAyah + 1) }} disabled={currentAyah + 1 >= surah.ayahs.length}
                className="btn-ghost px-4 py-2 rounded text-sm disabled:opacity-30">{t("Volgende", "Next")} →</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {surah.ayahs.map((ayah, index) => {
            const translation = translations[index]
            const isCurrentListen = phase === "listen" && index === currentAyah
            return (
              <div key={ayah.numberInSurah}
                className="glass-card rounded-lg p-6 transition-all"
                style={isCurrentListen ? { borderColor: '#14a373', boxShadow: '0 0 40px rgba(20,163,115,0.25)' } : {}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-display text-sm" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
                    {ayah.numberInSurah}
                  </div>
                  {phase === "listen" && (
                    <button onClick={() => playAyah(index)}
                      className="btn-ghost text-xs px-3 py-1 rounded-full"
                      style={isCurrentListen && isPlaying ? { background: '#d4af37', color: '#0a0a0f' } : {}}>
                      {isCurrentListen && isPlaying ? "⏸" : "▶"}
                    </button>
                  )}
                </div>
                <p className="arabic-display text-right leading-loose mb-4" dir="rtl" style={{ fontSize: '2.5rem' }}>
                  {ayah.text}
                </p>
                {showTranslation && translation?.translation && (
                  <p className="text-sm leading-relaxed pt-4" style={{ color: 'rgba(245,236,215,0.7)', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem', borderTop: '1px solid rgba(212,175,55,0.15)' }}>
                    {translation.translation}
                  </p>
                )}
              </div>
            )
          })}

          <div onClick={() => { stopAudio(); setPhase("quiz") }}
            className="glass-card tilt-card rounded-lg p-10 text-center cursor-pointer">
            <div className="mb-4"><span className="arabic-display" style={{ fontSize: '3rem' }}>✦</span></div>
            <h3 className="font-display text-2xl mb-2" style={{ color: '#f5ecd7' }}>
              {t("Begripstest", "Comprehension Quiz")}
            </h3>
            <p className="text-sm" style={{ color: 'rgba(245,236,215,0.6)' }}>
              {t("Test je kennis over deze soera", "Test your knowledge of this surah")}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
