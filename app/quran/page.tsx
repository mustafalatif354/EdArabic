"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { supabase } from "@/lib/supabaseClient"

interface Surah { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: string }
interface QuranProgress { surah_id: number; completed: boolean; score: number }

export default function QuranPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()

  const [surahs, setSurahs] = useState<Surah[]>([])
  const [progress, setProgress] = useState<QuranProgress[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all")

  useEffect(() => {
    if (!user) return
    async function loadData() {
      try {
        const res = await fetch("https://api.alquran.cloud/v1/surah")
        if (!res.ok) throw new Error("Failed")
        const json = await res.json()
        setSurahs(json.data)
        const { data: prog } = await supabase.from("quran_progress").select("surah_id, completed, score").eq("user_id", user!.id)
        setProgress(prog || [])
      } catch {
        setError(t("Kon Quran data niet laden. Controleer je internetverbinding.", "Could not load Quran data. Check your internet connection."))
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [user])

  const getSurahProgress = (surahId: number) => progress.find(p => p.surah_id === surahId) ?? null
  const completedCount = progress.filter(p => p.completed).length

  const filtered = surahs.filter(s => {
    const match = s.englishName.toLowerCase().includes(search.toLowerCase()) || s.name.includes(search) || s.number.toString().includes(search)
    const prog = getSurahProgress(s.number)
    if (filter === "completed") return match && !!prog?.completed
    if (filter === "incomplete") return match && !prog?.completed
    return match
  })

  if (authLoading || dataLoading) return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <p className="text-gray-600">{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📗 Quran</h1>
          <p className="text-gray-500">{t("Lezen, luisteren & begrijpen", "Reading, listening & understanding")}</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{completedCount}</div>
            <div className="text-sm text-gray-500">{t("Soera's voltooid", "Surahs completed")}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{surahs.length - completedCount}</div>
            <div className="text-sm text-gray-500">{t("Nog te doen", "Remaining")}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{surahs.length}</div>
            <div className="text-sm text-gray-500">{t("Totaal soera's", "Total surahs")}</div>
          </div>
          <div className="flex-1 max-w-xs w-full">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{t("Voortgang", "Progress")}</span>
              <span>{Math.round((completedCount / Math.max(surahs.length, 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all"
                style={{ width: `${(completedCount / Math.max(surahs.length, 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input type="text" placeholder={t("Zoek soera...", "Search surah...")} value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <div className="flex gap-2">
            {(["all", "completed", "incomplete"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition border ${filter === f ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"}`}>
                {f === "all" ? t("Alle", "All") : f === "completed" ? `✓ ${t("Voltooid", "Completed")}` : `○ ${t("Bezig", "In progress")}`}
              </button>
            ))}
          </div>
        </div>

        {/* Surah grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(surah => {
            const prog = getSurahProgress(surah.number)
            return (
              <div key={surah.number} onClick={() => router.push(`/quran/${surah.number}`)}
                className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border border-transparent hover:border-emerald-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">{surah.number}</div>
                  <div className="text-2xl font-bold text-gray-800 text-right" dir="rtl">{surah.name}</div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{surah.englishName}</h3>
                <p className="text-sm text-gray-400 mb-2">{surah.englishNameTranslation}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{surah.numberOfAyahs} {t("ayahs", "ayahs")} · {surah.revelationType}</span>
                  {prog?.completed && <span className="text-emerald-600 font-medium">✓ {prog.score}%</span>}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p>{t("Geen soera's gevonden", "No surahs found")}</p>
          </div>
        )}
      </div>
    </main>
  )
}
