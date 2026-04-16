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

const levelConfig: Record<string, { label_nl: string; label_en: string; icon: string; color: string; border: string; difficulty: number }> = {
  beginner:     { label_nl: "Beginner",    label_en: "Beginner",     icon: "🌱", color: "from-green-400 to-emerald-600",  border: "border-green-200",  difficulty: 1 },
  intermediate: { label_nl: "Gevorderd",   label_en: "Intermediate", icon: "📗", color: "from-blue-400 to-cyan-600",      border: "border-blue-200",   difficulty: 2 },
  advanced:     { label_nl: "Geavanceerd", label_en: "Advanced",     icon: "🔥", color: "from-orange-400 to-red-600",     border: "border-orange-200", difficulty: 3 },
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
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-bold mb-4">{t("Level niet gevonden", "Level not found")}</p>
        <button onClick={() => router.push("/vocabulary")} className="bg-emerald-500 text-white px-4 py-2 rounded-lg">{t("Terug", "Back")}</button>
      </div>
    </main>
  )

  if (authLoading || dataLoading) return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <p className="text-gray-600">{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  const filtered = words.filter(w =>
    w.arabic.includes(search) ||
    w.transliteration.toLowerCase().includes(search.toLowerCase()) ||
    w.definition_nl.toLowerCase().includes(search.toLowerCase()) ||
    w.definition_en.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button onClick={() => router.push("/vocabulary")} className="flex items-center text-emerald-600 hover:text-emerald-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("Woordenschat", "Vocabulary")}
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{config.icon} {lang === "nl" ? config.label_nl : config.label_en}</h1>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input type="text" placeholder={t("Zoek een woord...", "Search a word...")} value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
          <button onClick={() => setShowArabic(!showArabic)}
            className={`px-6 py-3 rounded-xl font-medium transition border ${showArabic ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200"}`}>
            {showArabic ? t("Verberg Arabisch", "Hide Arabic") : t("Toon Arabisch", "Show Arabic")}
          </button>
          <button onClick={() => router.push(`/vocabulary/exercise?level=${level}`)}
            className={`px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r ${config.color} hover:opacity-90 transition`}>
            🧠 {t("Oefen dit niveau", "Practise this level")}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">{filtered.length} {t("woorden", "words")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(word => (
            <div key={word.id} className={`bg-white rounded-2xl shadow-md p-5 border ${config.border} hover:shadow-lg transition-shadow`}>
              {showArabic && (
                <div className="text-4xl font-bold text-gray-800 text-right mb-2" dir="rtl">{word.arabic}</div>
              )}
              <div className="text-sm text-emerald-600 font-mono mb-3">/{word.transliteration}/</div>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-400 w-4 shrink-0">NL</span>
                  <span className="text-gray-700 text-sm">{word.definition_nl}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-400 w-4 shrink-0">EN</span>
                  <span className="text-gray-700 text-sm">{word.definition_en}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p>{t("Geen woorden gevonden", "No words found")}</p>
          </div>
        )}
      </div>
    </main>
  )
}
