'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'
import Link from 'next/link'

const ARABIC_LETTERS = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي']

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap');

  :root {
    --obsidian: #0a0a0f;
    --obsidian-soft: #14141c;
    --obsidian-light: #1f1f2e;
    --gold: #d4af37;
    --gold-soft: #b8941f;
    --gold-glow: rgba(212, 175, 55, 0.4);
    --emerald-luxe: #0d6b47;
    --emerald-glow: #14a373;
    --cream: #f5ecd7;
  }

  .font-display { font-family: 'Cormorant Garamond', serif; }
  .font-arabic  { font-family: 'Amiri', serif; }

  /* 3D scene */
  .scene-3d {
    perspective: 1500px;
    perspective-origin: 50% 50%;
  }

  /* Rotating letter carousel */
  .carousel-3d {
    transform-style: preserve-3d;
    animation: carouselSpin 40s linear infinite;
  }
  @keyframes carouselSpin {
    from { transform: rotateY(0deg); }
    to   { transform: rotateY(360deg); }
  }
  .carousel-3d:hover { animation-play-state: paused; }

  .carousel-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    backface-visibility: hidden;
    background: linear-gradient(145deg, rgba(212,175,55,0.1), rgba(13,107,71,0.05));
    border: 1px solid rgba(212, 175, 55, 0.25);
    box-shadow: 0 0 40px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(212, 175, 55, 0.08);
    backdrop-filter: blur(8px);
    border-radius: 8px;
  }

  /* Floating background letters */
  .floating-letter {
    position: absolute;
    color: rgba(212, 175, 55, 0.08);
    font-family: 'Amiri', serif;
    font-weight: 700;
    pointer-events: none;
    user-select: none;
    animation: floatLetter 20s ease-in-out infinite;
  }
  @keyframes floatLetter {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%      { transform: translateY(-40px) rotate(-10deg); }
    66%      { transform: translateY(20px) rotate(10deg); }
  }

  /* Gold shimmer text */
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

  /* Card tilt on hover */
  .tilt-card {
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.23, 1, 0.320, 1);
  }
  .tilt-card:hover {
    transform: rotateX(6deg) rotateY(-6deg) translateZ(20px);
  }

  /* Glass panel */
  .glass-panel {
    background: linear-gradient(145deg, rgba(31,31,46,0.85), rgba(20,20,28,0.65));
    border: 1px solid rgba(212, 175, 55, 0.2);
    box-shadow:
      0 25px 60px -15px rgba(0,0,0,0.8),
      inset 0 1px 0 0 rgba(212,175,55,0.15),
      inset 0 0 60px -10px rgba(212,175,55,0.04);
    backdrop-filter: blur(20px);
  }

  /* Noise texture overlay */
  .noise-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.83 0 0 0 0 0.69 0 0 0 0 0.22 0 0 0 0.25 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.035;
    pointer-events: none;
    mix-blend-mode: overlay;
  }

  /* Geometric star pattern */
  .star-pattern {
    background-image:
      radial-gradient(circle at 25% 25%, rgba(212,175,55,0.06) 0%, transparent 40%),
      radial-gradient(circle at 75% 75%, rgba(13,107,71,0.05) 0%, transparent 40%),
      radial-gradient(circle at 50% 50%, transparent 0%, rgba(10,10,15,1) 70%);
  }

  /* Entrance reveals */
  .reveal {
    opacity: 0;
    transform: translateY(40px);
    animation: revealUp 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  }
  @keyframes revealUp {
    to { opacity: 1; transform: translateY(0); }
  }

  /* Gold ornamental divider */
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
    background: linear-gradient(to right, transparent, rgba(212,175,55,0.5), transparent);
  }
  .ornament-dot {
    width: 8px; height: 8px;
    transform: rotate(45deg);
    background: #d4af37;
    box-shadow: 0 0 12px rgba(212,175,55,0.7);
  }

  /* Button shimmer on hover */
  .btn-gold {
    position: relative;
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: #0a0a0f;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 10px 30px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .btn-gold::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    transition: left 0.8s;
  }
  .btn-gold:hover::before { left: 100%; }
  .btn-gold:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(212,175,55,0.5);
  }

  .btn-ghost {
    border: 1px solid rgba(212,175,55,0.4);
    color: #d4af37;
    background: rgba(212,175,55,0.05);
    transition: all 0.4s;
  }
  .btn-ghost:hover {
    background: rgba(212,175,55,0.15);
    border-color: #d4af37;
    box-shadow: 0 0 30px rgba(212,175,55,0.2);
  }

  /* Scroll indicator pulse */
  @keyframes pulseDown {
    0%, 100% { opacity: 0.4; transform: translateY(0); }
    50%      { opacity: 1; transform: translateY(8px); }
  }
  .scroll-indicator { animation: pulseDown 2s ease-in-out infinite; }
`

export default function HomePage() {
  const router = useRouter()
  const { t, lang, toggleLang } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [carouselLetters] = useState(() => ARABIC_LETTERS.slice(0, 8))

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data.user)
    }
    checkAuth()
  }, [])

  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p className="font-display text-xl" style={{ color: '#d4af37' }}>EdArabic</p>
      </main>
    )
  }

  const features = [
    { icon: '◈', title: t('Arabische Alfabet', 'Arabic Alphabet'), desc: t('Alle 28 letters met authentieke uitspraak', 'All 28 letters with authentic pronunciation') },
    { icon: '✦', title: t('Woordenschat', 'Vocabulary'), desc: t('Drie niveaus gebaseerd op CEFR-standaarden', 'Three levels based on CEFR standards') },
    { icon: '❋', title: t('Quran Studie', 'Quran Study'), desc: t('Lees, luister en begrijp de heilige tekst', 'Read, listen, and understand the sacred text') },
    { icon: '◉', title: t('Voortgang Volgen', 'Track Progress'), desc: t('XP, niveaus en dagelijkse statistieken', 'XP, levels, and daily statistics') },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div style={{ background: '#0a0a0f', color: '#f5ecd7', minHeight: '100vh', overflowX: 'hidden' }} className="noise-overlay">

        {/* Floating Arabic letters background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
          {ARABIC_LETTERS.slice(0, 14).map((letter, i) => (
            <span
              key={i}
              className="floating-letter"
              style={{
                left:   `${(i * 7.3) % 95}%`,
                top:    `${(i * 13.7) % 95}%`,
                fontSize: `${4 + (i % 5)}rem`,
                animationDelay: `${i * 1.5}s`,
                animationDuration: `${18 + (i % 8)}s`,
              }}
            >{letter}</span>
          ))}
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50" style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #d4af37, #b8941f)', boxShadow: '0 0 20px rgba(212,175,55,0.5)' }} />
                <span className="font-display text-2xl tracking-wide" style={{ color: '#d4af37' }}>EdArabic</span>
              </Link>

              <div className="flex items-center gap-3">
                <button onClick={toggleLang} className="text-xs tracking-widest px-3 py-2 rounded font-medium transition" style={{ color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}>
                  {lang === 'nl' ? '🇳🇱 NL' : '🇬🇧 EN'}
                </button>
                {isAuthenticated ? (
                  <button onClick={() => router.push('/home')} className="btn-gold px-6 py-2.5 rounded font-medium tracking-wide text-sm">
                    {t('Ga naar Dashboard', 'Go to Dashboard')}
                  </button>
                ) : (
                  <>
                    <Link href="/login" className="text-sm tracking-wide font-medium px-4 py-2" style={{ color: '#f5ecd7' }}>
                      {t('Inloggen', 'Log in')}
                    </Link>
                    <Link href="/login" className="btn-gold px-6 py-2.5 rounded font-medium tracking-wide text-sm">
                      {t('Begin Gratis', 'Start Free')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative min-h-screen flex items-center star-pattern" style={{ paddingTop: '8rem' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">

            {/* Left — text */}
            <div className="reveal" style={{ animationDelay: '0.2s' }}>
              <div className="ornament mb-8" style={{ maxWidth: 240 }}>
                <span className="ornament-dot" />
              </div>

              <p className="text-xs tracking-[0.4em] mb-6 uppercase" style={{ color: '#d4af37' }}>
                {t('Ontdek een tijdloze taal', 'Discover a timeless language')}
              </p>

              <h1 className="font-display font-light leading-[1.05] mb-8" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
                {t('Meester het', 'Master the')}<br />
                <span className="gold-shimmer italic font-normal">
                  {t('Arabische schrift', 'Arabic script')}
                </span>
              </h1>

              <p className="text-lg leading-relaxed mb-10 max-w-xl" style={{ color: 'rgba(245,236,215,0.7)', fontFamily: 'Cormorant Garamond' }}>
                {t(
                  'Van alfabet tot Qur\'an — een elegante, op onderzoek gebaseerde reis door het Arabisch, ontworpen voor de toegewijde leerling.',
                  'From alphabet to Qur\'an — an elegant, research-based journey through Arabic, designed for the dedicated learner.'
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => router.push(isAuthenticated ? '/home' : '/login')} className="btn-gold px-10 py-4 rounded font-medium tracking-wide">
                  {isAuthenticated ? t('Ga naar Dashboard →', 'Go to Dashboard →') : t('Begin je reis →', 'Begin your journey →')}
                </button>
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="btn-ghost px-10 py-4 rounded font-medium tracking-wide">
                  {t('Verken meer', 'Explore more')}
                </button>
              </div>

              {/* Trust bar */}
              <div className="mt-16 grid grid-cols-3 gap-6 max-w-md">
                <div>
                  <div className="font-display text-4xl" style={{ color: '#d4af37' }}>28</div>
                  <div className="text-xs tracking-widest uppercase mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>{t('Letters', 'Letters')}</div>
                </div>
                <div>
                  <div className="font-display text-4xl" style={{ color: '#d4af37' }}>240+</div>
                  <div className="text-xs tracking-widest uppercase mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>{t('Woorden', 'Words')}</div>
                </div>
                <div>
                  <div className="font-display text-4xl" style={{ color: '#d4af37' }}>114</div>
                  <div className="text-xs tracking-widest uppercase mt-1" style={{ color: 'rgba(245,236,215,0.5)' }}>{t('Soera\'s', 'Surahs')}</div>
                </div>
              </div>
            </div>

            {/* Right — 3D rotating carousel */}
            <div className="scene-3d flex items-center justify-center reveal" style={{ height: 500, animationDelay: '0.5s' }}>
              <div className="relative" style={{ width: 280, height: 320 }}>
                <div className="carousel-3d absolute inset-0">
                  {carouselLetters.map((letter, i) => {
                    const angle = (360 / carouselLetters.length) * i
                    return (
                      <div
                        key={i}
                        className="carousel-face"
                        style={{
                          transform: `rotateY(${angle}deg) translateZ(320px)`,
                          width: 280,
                          height: 320,
                        }}
                      >
                        <span className="font-arabic" style={{ fontSize: '12rem', color: '#d4af37', textShadow: '0 0 40px rgba(212,175,55,0.6), 0 0 80px rgba(212,175,55,0.3)' }}>
                          {letter}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Glow underneath */}
                <div className="absolute" style={{
                  bottom: -80, left: '50%', transform: 'translateX(-50%)',
                  width: 400, height: 100,
                  background: 'radial-gradient(ellipse, rgba(212,175,55,0.25) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  pointerEvents: 'none',
                }} />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 scroll-indicator z-10">
            <div className="text-xs tracking-[0.3em] mb-2 text-center" style={{ color: 'rgba(212,175,55,0.6)' }}>
              {t('Scroll', 'Scroll')}
            </div>
            <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(212,175,55,0.6), transparent)', margin: '0 auto' }} />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-20 reveal">
              <p className="text-xs tracking-[0.4em] mb-4 uppercase" style={{ color: '#d4af37' }}>
                {t('Wat je ontdekt', 'What you discover')}
              </p>
              <h2 className="font-display font-light mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
                {t('Een complete', 'A complete')}<br />
                <span className="italic gold-shimmer">{t('leerreis', 'learning journey')}</span>
              </h2>
              <div className="ornament mx-auto" style={{ maxWidth: 300 }}>
                <span className="ornament-dot" />
              </div>
            </div>

            <div className="scene-3d grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <div key={i} className="tilt-card glass-panel p-8 rounded-lg reveal" style={{ animationDelay: `${0.1 * i}s` }}>
                  <div className="font-arabic mb-6" style={{ fontSize: '3rem', color: '#d4af37', textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
                    {f.icon}
                  </div>
                  <h3 className="font-display text-2xl mb-3" style={{ color: '#f5ecd7' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,236,215,0.6)' }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase — Arabic letter grid */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="reveal">
                <p className="text-xs tracking-[0.4em] mb-4 uppercase" style={{ color: '#d4af37' }}>
                  {t('Het alfabet', 'The alphabet')}
                </p>
                <h2 className="font-display font-light mb-8" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
                  {t('Achtentwintig letters.', 'Twenty-eight letters.')}<br />
                  <span className="italic gold-shimmer">{t('Oneindige betekenis.', 'Infinite meaning.')}</span>
                </h2>
                <p className="text-lg mb-8 leading-relaxed" style={{ color: 'rgba(245,236,215,0.7)', fontFamily: 'Cormorant Garamond' }}>
                  {t(
                    'Elk teken draagt duizenden jaren geschiedenis. Leer niet alleen de vormen, maar ook hun ziel — hoe ze samenvloeien tot poëzie, gebed en wijsheid.',
                    'Each character carries thousands of years of history. Learn not just the forms, but their soul — how they flow into poetry, prayer, and wisdom.'
                  )}
                </p>
                <button onClick={() => router.push(isAuthenticated ? '/alphabet' : '/login')} className="btn-ghost px-8 py-3 rounded font-medium tracking-wide">
                  {t('Begin met leren', 'Start learning')} →
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 reveal" style={{ animationDelay: '0.3s' }}>
                {ARABIC_LETTERS.map((letter, i) => (
                  <div
                    key={i}
                    className="glass-panel rounded flex items-center justify-center aspect-square transition-all duration-500 cursor-default"
                    style={{
                      animationDelay: `${i * 30}ms`,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget
                      el.style.transform = 'scale(1.15) rotateY(15deg)'
                      el.style.boxShadow = '0 20px 50px rgba(212,175,55,0.3)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget
                      el.style.transform = 'scale(1)'
                      el.style.boxShadow = ''
                    }}
                  >
                    <span className="font-arabic" style={{ fontSize: '2rem', color: '#d4af37' }}>{letter}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 relative">
          <div className="max-w-4xl mx-auto px-6 text-center reveal">
            <div className="ornament mb-10 mx-auto" style={{ maxWidth: 200 }}>
              <span className="ornament-dot" />
            </div>

            <h2 className="font-display font-light mb-8" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
              {t('Je reis begint', 'Your journey begins')}<br />
              <span className="italic gold-shimmer">{t('met één letter.', 'with a single letter.')}</span>
            </h2>

            <p className="text-xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(245,236,215,0.7)', fontFamily: 'Cormorant Garamond' }}>
              {t(
                'Sluit je aan bij een groeiende gemeenschap die de schoonheid van het Arabisch ontdekt — één letter, één woord, één vers tegelijk.',
                'Join a growing community discovering the beauty of Arabic — one letter, one word, one verse at a time.'
              )}
            </p>

            <button onClick={() => router.push(isAuthenticated ? '/home' : '/login')} className="btn-gold px-14 py-5 rounded font-medium tracking-wider text-lg">
              {isAuthenticated ? t('Ga verder', 'Continue') : t('Begin nu — kosteloos', 'Start now — free')}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div style={{ width: 20, height: 20, transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #d4af37, #b8941f)' }} />
              <span className="font-display text-lg" style={{ color: '#d4af37' }}>EdArabic</span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(245,236,215,0.4)', fontFamily: 'Cormorant Garamond', fontStyle: 'italic' }}>
              {t('Met zorg gemaakt voor de toegewijde leerling', 'Crafted with care for the dedicated learner')}
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
