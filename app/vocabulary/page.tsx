"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { supabase } from "@/lib/supabaseClient"

interface WordCount {
  beginner: number
  intermediate: number
  advanced: number
}

const levels = [
  {
    key: "beginner",
    label_nl: "Beginner",
    label_en: "Beginner",
    icon: "🌱",
    color: "from-green-400 to-emerald-600",
    bg: "from-green-50 to-emerald-50",
    border: "border-green-200",
    description_nl: "Veelgebruikte dagelijkse woorden",
    description_en: "Common everyday words",
    difficulty: 1,
  },
  {
    key: "intermediate",
    label_nl: "Gevorderd",
    label_en: "Intermediate",
    icon: "📗",
    color: "from-blue-400 to-cyan-600",
    bg: "from-blue-50 to-cyan-50",
    border: "border-blue-200",
    description_nl: "Uitgebreidere woordenschat",
    description_en: "Expanded vocabulary",
    difficulty: 2,
  },
  {
    key: "advanced",
    label_nl: "Geavanceerd",
    label_en: "Advanced",
    icon: "🔥",
    color: "from-orange-400 to-red-600",
    bg: "from-orange-50 to-red-50",
    border: "border-orange-200",
    description_nl: "Complexe en abstracte woorden",
    description_en: "Complex and abstract words",
    difficulty: 3,
  },
]

export default function VocabularyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [wordCounts, setWordCounts] = useState<WordCount>({ beginner: 0, intermediate: 0, advanced: 0 })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function loadCounts() {
      const { data } = await supabase
        .from("words")
        .select("difficulty")

      if (data) {
        setWordCounts({
          beginner:     data.filter(w => w.difficulty === 1).length,
          intermediate: data.filter(w => w.difficulty === 2).length,
          advanced:     data.filter(w => w.difficulty === 3).length,
        })
      }
      setDataLoading(false)
    }

    loadCounts()
  }, [user])

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p className="text-gray-600">Bezig met laden...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              onClick={() => router.push("/home")}
              className="flex items-center text-emerald-600 hover:text-emerald-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">📖 Woordenschat</h1>
              <p className="text-sm text-gray-400">Vocabulary</p>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Intro */}
        <div className="text-center mb-10">
          <p className="text-gray-600 text-lg">
            Blader door de woordenlijsten of oefen je woordenschat. /
            Browse the word lists or practise your vocabulary.
          </p>
        </div>

        {/* Level cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {levels.map((level) => (
            <div
              key={level.key}
              className={`bg-gradient-to-br ${level.bg} border ${level.border} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
              onClick={() => router.push(`/vocabulary/${level.key}`)}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {level.icon}
              </div>
              <div className={`w-12 h-1 bg-gradient-to-r ${level.color} rounded-full mb-4`} />
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{level.label_nl}</h2>
              <p className="text-sm text-gray-400 mb-3">{level.label_en}</p>
              <p className="text-gray-600 text-sm mb-4">{level.description_nl}</p>
              <p className="text-xs text-gray-400">
                {wordCounts[level.key as keyof WordCount]} woorden / words
              </p>
              <div className={`mt-4 text-sm font-medium bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                Bekijk lijst → / View list →
              </div>
            </div>
          ))}
        </div>

        {/* Exercise CTA */}
        <div
          className="bg-white rounded-3xl shadow-xl p-10 text-center cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group border-2 border-emerald-100"
          onClick={() => router.push("/vocabulary/exercise")}
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">🧠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Woordenschat Oefenen</h2>
          <p className="text-gray-400 text-sm mb-3">Vocabulary Exercise</p>
          <p className="text-gray-600 mb-6">
            Oefen de woorden met meerkeuze- en invulvragen. Je ziet aan het einde een volledig overzicht van je resultaten. /
            Practise words with multiple choice and fill-in questions. You'll get a full results summary at the end.
          </p>
          <div className="inline-block bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-blue-600 transition">
            Start oefening / Start exercise →
          </div>
        </div>
      </div>
    </main>
  )
}
