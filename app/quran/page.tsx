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
        setError(t("Kon Quran data niet laden.", "Could not load Quran data."))
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
    <main className="luxe-bg flex items-center justify-center">
      <p className="font-display text-xl" style={{ color: '#d4af37' }}>{t("Bezig met laden...", "Loading...")}</p>
    </main>
  )

  const overallPct = Math.round((completedCount / Math.max(surahs.length, 1)) * 100)

  return (
    <main className="luxe-bg">
      <div className="luxe-content max-w-6xl mx-auto px-6 lg:px-10 py-16">

        <div className="mb-16 reveal">
          <p className="eyebrow mb-4">{t("De heilige tekst", "The sacred text")}</p>
          <h1 className="font-display font-light mb-3" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            <span className="italic gold-shimmer">{t("Quran", "Quran")}</span>
          </h1>
          <p className="text-lg" style={{ color: 'rgba(245,236,215,0.6)', fontFamily: 'Cormorant Garamond' }}>
            {t("Lezen, luisteren & begrijpen", "Reading, listening & understanding")}
          </p>
        </div>

        {/* Stats panel */}
        <div className="glass-card rounded-lg p-10 mb-10 reveal" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div>
              <div className="font-display text-5xl" style={{ color: '#d4af37' }}>{completedCount}</div>
              <div className="eyebrow mt-2" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Voltooid", "Completed")}</div>
            </div>
            <div>
              <div className="font-display text-5xl" style={{ color: '#f5ecd7' }}>{surahs.length - completedCount}</div>
              <div className="eyebrow mt-2" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Te doen", "Remaining")}</div>
            </div>
            <div>
              <div className="font-display text-5xl" style={{ color: '#14a373' }}>{surahs.length}</div>
              <div className="eyebrow mt-2" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Totaal", "Total")}</div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-3xl" style={{ color: '#d4af37' }}>{overallPct}%</span>
                <span className="eyebrow" style={{ color: 'rgba(245,236,215,0.5)' }}>{t("Voortgang", "Progress")}</span>
              </div>
              <div className="luxe-bar">
                <div className="luxe-bar-fill" style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="glass-card-sm rounded p-4 mb-6" style={{ borderColor: 'rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.05)' }}>
            <p className="text-sm" style={{ color: '#e74c3c' }}>{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input type="text" placeholder={t("Zoek soera...", "Search surah...")} value={search}
            onChange={e => setSearch(e.target.value)}
            className="luxe-input flex-1 px-5 py-3 rounded text-sm" />
          <div className="flex gap-2">
            {(["all", "completed", "incomplete"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={filter === f ? "btn-gold px-5 py-3 rounded text-sm" : "btn-ghost px-5 py-3 rounded text-sm"}>
                {f === "all" ? t("Alle", "All") : f === "completed" ? `✓ ${t("Voltooid", "Done")}` : `○ ${t("Bezig", "Pending")}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((surah, i) => {
            const prog = getSurahProgress(surah.number)
            return (
              <div key={surah.number} onClick={() => router.push(`/quran/${surah.number}`)}
                className="glass-card-sm rounded-lg p-5 cursor-pointer transition-all hover:border-yellow-500/40 reveal"
                style={{ animationDelay: `${Math.min(i * 0.015, 0.5)}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-display" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
                      {surah.number}
                    </div>
                  </div>
                  <div className="arabic-display text-2xl text-right" dir="rtl">{surah.name}</div>
                </div>
                <h3 className="font-display text-xl mb-1" style={{ color: '#f5ecd7' }}>{surah.englishName}</h3>
                <p className="text-xs italic mb-3" style={{ color: 'rgba(245,236,215,0.5)', fontFamily: 'Cormorant Garamond' }}>
                  {surah.englishNameTranslation}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(245,236,215,0.4)' }}>
                    {surah.numberOfAyahs} {t("ayahs", "ayahs")} · {surah.revelationType}
                  </span>
                  {prog?.completed && <span className="eyebrow text-xs" style={{ color: '#14a373' }}>✓ {prog.score}%</span>}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4" style={{ color: 'rgba(212,175,55,0.4)' }}>⟢</div>
            <p className="font-display text-lg" style={{ color: 'rgba(245,236,215,0.5)' }}>
              {t("Geen soera's gevonden", "No surahs found")}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
