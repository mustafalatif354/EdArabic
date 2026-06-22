"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ProgressManager, ProgressData } from "@/lib/progress"

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

  .lesson-card {
    transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s;
    cursor: pointer;
  }
  .lesson-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 40px 80px -20px rgba(0,0,0,0.9),
      0 0 60px -10px rgba(212,175,55,0.2),
      inset 0 1px 0 0 rgba(212,175,55,0.3);
  }
  .lesson-card.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .lesson-card.locked:hover {
    transform: none;
    box-shadow:
      0 25px 60px -15px rgba(0,0,0,0.8),
      inset 0 1px 0 0 rgba(212,175,55,0.15);
  }

  .letter-chip {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(212,175,55,0.25);
    background: rgba(212,175,55,0.07);
    font-family: 'Amiri', serif;
    font-size: 1.3rem;
    color: #d4af37;
    transition: border-radius 0.4s cubic-bezier(0.23, 1, 0.32, 1), background 0.4s, box-shadow 0.4s;
  }
  .lesson-card:hover .letter-chip {
    border-radius: 50px;
    background: rgba(212,175,55,0.15);
    box-shadow: 0 0 12px rgba(212,175,55,0.25);
  }
  .letter-chip.completed {
    border-color: rgba(20,163,115,0.4);
    background: rgba(20,163,115,0.1);
    color: #14a373;
  }

  .xp-bar {
    height: 4px;
    background: rgba(212,175,55,0.1);
    border-radius: 3px;
    overflow: hidden;
  }
  .xp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #b8941f, #d4af37, #f5ecd7, #d4af37);
    background-size: 200% 100%;
    box-shadow: 0 0 10px rgba(212,175,55,0.5);
    animation: shimmer 3s linear infinite;
    transition: width 1s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .xp-bar-fill.completed {
    background: linear-gradient(90deg, #0d6b47, #14a373, #0d6b47);
    box-shadow: 0 0 10px rgba(20,163,115,0.5);
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

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .status-badge.completed {
    background: rgba(20,163,115,0.15);
    border: 1px solid rgba(20,163,115,0.35);
    color: #14a373;
  }
  .status-badge.available {
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.3);
    color: #d4af37;
  }
  .status-badge.locked {
    background: rgba(245,236,215,0.05);
    border: 1px solid rgba(245,236,215,0.1);
    color: rgba(245,236,215,0.3);
  }

  .action-btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    transition: all 0.3s;
    border: 1px solid;
    cursor: pointer;
  }
  .action-btn.available {
    background: transparent;
    border-color: rgba(212,175,55,0.5);
    color: #d4af37;
  }
  .action-btn.available:hover {
    background: rgba(212,175,55,0.1);
    border-color: #d4af37;
    box-shadow: 0 0 20px rgba(212,175,55,0.2);
  }
  .action-btn.completed {
    background: transparent;
    border-color: rgba(20,163,115,0.5);
    color: #14a373;
  }
  .action-btn.completed:hover {
    background: rgba(20,163,115,0.1);
    border-color: #14a373;
    box-shadow: 0 0 20px rgba(20,163,115,0.2);
  }
  .action-btn.disabled {
    background: transparent;
    border-color: rgba(245,236,215,0.1);
    color: rgba(245,236,215,0.2);
    cursor: not-allowed;
  }
`

export default function LettersExercisePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<ProgressData[]>([])

  const getLessonProgress = (lessonId: number) => {
    if (!userProgress) return { completed: false, progress: 0 }
    const progress = userProgress.find((p: any) => p.lesson_id === lessonId)
    return progress ? { completed: progress.completed, progress: progress.completed ? 100 : 0 } : { completed: false, progress: 0 }
  }

  const lessons = [
    { id: 1, title: "Les 1: Arabisch Alfabet — Basis",        description: "Leer de eerste vier letters van het Arabische alfabet", letters: ["ا", "ب", "ت", "ث"], ...getLessonProgress(1) },
    { id: 2, title: "Les 2: Meer Letters",                    description: "Uitbreiding van het Arabische alfabet",                  letters: ["ج", "ح", "خ", "د"], ...getLessonProgress(2) },
    { id: 3, title: "Les 3: Geavanceerde Letters",            description: "Complexere Arabische letters leren",                     letters: ["ذ", "ر", "ز", "س"], ...getLessonProgress(3) },
    { id: 4, title: "Les 4: Nieuwe Vormen",                   description: "Leer meer Arabische lettervormen",                       letters: ["ش", "ص", "ض", "ط"], ...getLessonProgress(4) },
    { id: 5, title: "Les 5: Uitbreiding",                     description: "Meer letters van het Arabische alfabet",                 letters: ["ظ", "ع", "غ", "ف"], ...getLessonProgress(5) },
    { id: 6, title: "Les 6: Verder Leren",                    description: "Nog meer Arabische letters",                             letters: ["ق", "ك", "ل", "م"], ...getLessonProgress(6) },
    { id: 7, title: "Les 7: Bijna Klaar",                     description: "De laatste letters van het alfabet",                     letters: ["ن", "ه", "و", "ي"], ...getLessonProgress(7) },
    { id: 8, title: "Les 8: Complete Alfabet",                description: "Alle 28 letters van het Arabische alfabet",              letters: [],                    ...getLessonProgress(8) },
  ]

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        const progress = await ProgressManager.getUserProgress()
        setUserProgress(progress)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const navigateToLesson = (lessonId: number) => {
    if (ProgressManager.isLessonUnlocked(lessonId, userProgress)) {
      router.push(`/lessons/${lessonId}`)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p className="font-display text-xl" style={{ color: '#d4af37' }}>Bezig met laden...</p>
      </main>
    )
  }

  const completedCount = lessons.filter(l => l.completed).length

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <main className="dashboard-bg" style={{ color: '#f5ecd7' }}>

        {/* Floating letters */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
          {ARABIC_BG.map((letter, i) => (
            <span
              key={i}
              className="floating-letter-bg"
              style={{
                left: `${(i * 8.5) % 95}%`,
                top:  `${(i * 11.3) % 90 + 5}%`,
                fontSize: `${3 + (i % 4)}rem`,
                animationDelay: `${i * 1.7}s`,
                animationDuration: `${22 + (i % 6)}s`,
              }}
            >{letter}</span>
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-6 lg:px-10 py-12" style={{ zIndex: 10 }}>

          {/* Back + header */}
          <div className="mb-12 reveal">
            <button
              onClick={() => router.push('/home')}
              className="text-xs tracking-[0.3em] uppercase mb-8 inline-flex items-center gap-2 transition-colors"
              style={{ color: 'rgba(212,175,55,0.6)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d4af37')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,175,55,0.6)')}
            >
              ← Terug naar Dashboard
            </button>

            <p className="text-xs tracking-[0.4em] mb-4 uppercase" style={{ color: '#d4af37' }}>
              Oefeningen
            </p>
            <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
              Letters leren —{' '}
              <span className="italic gold-shimmer">stap voor stap</span>
            </h1>
            <div className="ornament" style={{ maxWidth: 300 }}>
              <span className="ornament-dot" />
            </div>
          </div>

          {/* Progress summary */}
          <div className="glass-card rounded-lg px-8 py-6 mb-10 reveal" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(245,236,215,0.5)' }}>
                Voortgang
              </span>
              <span className="font-display text-2xl" style={{ color: '#d4af37' }}>
                {completedCount}<span style={{ color: 'rgba(245,236,215,0.3)' }}>/{lessons.length}</span>
              </span>
            </div>
            <div className="xp-bar">
              <div
                className="xp-bar-fill"
                style={{ width: `${(completedCount / lessons.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Lessons */}
          <div className="space-y-4">
            {lessons.map((lesson, i) => {
              const isUnlocked = ProgressManager.isLessonUnlocked(lesson.id, userProgress)
              const isCompleted = lesson.completed

              return (
                <div
                  key={lesson.id}
                  className={`lesson-card glass-card rounded-lg p-6 reveal ${!isUnlocked ? 'locked' : ''}`}
                  style={{ animationDelay: `${0.2 + i * 0.06}s` }}
                  onClick={() => navigateToLesson(lesson.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl mb-1" style={{ color: '#f5ecd7' }}>
                        {lesson.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(245,236,215,0.55)' }}>
                        {lesson.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                      {!isUnlocked ? (
                        <span className="status-badge locked">Vergrendeld</span>
                      ) : isCompleted ? (
                        <span className="status-badge completed">✓ Voltooid</span>
                      ) : (
                        <span className="status-badge available">Beschikbaar</span>
                      )}
                    </div>
                  </div>

                  {lesson.letters.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {lesson.letters.map((letter, idx) => (
                        <div key={idx} className={`letter-chip ${isCompleted ? 'completed' : ''}`}>
                          {letter}
                        </div>
                      ))}
                      <span className="text-xs ml-1" style={{ color: 'rgba(245,236,215,0.3)' }}>
                        {lesson.letters.length} letters
                      </span>
                    </div>
                  )}

                  {isUnlocked && (
                    <div className="mb-4">
                      <div className="xp-bar">
                        <div
                          className={`xp-bar-fill ${isCompleted ? 'completed' : ''}`}
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      className={`action-btn ${!isUnlocked ? 'disabled' : isCompleted ? 'completed' : 'available'}`}
                      disabled={!isUnlocked}
                      onClick={e => { e.stopPropagation(); navigateToLesson(lesson.id) }}
                    >
                      {!isUnlocked ? 'Vergrendeld' : isCompleted ? 'Herhaal' : 'Start Les →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center py-16 reveal" style={{ animationDelay: '0.8s' }}>
            <div className="ornament mx-auto mb-6" style={{ maxWidth: 200 }}>
              <span className="ornament-dot" />
            </div>
            <p className="font-display italic text-xl" style={{ color: 'rgba(245,236,215,0.5)' }}>
              "Wie een taal leert, wint een ziel"
            </p>
          </div>

        </div>
      </main>
    </>
  )
}
