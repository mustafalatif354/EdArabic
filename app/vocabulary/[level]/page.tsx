"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { supabase } from "@/lib/supabaseClient"

interface Word {
  id: number; arabic: string; transliteration: string
  definition_nl: string; definition_en: string; difficulty: number
}

const levelConfig: Record<string, { label_nl: string; label_en: string; glyph: string; accent: string; difficulty: number; levelLabel: string }> = {
  beginner:     { label_nl: "Beginner",    label_en: "Beginner",     glyph: "ا", accent: "#14a373", difficulty: 1, levelLabel: "A1" },
  intermediate: { label_nl: "Gevorderd",   label_en: "Intermediate", glyph: "ب", accent: "#d4af37", difficulty: 2, levelLabel: "A2 · B1" },
  advanced:     { label_nl: "Geavanceerd", label_en: "Advanced",     glyph: "ج", accent: "#b8941f", difficulty: 3, levelLabel: "B1 · B2" },
}

export default function VocabularyLevelPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()

  const level = params.level as string
  const config = levelConfig[level]

  const [words, setWords] = useState<Word[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showArabic, setShowArabic] = useState(true)

  useEffect(() => {
    if (!user || !config) return
    async function loadWords() {
      const { data, error } = await supabase.from("words").select("*").eq("difficulty", config.difficulty).order("order_index", { ascending: true })
      if (!error && data) setWords(data)
      setDataLoading(false)
    }
    loadWords()
  }, [user, config])

  if (!config) return (
    <main className="luxe-bg flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-xl mb-4" style={{ color: '#d4af37' }}>{t("Level niet gevonden", "Level not found")}</p>
        <button onClick={() => router.push("/vocabulary")} className="btn-ghost px-6 py-2 rounded">{t("Terug", "Back")}</button>
      </div>
    </main>
  )

  if (authLoading || dataLoading) return (
    <main className="luxe-bg flex items-center justify-center">
      <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  const filtered = words.filter(w =>
    w.arabic.includes(search) ||
    w.transliteration.toLowerCase().includes(search.toLowerCase()) ||
    w.definition_nl.toLowerCase().includes(search.toLowerCase()) ||
    w.definition_en.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="luxe-bg">
      <div className="luxe-content max-w-6xl mx-auto px-6 lg:px-10 py-12">

        <div className="mb-10 reveal">
          <button onClick={() => router.push("/vocabulary")}
            className="eyebrow mb-6 hover:text-yellow-400 transition" style={{ color: 'rgba(212,175,55,0.6)' }}>
            ← {t("Woordenschat", "Vocabulary")}
          </button>

          <div className="flex items-start gap-6 mb-4">
            <span className="arabic-display" style={{ fontSize: '4rem', color: config.accent, textShadow: `0 0 30px ${config.accent}60` }}>
              {config.glyph}
            </span>
            <div>
              <p className="eyebrow mb-2" style={{ color: config.accent }}>{config.levelLabel}</p>
              <h1 className="font-display font-light" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#f5ecd7' }}>
                {lang === "nl" ? config.label_nl : config.label_en}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 reveal" style={{ animationDelay: '0.1s' }}>
          <input type="text" placeholder={t("Zoek een woord...", "Search a word...")} value={search}
            onChange={e => setSearch(e.target.value)}
            className="luxe-input flex-1 px-5 py-3 rounded text-sm" />
          <button onClick={() => setShowArabic(!showArabic)}
            className={showArabic ? "btn-gold px-6 py-3 rounded text-sm" : "btn-ghost px-6 py-3 rounded text-sm"}>
            {showArabic ? t("Verberg Arabisch", "Hide Arabic") : t("Toon Arabisch", "Show Arabic")}
          </button>
          <button onClick={() => router.push(`/vocabulary/exercise?level=${level}`)}
            className="btn-emerald px-6 py-3 rounded text-sm font-medium">
            ✦ {t("Oefen", "Practise")}
          </button>
        </div>

        <p className="text-xs eyebrow mb-6" style={{ color: 'rgba(245,236,215,0.5)' }}>
          {filtered.length} {t("woorden", "words")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((word, i) => (
            <div key={word.id}
              className="glass-card-sm rounded-lg p-5 reveal"
              style={{ animationDelay: `${Math.min(i * 0.02, 0.6)}s` }}>
              {showArabic && (
                <div className="arabic-display text-right mb-3" dir="rtl" style={{ fontSize: '2.5rem' }}>
                  {word.arabic}
                </div>
              )}
              <div className="text-xs font-mono mb-3" style={{ color: config.accent }}>
                /{word.transliteration}/
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-xs w-5 shrink-0 mt-0.5" style={{ color: 'rgba(245,236,215,0.4)' }}>NL</span>
                  <span style={{ color: 'rgba(245,236,215,0.85)' }}>{word.definition_nl}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs w-5 shrink-0 mt-0.5" style={{ color: 'rgba(245,236,215,0.4)' }}>EN</span>
                  <span style={{ color: 'rgba(245,236,215,0.85)' }}>{word.definition_en}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4" style={{ color: 'rgba(212,175,55,0.4)' }}>⟢</div>
            <p className="font-display text-lg" style={{ color: 'rgba(245,236,215,0.5)' }}>
              {t("Geen woorden gevonden", "No words found")}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
