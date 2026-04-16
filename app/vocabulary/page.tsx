"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { supabase } from "@/lib/supabaseClient"

interface WordCount { beginner: number; intermediate: number; advanced: number }

export default function VocabularyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [wordCounts, setWordCounts] = useState<WordCount>({ beginner: 0, intermediate: 0, advanced: 0 })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function loadCounts() {
      const { data } = await supabase.from("words").select("difficulty")
      if (data) setWordCounts({
        beginner: data.filter(w => w.difficulty === 1).length,
        intermediate: data.filter(w => w.difficulty === 2).length,
        advanced: data.filter(w => w.difficulty === 3).length,
      })
      setDataLoading(false)
    }
    loadCounts()
  }, [user])

  if (authLoading || dataLoading) return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <p className="text-gray-600">{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  const levels = [
    { key: "beginner", icon: "🌱", color: "from-green-400 to-emerald-600", bg: "from-green-50 to-emerald-50", border: "border-green-200", label: t("Beginner", "Beginner"), desc: t("Veelgebruikte dagelijkse woorden", "Common everyday words") },
    { key: "intermediate", icon: "📗", color: "from-blue-400 to-cyan-600", bg: "from-blue-50 to-cyan-50", border: "border-blue-200", label: t("Gevorderd", "Intermediate"), desc: t("Uitgebreidere woordenschat", "Expanded vocabulary") },
    { key: "advanced", icon: "🔥", color: "from-orange-400 to-red-600", bg: "from-orange-50 to-red-50", border: "border-orange-200", label: t("Geavanceerd", "Advanced"), desc: t("Complexe en abstracte woorden", "Complex and abstract words") },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📖 {t("Woordenschat", "Vocabulary")}</h1>
          <p className="text-gray-500">{t("Blader door de woordenlijsten of oefen je woordenschat", "Browse the word lists or practise your vocabulary")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {levels.map(level => (
            <div key={level.key} onClick={() => router.push(`/vocabulary/${level.key}`)}
              className={`bg-gradient-to-br ${level.bg} border ${level.border} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{level.icon}</div>
              <div className={`w-12 h-1 bg-gradient-to-r ${level.color} rounded-full mb-4`} />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{level.label}</h2>
              <p className="text-gray-600 text-sm mb-4">{level.desc}</p>
              <p className="text-xs text-gray-400">{wordCounts[level.key as keyof WordCount]} {t("woorden", "words")}</p>
              <div className={`mt-4 text-sm font-medium bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                {t("Bekijk lijst", "View list")} →
              </div>
            </div>
          ))}
        </div>

        <div onClick={() => router.push("/vocabulary/exercise")}
          className="bg-white rounded-3xl shadow-xl p-10 text-center cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group border-2 border-emerald-100">
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("Woordenschat Oefenen", "Vocabulary Exercise")}</h2>
          <p className="text-gray-600 mb-6">{t("Oefen de woorden met meerkeuze- en invulvragen. Je ziet aan het einde een volledig overzicht.", "Practise words with multiple choice and fill-in questions. You'll get a full results summary at the end.")}</p>
          <div className="inline-block bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg">
            {t("Start oefening", "Start exercise")} →
          </div>
        </div>
      </div>
    </main>
  )
}
