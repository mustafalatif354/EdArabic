"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { useLanguage } from "@/lib/LanguageContext"
import { supabase } from "@/lib/supabaseClient"
import { ProgressManager } from "@/lib/progress"
import { LevelingSystem, UserLevelData } from "@/lib/leveling"
import InstallPWA from "@/components/InstallPWA"

const ARABIC_BG = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط']

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap');

  .font-display { font-family: 'Cormorant Garamond', serif; }
  .font-arabic  { font-family: 'Amiri', serif; }

  .dashboard-bg {
    background: #0a0a0f;
    position: relative;
    min-height: 100vh;
  }

  .dashboard-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(circle at 15% 20%, rgba(212,175,55,0.08) 0%, transparent 40%),
      radial-gradient(circle at 85% 60%, rgba(13,107,71,0.08) 0%, transparent 45%),
      radial-gradient(circle at 50% 95%, rgba(212,175,55,0.05) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  .dashboard-bg::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.83 0 0 0 0 0.69 0 0 0 0 0.22 0 0 0 0.25 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.03;
    mix-blend-mode: overlay;
    pointer-events: none;
    z-index: 1;
  }

  .floating-letter-bg {
    position: absolute;
    color: rgba(212, 175, 55, 0.06);
    font-family: 'Amiri', serif;
    font-weight: 700;
    pointer-events: none;
    user-select: none;
    animation: floatBg 25s ease-in-out infinite;
  }
  @keyframes floatBg {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-30px) rotate(8deg); }
  }

  .gold-shimmer {
    background: linear-gradient(100deg, #d4af37 0%, #f5ecd7 20%, #d4af37 40%, #b8941f 60%, #d4af37 80%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 6s linear infinite;
  }
  @keyframes shimmer {
    to { background-position: 200% center; }
  }

  .glass-card {
    background: linear-gradient(145deg, rgba(31,31,46,0.85), rgba(20,20,28,0.7));
    border: 1px solid rgba(212, 175, 55, 0.2);
    box-shadow:
      0 25px 60px -15px rgba(0,0,0,0.8),
      inset 0 1px 0 0 rgba(212,175,55,0.15);
    backdrop-filter: blur(20px);
    position: relative;
    overflow: hidden;
  }

  .glass-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, transparent 40%, rgba(212,175,55,0.15) 50%, transparent 60%);
    opacity: 0;
    transition: opacity 0.6s;
    pointer-events: none;
  }
  .glass-card:hover::before { opacity: 1; }

  .scene-3d { perspective: 1200px; }

  .section-card {
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s;
    cursor: pointer;
  }
  .section-card:hover {
    transform: rotateX(4deg) rotateY(-4deg) translateZ(20px);
    box-shadow:
      0 40px 80px -20px rgba(0,0,0,0.9),
      0 0 60px -10px rgba(212,175,55,0.25),
      inset 0 1px 0 0 rgba(212,175,55,0.3);
  }

  .card-icon-orb {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 30% 30%, rgba(212,175,55,0.3), rgba(212,175,55,0.05));
    border: 1px solid rgba(212,175,55,0.3);
    transform: rotate(45deg);
    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .card-icon-orb > * { transform: rotate(-45deg); }
  .section-card:hover .card-icon-orb {
    transform: rotate(90deg) scale(1.1);
    box-shadow: 0 0 30px rgba(212,175,55,0.4);
  }
  .section-card:hover .card-icon-orb > * {
    transform: rotate(-90deg);
  }

  .xp-bar {
    height: 6px;
    background: rgba(212,175,55,0.1);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }
  .xp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #b8941f, #d4af37, #f5ecd7, #d4af37);
    background-size: 200% 100%;
    box-shadow: 0 0 10px rgba(212,175,55,0.5);
    animation: shimmer 3s linear infinite;
    transition: width 1s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .stat-counter {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
  }

  .ornament {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ornament::before,
  .ornament::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent);
  }
  .ornament-dot {
    width: 8px; height: 8px;
    transform: rotate(45deg);
    background: #d4af37;
    box-shadow: 0 0 12px rgba(212,175,55,0.7);
  }

  .reveal {
    opacity: 0;
    transform: translateY(30px);
    animation: revealUp 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  }
  @keyframes revealUp {
    to { opacity: 1; transform: translateY(0); }
  }

  .level-badge {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    transform-style: preserve-3d;
    animation: slowRotate 30s linear infinite;
  }
  @keyframes slowRotate {
    from { transform: rotateY(0deg); }
    to   { transform: rotateY(360deg); }
  }
  .level-badge::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px solid rgba(212,175,55,0.4);
    transform: rotate(45deg);
    box-shadow: 0 0 30px rgba(212,175,55,0.3);
  }
  .level-badge::after {
    content: '';
    position: absolute;
    inset: 10px;
    border: 1px solid rgba(212,175,55,0.2);
    transform: rotate(45deg);
  }
`

interface Section {
  href: string
  glyph: string
  title: string
  subtitle: string
  desc: string
  accent: string
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()

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
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p className="font-display text-xl" style={{ color: '#d4af37' }}>
          {t("Bezig met laden...", "Loading...")}
        </p>
      </main>
    )
  }

  const sections: Section[] = [
    {
      href: "/alphabet",
      glyph: "أ",
      title: t("Alfabet", "Alphabet"),
      subtitle: t("28 letters", "28 letters"),
      desc: t("Leer elke letter met audio en oefeningen", "Learn each letter with audio and exercises"),
      accent: "#d4af37",
    },
    {
      href: "/vocabulary",
      glyph: "ك",
      title: t("Woordenschat", "Vocabulary"),
      subtitle: t("240+ woorden", "240+ words"),
      desc: t("Beginner, gevorderd en geavanceerd niveau", "Beginner, intermediate, and advanced levels"),
      accent: "#14a373",
    },
    {
      href: "/quran",
      glyph: "ق",
      title: "Quran",
      subtitle: t("114 soera's", "114 surahs"),
      desc: t("Lees, luister en begrijp de heilige tekst", "Read, listen, and understand the sacred text"),
      accent: "#d4af37",
    },
    {
      href: "/exercises/letters",
      glyph: "ع",
      title: t("Oefeningen", "Exercises"),
      subtitle: t("Vrije oefening", "Free practice"),
      desc: t("Oefen individuele letters op je eigen tempo", "Practise individual letters at your own pace"),
      accent: "#14a373",
    },
  ]

  const name = userProfile?.username || user?.email?.split("@")[0]
  const level = userLevelData?.level ?? 1
  const xp = userLevelData?.xp ?? 0
  const xpToNext = userLevelData ? (userLevelData.xpForNextLevel - LevelingSystem.getXPForLevel(level)) : 15
  const xpProgress = userLevelData?.xpProgress ?? 0
  const progressPct = userLevelData?.progressPercentage ?? 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <main className="dashboard-bg" style={{ color: '#f5ecd7' }}>

        {/* Floating letters in background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
          {ARABIC_BG.map((letter, i) => (
            <span
              key={i}
              className="floating-letter-bg"
              style={{
                left:   `${(i * 8.5) % 95}%`,
                top:    `${(i * 11.3) % 90 + 5}%`,
                fontSize: `${3 + (i % 4)}rem`,
                animationDelay: `${i * 1.7}s`,
                animationDuration: `${22 + (i % 6)}s`,
              }}
            >{letter}</span>
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-12" style={{ zIndex: 10 }}>

          {/* Welcome header */}
          <div className="mb-16 reveal">
            <p className="text-xs tracking-[0.4em] mb-4 uppercase" style={{ color: '#d4af37' }}>
              {t("Welkom terug", "Welcome back")}
            </p>
            <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              {name} <span className="italic" style={{ color: 'rgba(245,236,215,0.6)' }}>—</span>{' '}
              <span className="italic gold-shimmer">
                {t("zet je reis voort", "continue your journey")}
              </span>
            </h1>
            <div className="ornament" style={{ maxWidth: 300 }}>
              <span className="ornament-dot" />
            </div>
          </div>

          {/* Level / XP Panel */}
          <div className="glass-card rounded-lg p-10 mb-16 reveal" style={{ animationDelay: '0.15s' }}>
            <div className="grid md:grid-cols-[auto_1fr_auto] gap-10 items-center">

              {/* Rotating level badge */}
              <div className="flex flex-col items-center">
                <div className="scene-3d">
                  <div className="level-badge">
                    <div className="relative z-10 text-center">
                      <div className="text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(212,175,55,0.7)' }}>Level</div>
                      <div className="stat-counter text-5xl" style={{ color: '#d4af37', lineHeight: 1 }}>{level}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* XP progress */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="stat-counter text-5xl" style={{ color: '#d4af37' }}>{xp}</span>
                    <span className="text-sm tracking-widest uppercase ml-3" style={{ color: 'rgba(245,236,215,0.5)' }}>
                      {t("Totaal XP", "Total XP")}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(245,236,215,0.5)' }}>
                    {xpProgress} / {xpToNext}
                  </div>
                </div>

                <div className="xp-bar mb-3">
                  <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>

                <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(245,236,215,0.4)' }}>
                  {t("Naar level", "To level")} {level + 1}
                </p>
              </div>

              {/* Lessons stat */}
              <div className="text-center md:text-right">
                <div className="stat-counter text-6xl" style={{ color: '#d4af37' }}>
                  {progressStats.completedLessons}
                  <span style={{ color: 'rgba(245,236,215,0.3)' }}>/{progressStats.totalLessons}</span>
                </div>
                <div className="text-xs tracking-[0.3em] uppercase mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>
                  {t("Lessen voltooid", "Lessons completed")}
                </div>
              </div>
            </div>
          </div>

          {/* Section heading */}
          <div className="mb-10 reveal" style={{ animationDelay: '0.3s' }}>
            <p className="text-xs tracking-[0.4em] mb-3 uppercase" style={{ color: '#d4af37' }}>
              {t("Jouw studie", "Your study")}
            </p>
            <h2 className="font-display font-light" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}>
              {t("Waar wil je verder gaan?", "Where would you like to continue?")}
            </h2>
          </div>

          {/* Section cards */}
          <div className="scene-3d grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {sections.map((section, i) => (
              <div
                key={section.href}
                onClick={() => router.push(section.href)}
                className="section-card glass-card rounded-lg p-8 reveal"
                style={{ animationDelay: `${0.4 + i * 0.08}s` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="card-icon-orb">
                    <span className="font-arabic text-3xl" style={{ color: section.accent, textShadow: `0 0 20px ${section.accent}60` }}>
                      {section.glyph}
                    </span>
                  </div>
                  <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
                    {section.subtitle}
                  </span>
                </div>

                <h3 className="font-display text-3xl mb-3" style={{ color: '#f5ecd7' }}>
                  {section.title}
                </h3>

                <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(245,236,215,0.6)' }}>
                  {section.desc}
                </p>

                <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase" style={{ color: '#d4af37' }}>
                  <span>{t("Open", "Open")}</span>
                  <span style={{ fontSize: '1.2em' }}>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quote / tagline footer */}
          <div className="text-center py-16 reveal" style={{ animationDelay: '0.8s' }}>
            <div className="ornament mx-auto mb-6" style={{ maxWidth: 200 }}>
              <span className="ornament-dot" />
            </div>
            <p className="font-display italic text-xl" style={{ color: 'rgba(245,236,215,0.5)' }}>
              {t(
                '"Wie een taal leert, wint een ziel"',
                '"He who learns a language, gains a soul"'
              )}
            </p>
          </div>

        </div>

        <InstallPWA />
      </main>
    </>
  )
}
