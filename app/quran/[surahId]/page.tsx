"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { LevelingSystem } from "@/lib/leveling"

interface Ayah {
  number: number
  numberInSurah: number
  text: string
  translation?: string
  audio?: string
}

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  ayahs: Ayah[]
}

interface ComprehensionQuestion {
  question: string
  options: string[]
  correct: number
}

type Phase = "read" | "listen" | "quiz" | "results"
type Language = "en" | "nl"

// Reciters available on Al Quran Cloud
const RECITERS = [
  { id: "ar.alafasy",        name: "Mishary Alafasy" },
  { id: "ar.abdurrahmaanas", name: "Abdur-Rahman as-Sudais" },
  { id: "ar.minshawi",       name: "Mohamed Siddiq al-Minshawi" },
]

// Generate simple comprehension questions from surah data
function generateQuestions(surah: Surah, translations: Ayah[]): ComprehensionQuestion[] {
  const questions: ComprehensionQuestion[] = []

  // Q1: Number of ayahs
  questions.push({
    question: `How many ayahs does Surah ${surah.englishName} have?`,
    options: [
      surah.numberOfAyahs.toString(),
      (surah.numberOfAyahs + 3).toString(),
      (surah.numberOfAyahs - 2).toString(),
      (surah.numberOfAyahs + 7).toString(),
    ].sort(() => Math.random() - 0.5),
    correct: 0, // we'll fix index below
  })
  // Fix correct index after shuffle
  const q1 = questions[0]
  q1.correct = q1.options.indexOf(surah.numberOfAyahs.toString())

  // Q2: First word of first ayah translation (if available)
  if (translations.length > 0 && translations[0].translation) {
    const firstWords = translations[0].translation.split(" ").slice(0, 3).join(" ")
    questions.push({
      question: `The first ayah of Surah ${surah.englishName} begins with...`,
      options: [
        firstWords,
        "In the name of God",
        "Praise be to Allah",
        "Say: He is Allah",
      ].sort(() => Math.random() - 0.5),
      correct: 0,
    })
    const q2 = questions[1]
    q2.correct = q2.options.indexOf(firstWords)
  }

  // Q3: Surah name meaning
  questions.push({
    question: `What is the meaning of "${surah.englishName}"?`,
    options: [
      surah.englishNameTranslation,
      "The Merciful",
      "The Opening",
      "The People",
    ].filter((v, i, a) => a.indexOf(v) === i) // dedupe
     .sort(() => Math.random() - 0.5),
    correct: 0,
  })
  const q3 = questions[questions.length - 1]
  q3.correct = q3.options.indexOf(surah.englishNameTranslation)

  return questions.slice(0, 5)
}

export default function QuranSurahPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const surahId = parseInt(params.surahId as string)

  const [surah, setSurah] = useState<Surah | null>(null)
  const [translations, setTranslations] = useState<Ayah[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>("read")
  const [language, setLanguage] = useState<Language>("en")
  const [showTranslation, setShowTranslation] = useState(true)
  const [reciter, setReciter] = useState(RECITERS[0].id)
  const [currentAyah, setCurrentAyah] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [readAyahs, setReadAyahs] = useState<Set<number>>(new Set())

  // Quiz state
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [quizResults, setQuizResults] = useState<boolean[]>([])
  const [xpEarned, setXpEarned] = useState(0)

  useEffect(() => {
    if (!user) return

    async function loadSurah() {
      try {
        // Fetch Arabic text
        const arabicRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}`)
        if (!arabicRes.ok) throw new Error("Failed to fetch surah")
        const arabicJson = await arabicRes.json()
        setSurah(arabicJson.data)

        // Fetch English translation
        const transRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.sahih`)
        if (transRes.ok) {
          const transJson = await transRes.json()
          setTranslations(transJson.data.ayahs)
        }
      } catch (err) {
        setError("Kon soera niet laden. / Could not load surah.")
      } finally {
        setDataLoading(false)
      }
    }

    loadSurah()
  }, [user, surahId])

  // Build questions once surah is loaded
  useEffect(() => {
    if (surah && translations.length > 0) {
      setQuestions(generateQuestions(surah, translations))
    }
  }, [surah, translations])

  const playAyah = async (ayahIndex: number) => {
    if (!surah) return
    const ayahNumber = surah.ayahs[ayahIndex].number
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciter}/${ayahNumber}.mp3`

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = audioUrl
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
      setCurrentAyah(ayahIndex)
      setReadAyahs(prev => new Set([...prev, ayahIndex]))

      audioRef.current.onended = () => {
        setIsPlaying(false)
        // Auto advance in listen mode
        if (phase === "listen" && ayahIndex + 1 < surah.ayahs.length) {
          setTimeout(() => playAyah(ayahIndex + 1), 800)
        }
      }
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleQuizAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(optionIndex)
    const correct = optionIndex === questions[currentQ].correct
    const newResults = [...quizResults, correct]

    setTimeout(() => {
      if (currentQ + 1 < questions.length) {
        setCurrentQ(currentQ + 1)
        setSelectedAnswer(null)
        setQuizResults(newResults)
      } else {
        // Quiz complete — save progress
        const score = Math.round((newResults.filter(Boolean).length / questions.length) * 100)
        const xp = LevelingSystem.calculateXPForScore(score)
        setXpEarned(xp)
        setQuizResults(newResults)
        saveProgress(score, xp)
        setPhase("results")
      }
    }, 1000)
  }

  const saveProgress = async (score: number, xp: number) => {
    if (!user) return
    await supabase.from("quran_progress").upsert({
      user_id: user.id,
      surah_id: surahId,
      completed: true,
      score,
      xp_earned: xp,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,surah_id" })
  }

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p className="text-gray-600">Bezig met laden... / Loading...</p>
      </main>
    )
  }

  if (error || !surah) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Soera niet gevonden"}</p>
          <button onClick={() => router.push("/quran")} className="bg-emerald-500 text-white px-4 py-2 rounded-lg">
            Terug / Back
          </button>
        </div>
      </main>
    )
  }

  // ── RESULTS PHASE ─────────────────────────────────────────
  if (phase === "results") {
    const score = Math.round((quizResults.filter(Boolean).length / questions.length) * 100)
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center mb-6">
            <div className="text-6xl mb-4">{score >= 80 ? "🏆" : score >= 60 ? "👍" : "💪"}</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Surah {surah.englishName}</h1>
            <p className="text-gray-400 mb-4">Comprehension Results</p>
            <div className="text-7xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent my-4">
              {score}%
            </div>
            <p className="text-gray-500 mb-2">{quizResults.filter(Boolean).length} / {questions.length} correct</p>
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold text-sm mb-6">
              +{xpEarned} XP verdiend / earned
            </div>

            {/* Per question breakdown */}
            <div className="text-left space-y-3 mt-4">
              {questions.map((q, i) => (
                <div key={i} className={`p-4 rounded-xl border ${quizResults[i] ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex gap-3 items-start">
                    <span className={`text-lg ${quizResults[i] ? "text-emerald-500" : "text-red-500"}`}>{quizResults[i] ? "✓" : "✗"}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{q.question}</p>
                      <p className="text-sm text-emerald-700 mt-1">Correct: {q.options[q.correct]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => { setPhase("read"); setCurrentQ(0); setQuizResults([]); setSelectedAnswer(null) }}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-4 rounded-xl font-semibold">
              🔁 Opnieuw / Again
            </button>
            <button onClick={() => router.push("/quran")}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:border-emerald-400 transition">
              Alle soera's / All surahs
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── QUIZ PHASE ────────────────────────────────────────────
  if (phase === "quiz") {
    const q = questions[currentQ]
    if (!q) return null
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setPhase("read")} className="text-gray-500 hover:text-gray-700 text-sm">← Terug / Back</button>
            <div className="flex items-center gap-3 flex-1 mx-6">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all"
                  style={{ width: `${((currentQ) / questions.length) * 100}%` }} />
              </div>
              <span className="text-sm text-gray-500">{currentQ + 1}/{questions.length}</span>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <p className="text-gray-500 text-sm mb-3 text-center">Surah {surah.englishName} — Question {currentQ + 1}</p>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-8">{q.question}</h2>
            <div className="grid grid-cols-1 gap-4">
              {q.options.map((option, i) => {
                let style = "border-gray-200 bg-white text-gray-800 hover:border-emerald-400"
                if (selectedAnswer !== null) {
                  if (i === q.correct) style = "border-emerald-500 bg-emerald-50 text-emerald-700"
                  else if (i === selectedAnswer && selectedAnswer !== q.correct) style = "border-red-400 bg-red-50 text-red-700"
                  else style = "border-gray-200 bg-white text-gray-400 opacity-50"
                }
                return (
                  <button key={i} onClick={() => handleQuizAnswer(i)} disabled={selectedAnswer !== null}
                    className={`border-2 rounded-xl p-4 text-left transition-all font-medium ${style}`}>
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

  // ── READ / LISTEN PHASE ───────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <audio ref={audioRef} />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { stopAudio(); router.push("/quran") }}
              className="flex items-center text-emerald-600 hover:text-emerald-700">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quran
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">{surah.englishName}</h1>
              <p className="text-sm text-gray-400">{surah.name} · {surah.numberOfAyahs} ayahs</p>
            </div>
            <button onClick={() => { stopAudio(); setPhase("quiz") }}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
              🧠 Quiz
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            {/* Mode toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button onClick={() => { stopAudio(); setPhase("read") }}
                className={`px-4 py-2 text-sm font-medium transition ${phase === "read" ? "bg-emerald-500 text-white" : "bg-white text-gray-600"}`}>
                📖 Lezen / Read
              </button>
              <button onClick={() => { setPhase("listen") }}
                className={`px-4 py-2 text-sm font-medium transition ${phase === "listen" ? "bg-emerald-500 text-white" : "bg-white text-gray-600"}`}>
                🎧 Luisteren / Listen
              </button>
            </div>

            {/* Translation toggle */}
            <button onClick={() => setShowTranslation(!showTranslation)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${showTranslation ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200"}`}>
              🌐 Vertaling / Translation
            </button>

            {/* Reciter selector (listen mode) */}
            {phase === "listen" && (
              <select value={reciter} onChange={e => setReciter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white">
                {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* Listen mode controls */}
      {phase === "listen" && (
        <div className="bg-emerald-600 text-white py-3">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <span className="text-sm">Ayah {currentAyah + 1} / {surah.ayahs.length}</span>
            <div className="flex gap-3">
              <button onClick={() => { if (currentAyah > 0) playAyah(currentAyah - 1) }}
                disabled={currentAyah === 0}
                className="bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-lg text-sm disabled:opacity-40">
                ← Vorige / Prev
              </button>
              {isPlaying ? (
                <button onClick={stopAudio} className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium">
                  ⏸ Pauzeer / Pause
                </button>
              ) : (
                <button onClick={() => playAyah(currentAyah)} className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium">
                  ▶ Speel / Play
                </button>
              )}
              <button onClick={() => { if (currentAyah + 1 < surah.ayahs.length) playAyah(currentAyah + 1) }}
                disabled={currentAyah + 1 >= surah.ayahs.length}
                className="bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-lg text-sm disabled:opacity-40">
                Volgende / Next →
              </button>
            </div>
            <span className="text-sm">{readAyahs.size} gelezen / listened</span>
          </div>
        </div>
      )}

      {/* Ayah list */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {surah.ayahs.map((ayah, index) => {
          const translation = translations[index]
          const isCurrentListen = phase === "listen" && index === currentAyah
          return (
            <div
              key={ayah.numberInSurah}
              className={`bg-white rounded-2xl shadow p-6 transition-all ${
                isCurrentListen ? "ring-2 ring-emerald-400 shadow-lg" : ""
              }`}
            >
              {/* Ayah number badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {ayah.numberInSurah}
                </div>
                {phase === "listen" && (
                  <button
                    onClick={() => playAyah(index)}
                    className={`text-sm px-3 py-1 rounded-full transition ${
                      isCurrentListen && isPlaying
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {isCurrentListen && isPlaying ? "⏸" : "▶"}
                  </button>
                )}
              </div>

              {/* Arabic text */}
              <p className="text-3xl font-bold text-gray-800 text-right leading-loose mb-4" dir="rtl">
                {ayah.text}
              </p>

              {/* Translation */}
              {showTranslation && translation?.translation && (
                <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                  {translation.translation}
                </p>
              )}
            </div>
          )
        })}

        {/* Start quiz CTA at bottom */}
        <div
          onClick={() => { stopAudio(); setPhase("quiz") }}
          className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-8 text-center text-white cursor-pointer hover:from-emerald-600 hover:to-blue-600 transition shadow-xl"
        >
          <div className="text-4xl mb-3">🧠</div>
          <h3 className="text-xl font-bold mb-2">Begripstest / Comprehension Quiz</h3>
          <p className="text-emerald-100 text-sm">Test je kennis over deze soera / Test your knowledge of this surah</p>
        </div>
      </div>
    </main>
  )
}
