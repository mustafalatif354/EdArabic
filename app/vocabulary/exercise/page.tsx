"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { LevelingSystem } from "@/lib/leveling"

interface Word {
  id: number
  arabic: string
  transliteration: string
  definition_nl: string
  definition_en: string
  difficulty: number
}

type QuestionType = "mc-arabic-to-def" | "mc-def-to-arabic" | "type-arabic-to-def" | "type-def-to-arabic"

interface Question {
  type: QuestionType
  word: Word
  options?: string[]   // for multiple choice
  correct: string      // the correct answer string
}

interface Result {
  question: Question
  userAnswer: string
  correct: boolean
}

type Phase = "setup" | "exercise" | "results"

const LEVELS = [
  { key: "beginner",     label_nl: "Beginner",    label_en: "Beginner",     icon: "🌱", difficulty: 1 },
  { key: "intermediate", label_nl: "Gevorderd",   label_en: "Intermediate", icon: "📗", difficulty: 2 },
  { key: "advanced",     label_nl: "Geavanceerd", label_en: "Advanced",     icon: "🔥", difficulty: 3 },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestions(words: Word[]): Question[] {
  const questions: Question[] = []
  const half = Math.ceil(words.length / 2)
  const mcWords = words.slice(0, half)
  const typeWords = words.slice(half)

  // --- Multiple choice phase ---
  mcWords.forEach((word, i) => {
    // Alternate between: show Arabic → pick definition, show definition → pick Arabic
    if (i % 2 === 0) {
      // Show Arabic, pick definition (NL or EN randomly)
      const useNL = Math.random() > 0.5
      const correct = useNL ? word.definition_nl : word.definition_en
      const distractors = shuffle(
        words
          .filter(w => w.id !== word.id)
          .map(w => useNL ? w.definition_nl : w.definition_en)
      ).slice(0, 3)
      questions.push({
        type: "mc-arabic-to-def",
        word,
        correct,
        options: shuffle([correct, ...distractors]),
      })
    } else {
      // Show definition, pick Arabic
      const useNL = Math.random() > 0.5
      const correct = word.arabic
      const distractors = shuffle(
        words.filter(w => w.id !== word.id).map(w => w.arabic)
      ).slice(0, 3)
      questions.push({
        type: "mc-def-to-arabic",
        word,
        correct,
        options: shuffle([correct, ...distractors]),
        // store which language the definition prompt is in
      })
    }
  })

  // --- Typing phase ---
  typeWords.forEach((word, i) => {
    if (i % 2 === 0) {
      // Show Arabic, type definition
      const useNL = Math.random() > 0.5
      questions.push({
        type: "type-arabic-to-def",
        word,
        correct: useNL ? word.definition_nl : word.definition_en,
      })
    } else {
      // Show definition, type Arabic transliteration (easier than Arabic script)
      questions.push({
        type: "type-def-to-arabic",
        word,
        correct: word.transliteration.toLowerCase(),
      })
    }
  })

  return questions
}

function isCorrectAnswer(userAnswer: string, correct: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06ff\s]/g, "")
  return normalize(userAnswer) === normalize(correct)
}

export default function VocabularyExercisePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const preselectedLevel = searchParams.get("level") ?? ""

  const [phase, setPhase] = useState<Phase>("setup")
  const [selectedLevel, setSelectedLevel] = useState(preselectedLevel)
  const [words, setWords] = useState<Word[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [dataLoading, setDataLoading] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isMultipleChoice = currentQuestion?.type.startsWith("mc-")
  const isTyping = currentQuestion?.type.startsWith("type-")
  const isMidpoint = currentIndex === Math.ceil(questions.length / 2)

  // Load words when level selected
  const loadWords = useCallback(async (levelKey: string) => {
    setDataLoading(true)
    const level = LEVELS.find(l => l.key === levelKey)
    if (!level) return

    const { data } = await supabase
      .from("words")
      .select("*")
      .eq("difficulty", level.difficulty)
      .order("order_index", { ascending: true })

    if (data) {
      const shuffled = shuffle(data)
      setWords(shuffled)
      setQuestions(buildQuestions(shuffled))
    }
    setDataLoading(false)
    setPhase("exercise")
    setCurrentIndex(0)
    setResults([])
    setUserAnswer("")
    setFeedback(null)
  }, [])

  // If level was preselected via query param, auto-load
  useEffect(() => {
    if (user && preselectedLevel && phase === "setup") {
      setSelectedLevel(preselectedLevel)
      loadWords(preselectedLevel)
    }
  }, [user, preselectedLevel, phase, loadWords])

  function handleAnswer(answer: string) {
    if (feedback) return
    const correct = isCorrectAnswer(answer, currentQuestion.correct)
    setFeedback(correct ? "correct" : "wrong")
    setResults(prev => [...prev, { question: currentQuestion, userAnswer: answer, correct }])

    setTimeout(async () => {
      setFeedback(null)
      setUserAnswer("")
      if (currentIndex + 1 >= questions.length) {
        // Save XP to progress table using a vocabulary-specific lesson_id (100 + difficulty)
        const allResults = [...results, { question: currentQuestion, userAnswer: answer, correct }]
        const finalScore = Math.round((allResults.filter(r => r.correct).length / allResults.length) * 100)
        const xp = LevelingSystem.calculateXPForScore(finalScore)
        const level = LEVELS.find(l => l.key === selectedLevel)
        const vocabLessonId = 100 + (level?.difficulty ?? 1)
        await supabase.from("progress").upsert({
          user_id: user!.id,
          lesson_id: vocabLessonId,
          completed: true,
          score: finalScore,
          xp_earned: xp,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,lesson_id" })
        setPhase("results")
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, 1200)
  }

  function handleTypeSubmit() {
    if (!userAnswer.trim()) return
    handleAnswer(userAnswer.trim())
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p className="text-gray-600">Bezig met laden...</p>
      </main>
    )
  }

  // ── SETUP PHASE ──────────────────────────────────────────
  if (phase === "setup") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
            <button onClick={() => router.push("/vocabulary")} className="flex items-center text-emerald-600 hover:text-emerald-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Woordenschat
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">🧠 Oefening / Exercise</h1>
            </div>
            <div className="w-24" />
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Kies een niveau</h2>
          <p className="text-gray-500 text-center mb-8">Choose a level</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {LEVELS.map(level => (
              <button
                key={level.key}
                onClick={() => { setSelectedLevel(level.key); loadWords(level.key) }}
                disabled={dataLoading}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center border-2 border-transparent hover:border-emerald-300 disabled:opacity-50"
              >
                <div className="text-5xl mb-3">{level.icon}</div>
                <div className="text-xl font-bold text-gray-900">{level.label_nl}</div>
                <div className="text-sm text-gray-400">{level.label_en}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── EXERCISE PHASE ────────────────────────────────────────
  if (phase === "exercise" && currentQuestion) {
    const progress = Math.round(((currentIndex) / questions.length) * 100)
    const isSecondHalf = currentIndex >= Math.ceil(questions.length / 2)

    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setPhase("setup")} className="text-gray-500 hover:text-gray-700 text-sm">
              ✕ Stoppen / Stop
            </button>
            <div className="flex items-center gap-3 flex-1 mx-6">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap">{currentIndex + 1} / {questions.length}</span>
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
              {isSecondHalf ? "✍️ Invullen / Typing" : "🔘 Meerkeuze / Multiple choice"}
            </div>
          </div>
        </header>

        {/* Phase transition notice */}
        {isMidpoint && (
          <div className="bg-blue-50 border-b border-blue-200 text-center py-2 text-sm text-blue-700 font-medium">
            Nu begin je met invulvragen! / Now typing questions begin!
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-3xl shadow-xl p-8">

            {/* Question prompt */}
            <div className="text-center mb-8">
              {(currentQuestion.type === "mc-arabic-to-def" || currentQuestion.type === "type-arabic-to-def") && (
                <>
                  <p className="text-gray-500 text-sm mb-3">Wat betekent dit woord? / What does this word mean?</p>
                  <div className="text-6xl font-bold text-gray-800 mb-2" dir="rtl">{currentQuestion.word.arabic}</div>
                  <div className="text-emerald-600 font-mono text-lg">/{currentQuestion.word.transliteration}/</div>
                </>
              )}
              {(currentQuestion.type === "mc-def-to-arabic" || currentQuestion.type === "type-def-to-arabic") && (
                <>
                  <p className="text-gray-500 text-sm mb-3">
                    {currentQuestion.type === "mc-def-to-arabic"
                      ? "Welk Arabisch woord hoort hierbij? / Which Arabic word matches?"
                      : "Schrijf de transliteratie van het Arabische woord. / Write the transliteration of the Arabic word."}
                  </p>
                  <div className="text-3xl font-bold text-gray-800 mb-1">{currentQuestion.word.definition_nl}</div>
                  <div className="text-gray-400 text-lg">{currentQuestion.word.definition_en}</div>
                </>
              )}
            </div>

            {/* Feedback overlay */}
            {feedback && (
              <div className={`text-center text-2xl font-bold mb-6 ${feedback === "correct" ? "text-emerald-500" : "text-red-500"}`}>
                {feedback === "correct" ? "✓ Correct!" : `✗ Fout — ${currentQuestion.correct}`}
              </div>
            )}

            {/* Multiple choice options */}
            {isMultipleChoice && currentQuestion.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, i) => {
                  let style = "border-gray-200 bg-white text-gray-800 hover:border-emerald-400 hover:bg-emerald-50"
                  if (feedback) {
                    if (option === currentQuestion.correct) style = "border-emerald-500 bg-emerald-50 text-emerald-700"
                    else if (option === results[results.length - 1]?.userAnswer && !results[results.length - 1]?.correct)
                      style = "border-red-400 bg-red-50 text-red-700"
                    else style = "border-gray-200 bg-white text-gray-400 opacity-50"
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(option)}
                      disabled={!!feedback}
                      className={`border-2 rounded-xl p-4 text-left transition-all duration-200 font-medium ${style}`}
                      dir={currentQuestion.type === "mc-def-to-arabic" ? "rtl" : "ltr"}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Typing input */}
            {isTyping && (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleTypeSubmit()}
                  disabled={!!feedback}
                  placeholder={
                    currentQuestion.type === "type-def-to-arabic"
                      ? "Typ de transliteratie... / Type the transliteration..."
                      : "Typ de betekenis... / Type the meaning..."
                  }
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-emerald-400 disabled:opacity-50"
                  autoFocus
                />
                <button
                  onClick={handleTypeSubmit}
                  disabled={!!feedback || !userAnswer.trim()}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-blue-600 transition disabled:opacity-50"
                >
                  Bevestig / Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  // ── RESULTS PHASE ─────────────────────────────────────────
  if (phase === "results") {
    const score = Math.round((results.filter(r => r.correct).length / results.length) * 100)
    const xpEarned = Math.round(score / 10) * 5  // 0–50 XP based on score

    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="max-w-3xl mx-auto px-4 py-10">

          {/* Score card */}
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center mb-8">
            <div className="text-6xl mb-4">{score >= 80 ? "🏆" : score >= 60 ? "👍" : "💪"}</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Resultaten / Results</h1>
            <div className="text-7xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent my-4">
              {score}%
            </div>
            <p className="text-gray-500 mb-2">
              {results.filter(r => r.correct).length} / {results.length} correct
            </p>
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold text-sm">
              +{xpEarned} XP verdiend / earned
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overzicht / Overview</h2>
            <div className="space-y-3">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-xl border ${
                    result.correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className={`text-xl shrink-0 ${result.correct ? "text-emerald-500" : "text-red-500"}`}>
                    {result.correct ? "✓" : "✗"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-lg" dir="rtl">{result.question.word.arabic}</div>
                    <div className="text-sm text-emerald-600 font-mono">/{result.question.word.transliteration}/</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {result.question.word.definition_nl} / {result.question.word.definition_en}
                    </div>
                    {!result.correct && (
                      <div className="text-sm text-red-600 mt-1">
                        Jouw antwoord / Your answer: <span className="font-medium">{result.userAnswer || "(leeg / empty)"}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => loadWords(selectedLevel)}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-blue-600 transition"
            >
              🔁 Opnieuw / Try again
            </button>
            <button
              onClick={() => setPhase("setup")}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:border-emerald-400 transition"
            >
              Ander niveau / Other level
            </button>
            <button
              onClick={() => router.push("/vocabulary")}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:border-emerald-400 transition"
            >
              Woordenschat / Vocabulary
            </button>
          </div>
        </div>
      </main>
    )
  }

  return null
}
