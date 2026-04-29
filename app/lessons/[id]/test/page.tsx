"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { getLessonWithLetters, getAllLessons, Lesson, Letter } from "@/lib/lessonsData"
import { ProgressManager } from "@/lib/progress"
import { LevelingSystem } from "@/lib/leveling"
import { playArabicFile, preloadArabicVoices } from "@/lib/playArabic"

type QuestionType = "mc-symbol-to-name" | "mc-name-to-symbol" | "mc-listen"

interface Question {
  type: QuestionType
  letter: Letter
  options: string[]
  correct: string
}

interface Result { question: Question; userAnswer: string; correct: boolean }
type Phase = "ready" | "exercise" | "results"

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function buildQuestions(letters: Letter[]): Question[] {
  const questions: Question[] = []

  letters.forEach((letter, i) => {
    const typeRoll = i % 3
    const distractors = shuffle(letters.filter(l => l.id !== letter.id))

    if (typeRoll === 0) {
      // Show Arabic symbol, pick the name
      const correct = letter.name
      const options = shuffle([correct, ...distractors.slice(0, 3).map(l => l.name)])
      questions.push({ type: "mc-symbol-to-name", letter, options, correct })
    } else if (typeRoll === 1) {
      // Show name, pick the Arabic symbol
      const correct = letter.symbol
      const options = shuffle([correct, ...distractors.slice(0, 3).map(l => l.symbol)])
      questions.push({ type: "mc-name-to-symbol", letter, options, correct })
    } else {
      // Listen, pick the symbol
      const correct = letter.symbol
      const options = shuffle([correct, ...distractors.slice(0, 3).map(l => l.symbol)])
      questions.push({ type: "mc-listen", letter, options, correct })
    }
  })

  return shuffle(questions)
}

export default function LessonTestPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()

  const lessonId = parseInt(params.id as string)
  const isComprehensive = lessonId === 99
  const passingScore = isComprehensive ? 80 : 70

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [letters, setLetters] = useState<Letter[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>("ready")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [xpEarned, setXpEarned] = useState(0)

  const currentQuestion = questions[currentIndex]

  useEffect(() => { preloadArabicVoices() }, [])

  useEffect(() => {
    if (!user) return
    async function loadData() {
      if (isComprehensive) {
        // Comprehensive test — all 28 letters from lessons 1 & 2
        const allLessons = await getAllLessons()
        const alphaLessons = allLessons.filter(l => l.category === "alphabet")
        const allLetters: Letter[] = []
        for (const l of alphaLessons.slice(0, 2)) {
          const withLetters = await getLessonWithLetters(l.id)
          if (withLetters?.letters) allLetters.push(...withLetters.letters)
        }
        setLesson({ id: 99, title_nl: "Grote Test", title_en: "Grand Test", category: "alphabet", order_index: 99, icon: "✦", color: "from-blue-400 to-purple-500" } as Lesson)
        setLetters(allLetters)
      } else {
        const lessonData = await getLessonWithLetters(lessonId)
        if (lessonData) {
          setLesson(lessonData)
          setLetters(lessonData.letters ?? [])
        }
      }
      setDataLoading(false)
    }
    loadData()
  }, [user, lessonId, isComprehensive])

  const startTest = () => {
    setQuestions(buildQuestions(letters))
    setCurrentIndex(0)
    setResults([])
    setSelectedAnswer(null)
    setPhase("exercise")
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return
    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.correct
    const newResults = [...results, { question: currentQuestion, userAnswer: answer, correct }]
    setResults(newResults)

    setTimeout(async () => {
      if (currentIndex + 1 >= questions.length) {
        // Test done — calculate score and save XP
        const score = Math.round((newResults.filter(r => r.correct).length / questions.length) * 100)
        const xp = LevelingSystem.calculateXPForScore(score)
        const passed = score >= passingScore

        // Save progress WITH xp and completed flag
        await ProgressManager.saveProgress(lessonId, passed, score, xp)

        setXpEarned(xp)
        setPhase("results")
      } else {
        setCurrentIndex(i => i + 1)
        setSelectedAnswer(null)
      }
    }, 1000)
  }

  if (authLoading || dataLoading) return (
    <main className="luxe-bg flex items-center justify-center">
      <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  if (!lesson || letters.length === 0) return (
    <main className="luxe-bg flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-xl mb-4" style={{ color: '#d4af37' }}>{t("Test niet beschikbaar", "Test not available")}</p>
        <button onClick={() => router.push("/alphabet")} className="btn-ghost px-6 py-2 rounded">{t("Terug", "Back")}</button>
      </div>
    </main>
  )

  // ── READY PHASE ───────────────────────────────────────────
  if (phase === "ready") {
    return (
      <main className="luxe-bg">
        <div className="luxe-content max-w-3xl mx-auto px-6 lg:px-10 py-16">
          <button onClick={() => router.push(isComprehensive ? "/alphabet" : `/lessons/${lessonId}`)}
            className="eyebrow mb-8" style={{ color: 'rgba(212,175,55,0.6)' }}>
            ← {t("Terug", "Back")}
          </button>

          <div className="mb-10 reveal">
            <p className="eyebrow mb-4">{isComprehensive ? t("Grote test", "Grand test") : t("Les test", "Lesson test")}</p>
            <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              {lang === "nl" ? lesson.title_nl : lesson.title_en}
            </h1>
            <p className="text-lg" style={{ color: 'rgba(245,236,215,0.65)', fontFamily: 'Cormorant Garamond' }}>
              {t(`Test je kennis van ${letters.length} letters.`, `Test your knowledge of ${letters.length} letters.`)}
            </p>
          </div>

          <div className="glass-card rounded-lg p-8 mb-10 reveal" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display text-xl mb-6" style={{ color: '#f5ecd7' }}>
              {t("Wat je kunt verwachten", "What to expect")}
            </h3>
            <div className="space-y-4">
              {[
                { n: letters.length.toString(), label_nl: "vragen", label_en: "questions" },
                { n: `${passingScore}%`,        label_nl: "nodig om te slagen", label_en: "needed to pass" },
                { n: "3",                       label_nl: "soorten vragen (symbool → naam, naam → symbool, luisteren)", label_en: "question types (symbol → name, name → symbol, listen)" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="shrink-0 font-display text-2xl" style={{ color: '#d4af37' }}>
                    {item.n}
                  </div>
                  <p className="text-sm pt-1" style={{ color: 'rgba(245,236,215,0.75)', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem' }}>
                    {lang === "nl" ? item.label_nl : item.label_en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={startTest} className="btn-gold w-full py-5 rounded tracking-wide text-lg reveal" style={{ animationDelay: '0.2s' }}>
            ✦ {t("Start de test", "Start the test")}
          </button>
        </div>
      </main>
    )
  }

  // ── EXERCISE PHASE ────────────────────────────────────────
  if (phase === "exercise" && currentQuestion) {
    const progress = Math.round((currentIndex / questions.length) * 100)

    return (
      <main className="luxe-bg">
        <div className="luxe-content max-w-3xl mx-auto px-6 lg:px-10 py-10">

          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => setPhase("ready")} className="eyebrow" style={{ color: 'rgba(212,175,55,0.6)' }}>
              ✕ {t("Stoppen", "Stop")}
            </button>
            <div className="luxe-bar flex-1">
              <div className="luxe-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>
              {currentIndex + 1}/{questions.length}
            </span>
          </div>

          <div className="glass-card rounded-lg p-10">
            <div className="text-center mb-10">
              {currentQuestion.type === "mc-symbol-to-name" && (
                <>
                  <p className="eyebrow mb-6" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {t("Welke letter is dit?", "Which letter is this?")}
                  </p>
                  <div className="arabic-display" style={{ fontSize: '8rem' }}>
                    {currentQuestion.letter.symbol}
                  </div>
                </>
              )}
              {currentQuestion.type === "mc-name-to-symbol" && (
                <>
                  <p className="eyebrow mb-6" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {t("Welk symbool hoort bij", "Which symbol matches")}:
                  </p>
                  <div className="font-display text-5xl" style={{ color: '#f5ecd7' }}>
                    {currentQuestion.letter.name}
                  </div>
                </>
              )}
              {currentQuestion.type === "mc-listen" && (
                <>
                  <p className="eyebrow mb-6" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {t("Luister en kies de letter", "Listen and pick the letter")}
                  </p>
                  <button onClick={() => playArabicFile(currentQuestion.letter.sound_file, currentQuestion.letter.symbol)}
                    className="btn-gold px-10 py-6 rounded-full">
                    <span className="text-3xl">♪</span>
                  </button>
                  <p className="mt-4 text-sm" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {t("Klik om opnieuw te luisteren", "Click to listen again")}
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options.map((option, i) => {
                let style: React.CSSProperties = { color: '#f5ecd7', padding: '1.5rem 1.25rem', borderRadius: 8, textAlign: 'center' as const }
                if (selectedAnswer) {
                  if (option === currentQuestion.correct) {
                    style = { ...style, borderColor: '#14a373', background: 'rgba(20,163,115,0.15)', color: '#14a373' }
                  } else if (option === selectedAnswer && option !== currentQuestion.correct) {
                    style = { ...style, borderColor: '#e74c3c', background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }
                  } else {
                    style = { ...style, opacity: 0.3 }
                  }
                }
                const isArabicOption = currentQuestion.type === "mc-name-to-symbol" || currentQuestion.type === "mc-listen"
                return (
                  <button key={i} onClick={() => handleAnswer(option)} disabled={!!selectedAnswer}
                    className="glass-card-sm transition" style={style}>
                    <span className={isArabicOption ? "text-4xl font-arabic" : "text-lg font-display"}>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── RESULTS PHASE ─────────────────────────────────────────
  if (phase === "results") {
    const score = Math.round((results.filter(r => r.correct).length / results.length) * 100)
    const passed = score >= passingScore

    return (
      <main className="luxe-bg">
        <div className="luxe-content max-w-3xl mx-auto px-6 lg:px-10 py-16">

          <div className="glass-card rounded-lg p-12 text-center mb-8 reveal">
            <div className="mb-6">
              <span className="arabic-display" style={{ fontSize: '5rem', color: passed ? '#d4af37' : '#e74c3c' }}>
                {passed ? "✦" : "⟢"}
              </span>
            </div>
            <p className="eyebrow mb-4">{passed ? t("Geslaagd", "Passed") : t("Niet geslaagd", "Not passed")}</p>
            <div className="font-display gold-shimmer mb-4" style={{ fontSize: '6rem', lineHeight: 1 }}>{score}%</div>
            <p className="font-display text-lg mb-8" style={{ color: 'rgba(245,236,215,0.7)' }}>
              {results.filter(r => r.correct).length} / {results.length} {t("correct", "correct")}
            </p>
            {passed ? (
              <div className="inline-block glass-card-sm rounded-full px-6 py-2 mb-4">
                <span className="eyebrow" style={{ color: '#d4af37' }}>+{xpEarned} XP {t("verdiend", "earned")}</span>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(245,236,215,0.6)' }}>
                {t(`Minimaal ${passingScore}% nodig. Probeer het opnieuw!`, `${passingScore}% minimum required. Try again!`)}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={startTest} className="btn-gold flex-1 px-6 py-4 rounded tracking-wide">
              ↻ {t("Opnieuw", "Try again")}
            </button>
            <button onClick={() => router.push("/alphabet")} className="btn-ghost flex-1 px-6 py-4 rounded tracking-wide">
              {t("Naar alfabet", "To alphabet")}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return null
}
