"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { ProgressManager } from "@/lib/progress"
import { LevelingSystem, UserLevelData } from "@/lib/leveling"
import InstallPWA from "@/components/InstallPWA"

const sections = [
  {
    href: "/alphabet",
    icon: "🔤",
    color: "from-emerald-400 to-emerald-600",
    bg: "from-emerald-50 to-emerald-100",
    border: "border-emerald-200",
    title_nl: "Arabisch Alfabet",
    title_en: "Arabic Alphabet",
    desc_nl: "Leer alle 28 letters met audio en oefeningen",
    desc_en: "Learn all 28 letters with audio and exercises",
  },
  {
    href: "/vocabulary",
    icon: "📖",
    color: "from-blue-400 to-blue-600",
    bg: "from-blue-50 to-blue-100",
    border: "border-blue-200",
    title_nl: "Woordenschat",
    title_en: "Vocabulary",
    desc_nl: "Beginner, gevorderd en geavanceerde woorden",
    desc_en: "Beginner, intermediate and advanced words",
  },
  {
    href: "/quran",
    icon: "📗",
    color: "from-purple-400 to-purple-600",
    bg: "from-purple-50 to-purple-100",
    border: "border-purple-200",
    title_nl: "Quran",
    title_en: "Quran",
    desc_nl: "Lees, luister en begrijp de Quran",
    desc_en: "Read, listen and understand the Quran",
  },
  {
    href: "/exercises/letters",
    icon: "✏️",
    color: "from-pink-400 to-pink-600",
    bg: "from-pink-50 to-pink-100",
    border: "border-pink-200",
    title_nl: "Letter Oefeningen",
    title_en: "Letter Exercises",
    desc_nl: "Oefen individuele letters los van de lessen",
    desc_en: "Practise individual letters outside of lessons",
  },
]

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [userProfile, setUserProfile] = useState<any>(null)
  const [userLevelData, setUserLevelData] = useState<UserLevelData | null>(null)
  const [progressStats, setProgressStats] = useState({ completedLessons: 0, totalLessons: 8, overallProgress: 0 })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function loadData() {
      const [profile, progress, levelData] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", user!.id).single(),
        ProgressManager.getUserProgress(),
        LevelingSystem.getUserLevelData(),
      ])

      setUserProfile(profile.data)
      setProgressStats(ProgressManager.calculateProgressStats(progress))
      setUserLevelData(levelData)
      setDataLoading(false)
    }

    loadData()
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welkom terug, {userProfile?.username || user?.email?.split("@")[0]} 👋
          </h1>
          <p className="text-gray-500">Welcome back — wat ga je vandaag leren? / What will you learn today?</p>
        </div>

        {/* XP / Level card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-center gap-8">

            {/* Level */}
            <div className="text-center shrink-0">
              <div className="text-5xl font-bold text-emerald-600 mb-1">
                {userLevelData?.level ?? 1}
              </div>
              <div className="text-sm text-gray-500">Level</div>
            </div>

            <div className="hidden sm:block w-px h-16 bg-gray-200" />

            {/* Total XP */}
            <div className="text-center shrink-0">
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {userLevelData?.xp ?? 0}
              </div>
              <div className="text-sm text-gray-500">Totaal XP</div>
            </div>

            <div className="hidden sm:block w-px h-16 bg-gray-200" />

            {/* XP progress bar */}
            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Naar Level {(userLevelData?.level ?? 1) + 1} / To Level {(userLevelData?.level ?? 1) + 1}</span>
                <span>
                  {userLevelData?.xpProgress ?? 0} / {userLevelData ? (userLevelData.xpForNextLevel - LevelingSystem.getXPForLevel(userLevelData.level)) : 15} XP
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-700"
                  style={{ width: `${userLevelData?.progressPercentage ?? 0}%` }}
                />
              </div>
            </div>

            <div className="hidden sm:block w-px h-16 bg-gray-200" />

            {/* Lessons completed */}
            <div className="text-center shrink-0">
              <div className="text-4xl font-bold text-purple-600 mb-1">
                {progressStats.completedLessons}/{progressStats.totalLessons}
              </div>
              <div className="text-sm text-gray-500">Lessen voltooid / Lessons done</div>
            </div>
          </div>
        </div>

        {/* Section cards */}
        <h2 className="text-xl font-bold text-gray-700 mb-5">Waar wil je mee beginnen? / Where do you want to start?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sections.map(section => (
            <div
              key={section.href}
              onClick={() => router.push(section.href)}
              className={`bg-gradient-to-br ${section.bg} border ${section.border} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {section.icon}
              </div>
              <div className={`w-12 h-1 bg-gradient-to-r ${section.color} rounded-full mb-4`} />
              <h3 className="text-xl font-bold text-gray-900 mb-1">{section.title_nl}</h3>
              <p className="text-sm text-gray-400 mb-2">{section.title_en}</p>
              <p className="text-gray-600 text-sm">{section.desc_nl}</p>
            </div>
          ))}
        </div>
      </div>

      <InstallPWA />
    </main>
  )
}
