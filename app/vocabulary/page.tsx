"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { supabase } from "@/lib/supabaseClient"
import { SpacedRepetition, ReviewStats } from "@/lib/spacedRepetition"

interface WordCount { beginner: number; intermediate: number; advanced: number }

const BG_LETTERS = ['ك','ل','م','ن','ه','و','ي','ا','ب','ت','ث','ج']

export default function VocabularyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [wordCounts, setWordCounts] = useState<WordCount>({ beginner: 0, intermediate: 0, advanced: 0 })
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function loadData() {
      const [wordsRes, statsRes] = await Promise.all([
        supabase.from("words").select("difficulty"),
        SpacedRepetition.getStats(user!.id),
      ])
      if (wordsRes.data) setWordCounts({
        beginner: wordsRes.data.filter(w => w.difficulty === 1).length,
        intermediate: wordsRes.data.filter(w => w.difficulty === 2).length,
        advanced: wordsRes.data.filter(w => w.difficulty === 3).length,
      })
      setStats(statsRes)
      setDataLoading(false)
    }
    loadData()
  }, [user])

  if (authLoading || dataLoading) return (
    <main className="luxe-bg flex items-center justify-center">
      <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  const levels = [
    { key: "beginner",     glyph: "ا", label: t("Beginner", "Beginner"),       desc: t("Dagelijks gebruik", "Everyday use"),         accent: "#14a373", levelLabel: "A1" },
    { key: "intermediate", glyph: "ب", label: t("Gevorderd", "Intermediate"),  desc: t("Uitgebreide woordenschat", "Expanded vocabulary"), accent: "#d4af37", levelLabel: "A2 · B1" },
    { key: "advanced",     glyph: "ج", label: t("Geavanceerd", "Advanced"),    desc: t("Abstracte concepten", "Abstract concepts"),  accent: "#b8941f", levelLabel: "B1 · B2" },
  ]

  const masteredPct = stats && stats.totalWords > 0 ? Math.round((stats.mastered / stats.totalWords) * 100) : 0
  const hasSession = (stats?.dueNow ?? 0) + (stats?.newWords ?? 0) > 0

  return (
    <main className="luxe-bg">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        {BG_LETTERS.map((letter, i) => (
          <span key={i} className="floating-letter"
            style={{
              left: `${(i * 8.7) % 95}%`,
              top: `${(i * 12.5) % 90 + 5}%`,
              fontSize: `${3 + (i % 4)}rem`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${22 + (i % 6)}s`,
            }}>{letter}</span>
        ))}
      </div>

      <div className="luxe-content max-w-6xl mx-auto px-6 lg:px-10 py-16">
        <div className="mb-12 reveal">
          <p className="eyebrow mb-4">{t("De taal leren", "Learning the language")}</p>
          <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            {t("Woordenschat", "Vocabulary")}
          </h1>
          <p className="text-lg" style={{ color: 'rgba(245,236,215,0.6)', fontFamily: 'Cormorant Garamond' }}>
            {t("Slim leren met herhaling op het juiste moment", "Learn smart with reviews at the right moment")}
          </p>
        </div>

        {/* Main review CTA */}
        <div onClick={() => router.push("/vocabulary/exercise")}
          className="glass-card tilt-card rounded-lg p-10 mb-12 cursor-pointer reveal"
          style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">

            <div className="shrink-0">
              <span className="arabic-display" style={{ fontSize: '5rem' }}>✦</span>
            </div>

            <div className="flex-1">
              <p className="eyebrow mb-3">{t("Slimme herhaling", "Smart review")}</p>
              <h2 className="font-display text-3xl mb-3" style={{ color: '#f5ecd7' }}>
                {hasSession
                  ? t("Start je oefensessie", "Start your review session")
                  : t("Alles herhaald voor vandaag", "All caught up for today")
                }
              </h2>
              <p className="mb-6 max-w-xl" style={{ color: 'rgba(245,236,215,0.65)', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem' }}>
                {hasSession
                  ? t(
                      "15 woorden geselecteerd uit wat je moet herhalen en nieuwe woorden.",
                      "15 words selected from what you need to review and new words."
                    )
                  : t(
                      "Kom morgen terug voor nieuwe herhalingen.",
                      "Come back tomorrow for more reviews."
                    )
                }
              </p>

              {/* Stats row */}
              {stats && (
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <div className="font-display text-3xl" style={{ color: '#d4af37' }}>{stats.dueNow}</div>
                    <div className="eyebrow text-xs mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Nu herhalen", "Due now")}</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl" style={{ color: '#14a373' }}>{stats.newWords}</div>
                    <div className="eyebrow text-xs mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Nieuw", "New")}</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl" style={{ color: '#f5ecd7' }}>{stats.learning}</div>
                    <div className="eyebrow text-xs mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Leren", "Learning")}</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl gold-shimmer">{stats.mastered}</div>
                    <div className="eyebrow text-xs mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Beheerst", "Mastered")}</div>
                  </div>
                </div>
              )}

              {hasSession && (
                <div className="inline-flex items-center gap-2 eyebrow" style={{ color: '#d4af37' }}>
                  <span>{t("Start", "Start")}</span>
                  <span>→</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {stats && stats.totalWords > 0 && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>
                  {t("Algemene voortgang", "Overall progress")}
                </span>
                <span className="font-display text-sm" style={{ color: '#d4af37' }}>
                  {stats.mastered} / {stats.totalWords}
                </span>
              </div>
              <div className="luxe-bar">
                <div className="luxe-bar-fill" style={{ width: `${masteredPct}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 reveal" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl" style={{ color: '#f5ecd7' }}>
              {t("Blader door niveau", "Browse by level")}
            </h2>
            <div className="gold-divider flex-1 mx-6" />
            <span className="eyebrow">CEFR</span>
          </div>
        </div>

        <div className="scene-3d grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level, i) => (
            <div key={level.key}
              onClick={() => router.push(`/vocabulary/${level.key}`)}
              className="tilt-card glass-card rounded-lg p-8 cursor-pointer reveal"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}>

              <div className="flex items-start justify-between mb-6">
                <span className="arabic-display" style={{ fontSize: '3.5rem', color: level.accent, textShadow: `0 0 30px ${level.accent}60` }}>
                  {level.glyph}
                </span>
                <span className="eyebrow" style={{ color: level.accent }}>{level.levelLabel}</span>
              </div>

              <div className="ornament mb-4" style={{ maxWidth: 80 }}>
                <span className="ornament-dot" style={{ background: level.accent, boxShadow: `0 0 12px ${level.accent}99` }}/>
              </div>

              <h3 className="font-display text-2xl mb-2" style={{ color: '#f5ecd7' }}>{level.label}</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(245,236,215,0.6)' }}>{level.desc}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(245,236,215,0.4)' }}>
                  {wordCounts[level.key as keyof WordCount]} {t("woorden", "words")}
                </span>
                <span className="eyebrow" style={{ color: level.accent }}>{t("Bekijk", "View")} →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
