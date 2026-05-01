"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { supabase } from "@/lib/supabaseClient"
import { LevelingSystem } from "@/lib/leveling"
import { SpacedRepetition, Word, SESSION_SIZE } from "@/lib/spacedRepetition"

type QuestionType = "mc-arabic-to-def" | "mc-def-to-arabic" | "type-arabic-to-def" | "type-def-to-arabic"

interface Question { type: QuestionType; word: Word; options?: string[]; correct: string }
interface Result { question: Question; userAnswer: string; correct: boolean }
type Phase = "ready" | "exercise" | "results"

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function buildQuestions(words: Word[]): Question[] {
  // Need distractor pool across all words shown
  const questions: Question[] = []
  const half = Math.ceil(words.length / 2)
  const mcWords = words.slice(0, half)
  const typeWords = words.slice(half)

  mcWords.forEach((word, i) => {
    if (i % 2 === 0) {
      const useNL = Math.random() > 0.5
      const correct = useNL ? word.definition_nl : word.definition_en
      const distractors = shuffle(words.filter(w => w.id !== word.id).map(w => useNL ? w.definition_nl : w.definition_en)).slice(0, 3)
      questions.push({ type: "mc-arabic-to-def", word, correct, options: shuffle([correct, ...distractors]) })
    } else {
      const correct = word.arabic
      const distractors = shuffle(words.filter(w => w.id !== word.id).map(w => w.arabic)).slice(0, 3)
      questions.push({ type: "mc-def-to-arabic", word, correct, options: shuffle([correct, ...distractors]) })
    }
  })

  typeWords.forEach((word, i) => {
    if (i % 2 === 0) {
      const useNL = Math.random() > 0.5
      questions.push({ type: "type-arabic-to-def", word, correct: useNL ? word.definition_nl : word.definition_en })
    } else {
      questions.push({ type: "type-def-to-arabic", word, correct: word.transliteration.toLowerCase() })
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
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()

  const [phase, setPhase] = useState<Phase>("ready")
  const [sessionWords, setSessionWords] = useState<Word[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [stats, setStats] = useState<{ dueNow: number; newWords: number; learning: number; mastered: number } | null>(null)

  const currentQuestion = questions[currentIndex]
  const isMultipleChoice = currentQuestion?.type.startsWith("mc-")
  const isTyping = currentQuestion?.type.startsWith("type-")
  const isMidpoint = currentIndex === Math.ceil(questions.length / 2)

  // Load stats on mount
  useEffect(() => {
    if (!user) return
    SpacedRepetition.getStats(user.id).then(setStats)
  }, [user])

  const startSession = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    const words = await SpacedRepetition.getReviewSession(user.id)
    if (words.length === 0) {
      setDataLoading(false)
      return
    }
    setSessionWords(words)
    setQuestions(buildQuestions(words))
    setCurrentIndex(0)
    setResults([])
    setUserAnswer("")
    setFeedback(null)
    setPhase("exercise")
    setDataLoading(false)
  }, [user])

  function handleAnswer(answer: string) {
    if (feedback) return
    const correct = isCorrectAnswer(answer, currentQuestion.correct)
    setFeedback(correct ? "correct" : "wrong")
    setResults(prev => [...prev, { question: currentQuestion, userAnswer: answer, correct }])

    // Record in spaced repetition system
    SpacedRepetition.recordAnswer(user!.id, currentQuestion.word.id, correct)

    setTimeout(async () => {
      setFeedback(null); setUserAnswer("")
      if (currentIndex + 1 >= questions.length) {
        // Session done — save XP
        const allResults = [...results, { question: currentQuestion, userAnswer: answer, correct }]
        const finalScore = Math.round((allResults.filter(r => r.correct).length / allResults.length) * 100)
        const xp = LevelingSystem.calculateXPForScore(finalScore)
        // Use lesson_id 100 for "vocabulary review" progress tracking
        await supabase.from("progress").upsert({
          user_id: user!.id, lesson_id: 100, completed: true,
          score: finalScore, xp: xp, completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,lesson_id" })
        setPhase("results")
        // Refresh stats for when user returns to ready phase
        SpacedRepetition.getStats(user!.id).then(setStats)
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, 1200)
  }

  function handleTypeSubmit() {
    if (!userAnswer.trim()) return
    handleAnswer(userAnswer.trim())
  }

  if (authLoading) return (
    <main className="luxe-bg flex items-center justify-center">
      <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  // ── READY PHASE ──────────────────────────────────────────
  if (phase === "ready") {
    const hasAnyWords = (stats?.dueNow ?? 0) + (stats?.newWords ?? 0) > 0

    return (
      <main className="luxe-bg">
        <div className="luxe-content max-w-4xl mx-auto px-6 lg:px-10 py-16">
          <button onClick={() => router.push("/vocabulary")} className="eyebrow mb-8" style={{ color: 'rgba(212,175,55,0.6)' }}>
            ← {t("Woordenschat", "Vocabulary")}
          </button>

          <div className="mb-12 reveal">
            <p className="eyebrow mb-4">{t("Slimme herhaling", "Smart review")}</p>
            <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              {t("Jouw", "Your")} <span className="italic gold-shimmer">{t("oefensessie", "review session")}</span>
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: 'rgba(245,236,215,0.65)', fontFamily: 'Cormorant Garamond' }}>
              {t(
                "We selecteren 15 woorden op basis van wat je moet herhalen en nieuwe woorden om te ontdekken. Hoe beter je een woord kent, hoe minder vaak het terugkomt.",
                "We select 15 words based on what you need to review and new words to discover. The better you know a word, the less often it returns."
              )}
            </p>
          </div>

          {/* Stats grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 reveal" style={{ animationDelay: '0.1s' }}>
              <div className="glass-card rounded-lg p-6 text-center">
                <div className="font-display text-5xl mb-2" style={{ color: '#d4af37' }}>{stats.dueNow}</div>
                <div className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Nu herhalen", "Due now")}</div>
              </div>
              <div className="glass-card rounded-lg p-6 text-center">
                <div className="font-display text-5xl mb-2" style={{ color: '#14a373' }}>{stats.newWords}</div>
                <div className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Nieuw", "New")}</div>
              </div>
              <div className="glass-card rounded-lg p-6 text-center">
                <div className="font-display text-5xl mb-2" style={{ color: '#f5ecd7' }}>{stats.learning}</div>
                <div className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Leren", "Learning")}</div>
              </div>
              <div className="glass-card rounded-lg p-6 text-center">
                <div className="font-display text-5xl mb-2 gold-shimmer">{stats.mastered}</div>
                <div className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Beheerst", "Mastered")}</div>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="glass-card rounded-lg p-8 mb-10 reveal" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-display text-xl mb-6" style={{ color: '#f5ecd7' }}>
              {t("Hoe het werkt", "How it works")}
            </h3>
            <div className="space-y-4">
              {[
                { n: "1", t_nl: "Je krijgt 15 woorden per sessie",                    t_en: "You get 15 words per session" },
                { n: "2", t_nl: "Goed → het woord komt later terug (dagen tot weken)", t_en: "Correct → the word returns later (days to weeks)" },
                { n: "3", t_nl: "Fout → je ziet het woord snel weer",                  t_en: "Wrong → you'll see the word again soon" },
                { n: "4", t_nl: "Na 5 keer goed is het woord 'beheerst'",              t_en: "After 5 correct in a row the word is 'mastered'" },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-sm"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
                    {step.n}
                  </div>
                  <p className="text-sm pt-1" style={{ color: 'rgba(245,236,215,0.75)', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem' }}>
                    {t(step.t_nl, step.t_en)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ animationDelay: '0.3s' }}>
            {hasAnyWords ? (
              <button onClick={startSession} disabled={dataLoading}
                className="btn-gold w-full py-5 rounded tracking-wide text-lg">
                {dataLoading
                  ? t("Laden...", "Loading...")
                  : stats?.dueNow
                    ? `✦ ${t("Start sessie", "Start session")} (${stats.dueNow} ${t("wachten", "waiting")})`
                    : `✦ ${t("Begin met leren", "Begin learning")}`
                }
              </button>
            ) : (
              <div className="glass-card rounded-lg p-10 text-center">
                <p className="font-display text-xl mb-4" style={{ color: '#14a373' }}>
                  ✓ {t("Alles herhaald voor vandaag", "All caught up for today")}
                </p>
                <p style={{ color: 'rgba(245,236,215,0.6)' }}>
                  {t("Kom morgen terug voor nieuwe herhalingen.", "Come back tomorrow for more reviews.")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  // ── EXERCISE PHASE ───────────────────────────────────────
  if (phase === "exercise" && currentQuestion) {
    const progress = Math.round((currentIndex / questions.length) * 100)
    const isSecondHalf = currentIndex >= Math.ceil(questions.length / 2)

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

          <p className="eyebrow text-center mb-8" style={{ color: isSecondHalf ? '#d4af37' : 'rgba(212,175,55,0.6)' }}>
            {isSecondHalf ? `✍ ${t("Invullen", "Typing")}` : `⚘ ${t("Meerkeuze", "Multiple choice")}`}
          </p>

          {isMidpoint && (
            <div className="glass-card-sm rounded px-6 py-3 mb-8 text-center">
              <p className="eyebrow" style={{ color: '#d4af37' }}>
                {t("Nu begin je met invulvragen", "Now typing questions begin")}
              </p>
            </div>
          )}

          <div className="glass-card rounded-lg p-10">
            <div className="text-center mb-10">
              {(currentQuestion.type === "mc-arabic-to-def" || currentQuestion.type === "type-arabic-to-def") && (
                <>
                  <p className="eyebrow mb-6" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {t("Wat betekent dit woord?", "What does this word mean?")}
                  </p>
                  <div className="arabic-display mb-3" dir="rtl" style={{ fontSize: '6rem' }}>
                    {currentQuestion.word.arabic}
                  </div>
                  <div className="font-mono text-lg" style={{ color: '#d4af37' }}>
                    /{currentQuestion.word.transliteration}/
                  </div>
                </>
              )}
              {(currentQuestion.type === "mc-def-to-arabic" || currentQuestion.type === "type-def-to-arabic") && (
                <>
                  <p className="eyebrow mb-6" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {currentQuestion.type === "mc-def-to-arabic"
                      ? t("Welk Arabisch woord?", "Which Arabic word?")
                      : t("Schrijf de transliteratie", "Write the transliteration")}
                  </p>
                  <div className="font-display text-4xl mb-2" style={{ color: '#f5ecd7' }}>
                    {currentQuestion.word.definition_nl}
                  </div>
                  <div className="font-display text-lg italic" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {currentQuestion.word.definition_en}
                  </div>
                </>
              )}
            </div>

            {feedback && (
              <div className="text-center mb-8">
                <p className="font-display text-2xl" style={{ color: feedback === "correct" ? '#14a373' : '#e74c3c' }}>
                  {feedback === "correct" ? `✓ ${t("Correct", "Correct")}` : `✗ ${currentQuestion.correct}`}
                </p>
              </div>
            )}

            {isMultipleChoice && currentQuestion.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, i) => {
                  const lastResult = results[results.length - 1]
                  let style: React.CSSProperties = { color: '#f5ecd7', padding: '1rem 1.25rem', borderRadius: 8, textAlign: 'left' as const }
                  if (feedback) {
                    if (option === currentQuestion.correct) {
                      style = { ...style, borderColor: '#14a373', background: 'rgba(20,163,115,0.15)', color: '#14a373' }
                    } else if (option === lastResult?.userAnswer && !lastResult?.correct) {
                      style = { ...style, borderColor: '#e74c3c', background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }
                    } else {
                      style = { ...style, opacity: 0.3 }
                    }
                  }
                  const isArabic = currentQuestion.type === "mc-def-to-arabic"
                  return (
                    <button key={i} onClick={() => handleAnswer(option)} disabled={!!feedback}
                      className="glass-card-sm transition" style={style} dir={isArabic ? "rtl" : "ltr"}>
                      <span className={isArabic ? "text-3xl" : "text-base"} style={isArabic ? { fontFamily: 'Amiri, serif', lineHeight: '1.6' } : {}}>
                        {option}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {isTyping && (
              <div className="flex flex-col gap-4">
                <input type="text" value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleTypeSubmit()}
                  disabled={!!feedback}
                  placeholder={currentQuestion.type === "type-def-to-arabic"
                    ? t("Typ de transliteratie...", "Type the transliteration...")
                    : t("Typ de betekenis...", "Type the meaning...")
                  }
                  className="luxe-input px-5 py-4 rounded text-lg" autoFocus />
                <button onClick={handleTypeSubmit} disabled={!!feedback || !userAnswer.trim()}
                  className="btn-gold px-8 py-4 rounded tracking-wide">
                  {t("Bevestig", "Confirm")} →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  // ── RESULTS PHASE ────────────────────────────────────────
  if (phase === "results") {
    const score = Math.round((results.filter(r => r.correct).length / results.length) * 100)
    const xpEarned = LevelingSystem.calculateXPForScore(score)

    return (
      <main className="luxe-bg">
        <div className="luxe-content max-w-3xl mx-auto px-6 lg:px-10 py-16">

          <div className="glass-card rounded-lg p-12 text-center mb-8 reveal">
            <div className="mb-6">
              <span className="arabic-display" style={{ fontSize: '5rem' }}>
                {score >= 80 ? "✦" : score >= 60 ? "❋" : "⟢"}
              </span>
            </div>
            <p className="eyebrow mb-4">{t("Sessie voltooid", "Session complete")}</p>
            <div className="font-display gold-shimmer mb-4" style={{ fontSize: '6rem', lineHeight: 1 }}>{score}%</div>
            <p className="font-display text-lg mb-8" style={{ color: 'rgba(245,236,215,0.7)' }}>
              {results.filter(r => r.correct).length} / {results.length} {t("correct", "correct")}
            </p>
            <div className="inline-block glass-card-sm rounded-full px-6 py-2">
              <span className="eyebrow" style={{ color: '#d4af37' }}>+{xpEarned} XP {t("verdiend", "earned")}</span>
            </div>
          </div>

          <div className="glass-card rounded-lg p-8 mb-8 reveal" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-display text-xl mb-6" style={{ color: '#f5ecd7' }}>{t("Overzicht", "Overview")}</h2>
            <div className="space-y-3">
              {results.map((result, i) => (
                <div key={i} className="glass-card-sm rounded-lg p-4" style={{
                  borderColor: result.correct ? 'rgba(20,163,115,0.3)' : 'rgba(231,76,60,0.3)',
                  background: result.correct ? 'rgba(20,163,115,0.05)' : 'rgba(231,76,60,0.05)',
                }}>
                  <div className="flex items-start gap-4">
                    <span className="text-xl shrink-0" style={{ color: result.correct ? '#14a373' : '#e74c3c' }}>
                      {result.correct ? "✓" : "✗"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="arabic-display text-2xl mb-1" dir="rtl">{result.question.word.arabic}</div>
                      <div className="font-mono text-xs mb-2" style={{ color: '#d4af37' }}>/{result.question.word.transliteration}/</div>
                      <div className="text-sm" style={{ color: 'rgba(245,236,215,0.75)' }}>
                        {result.question.word.definition_nl} · <span className="italic" style={{ color: 'rgba(245,236,215,0.5)' }}>{result.question.word.definition_en}</span>
                      </div>
                      {!result.correct && (
                        <div className="text-sm mt-2" style={{ color: '#e74c3c' }}>
                          {t("Jouw antwoord", "Your answer")}: <span className="font-medium">{result.userAnswer || t("(leeg)", "(empty)")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={startSession} className="btn-gold flex-1 px-6 py-4 rounded tracking-wide">
              ✦ {t("Nieuwe sessie", "New session")}
            </button>
            <button onClick={() => router.push("/vocabulary")} className="btn-ghost flex-1 px-6 py-4 rounded tracking-wide">
              {t("Naar overzicht", "To overview")}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return null
}
