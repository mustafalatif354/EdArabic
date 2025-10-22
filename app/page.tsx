'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// Add custom styles for 3D effects
const customStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  
  .transform-3d {
    transform-style: preserve-3d;
  }
  
  .rotate-y-12 {
    transform: rotateY(12deg);
  }
  
  .rotate-y-neg-12 {
    transform: rotateY(-12deg);
  }
  
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .floating-animation {
    animation: floating 6s ease-in-out infinite;
  }
  
  @keyframes floating {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    }
    checkAuth();
  }, []);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set up infinite scroll observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.findIndex(ref => ref === entry.target);
            if (index !== -1) {
              setCurrentSection(index);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const addToRefs = useCallback((el: HTMLDivElement | null) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  }, []);

  // Sample lesson data for preview
  const lessonPreviews = [
    {
      id: 1,
      title: "Arabisch Alfabet",
      description: "Leer de eerste letters van het Arabische alfabet: Alif, Ba, en Ta",
      letters: [
        { symbol: 'ا', name: 'Alif', sound: '/sounds/alif.mp3' },
        { symbol: 'ب', name: 'Ba', sound: '/sounds/ba.mp3' },
        { symbol: 'ت', name: 'Ta', sound: '/sounds/ta.mp3' },
      ],
      color: "from-emerald-400 to-emerald-600"
    }
  ];

  const features = [
    {
      icon: "🎵",
      title: "Interactieve Audio",
      description: "Luister naar de juiste uitspraak van elke letter"
    },
    {
      icon: "📚",
      title: "Gestructureerde Lessen",
      description: "Leer stap voor stap het Arabische alfabet"
    },
    {
      icon: "📊",
      title: "Voortgang Tracking",
      description: "Houd je voortgang bij en zie je verbetering"
    },
    {
      icon: "🎯",
      title: "Interactieve Tests",
      description: "Test je kennis met leuke quizzen"
    }
  ];

  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">EdArabic</h1>
          <p>Bezig met laden...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background Elements */}
      <div className="fixed inset-0 -z-10">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-blue-50 to-purple-100 animate-pulse" />
        
        {/* Floating 3D shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full opacity-20 animate-bounce" 
             style={{ animationDuration: '6s', animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-20 animate-bounce" 
             style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full opacity-20 animate-bounce" 
             style={{ animationDuration: '7s', animationDelay: '4s' }} />
        <div className="absolute top-60 right-1/3 w-28 h-28 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full opacity-20 animate-bounce" 
             style={{ animationDuration: '9s', animationDelay: '1s' }} />
        
        {/* Geometric shapes */}
        <div className="absolute top-32 right-10 w-16 h-16 bg-gradient-to-r from-emerald-300 to-blue-300 rotate-45 opacity-30 animate-spin" 
             style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-32 left-10 w-12 h-12 bg-gradient-to-r from-blue-300 to-purple-300 rotate-12 opacity-30 animate-spin" 
             style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-emerald-400 rounded-full opacity-60 animate-ping" 
             style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-ping" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-ping" 
             style={{ animationDelay: '2s' }} />
        
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-5" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '60px 60px'
             }} />
      </div>

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-emerald-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-1 w-full bg-white/90 backdrop-blur-sm shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-emerald-600">EdArabic</h1>
            </div>
            <div className="flex space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push('/home')}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Ga naar Dashboard
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-emerald-600 hover:text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Homepage
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-emerald-600 hover:text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Inloggen
                  </Link>
                  <Link
                    href="/login"
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Registreren
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={addToRefs} className="pt-16 min-h-screen flex items-center justify-center px-4 relative">
        {/* Hero Background Image */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='1200' height='800' viewBox='0 0 1200 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23059669;stop-opacity:0.1'/%3E%3Cstop offset='100%25' style='stop-color:%232563eb;stop-opacity:0.1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23a)'/%3E%3Ctext x='600' y='400' font-family='serif' font-size='120' text-anchor='middle' fill='%23059669' opacity='0.3'%3Eا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي%3C/text%3E%3C/svg%3E")`
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Leer <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">Arabisch</span> op een
              <br />
              <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">leuke manier</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl">
              Ontdek de schoonheid van het Arabische alfabet door interactieve lessen,
              audio-uitspraak en leuke quizzen. Perfect voor beginners!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                Start Nu Gratis
              </button>
              <button
                onClick={() => {
                  const nextSection = document.getElementById('preview-section');
                  nextSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-emerald-500 text-emerald-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-50 transition-all backdrop-blur-sm bg-white/50"
              >
                Bekijk Preview
              </button>
            </div>
          </div>

          {/* Visual Content */}
          <div className="relative">
            {/* 3D Card Container */}
            <div className="relative perspective-1000">
              {/* Main Arabic Letters Display */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Arabische Letters</h3>
                <div className="grid grid-cols-4 gap-4">
                  {['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط'].map((letter, index) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-br from-emerald-100 to-blue-100 p-4 rounded-xl text-center hover:scale-110 transition-all duration-300 shadow-lg"
                    >
                      <div className="text-3xl font-bold text-emerald-700 mb-1">{letter}</div>
                      <div className="text-xs text-gray-600">Letter {index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full opacity-80 animate-bounce" 
                   style={{ animationDuration: '3s' }} />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-80 animate-bounce" 
                   style={{ animationDuration: '4s', animationDelay: '1s' }} />
            </div>

            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-10 left-10 w-20 h-20 border-2 border-emerald-300 rounded-full opacity-30 animate-spin" 
                   style={{ animationDuration: '10s' }} />
              <div className="absolute bottom-10 right-10 w-16 h-16 border-2 border-blue-300 rounded-full opacity-30 animate-spin" 
                   style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={addToRefs} className="py-20 px-4 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23059669' fill-opacity='0.1'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px'
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Waarom <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">EdArabic</span>?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:rotate-1"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {/* 3D Effect Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon with 3D effect */}
                <div className="relative z-10 text-center mb-6">
                  <div className="inline-block text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full" />
                </div>
                
                <div className="relative z-10 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>

                {/* Floating particles on hover */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-300" />
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-300" 
                     style={{ animationDelay: '0.5s' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lesson Preview Section */}
      <section ref={addToRefs} id="preview-section" className="py-20 px-4 relative">
        {/* Background with Arabic calligraphy pattern */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='arabic-pattern' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M50 10 Q60 20 50 30 Q40 20 50 10 M50 30 Q60 40 50 50 Q40 40 50 30 M50 50 Q60 60 50 70 Q40 60 50 50 M50 70 Q60 80 50 90 Q40 80 50 70' stroke='%23059669' stroke-width='2' fill='none' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23arabic-pattern)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px'
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Bekijk Onze <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Lessen</span>
          </h2>
          <div className="space-y-32">
            {lessonPreviews.map((lesson, index) => (
              <div
                key={lesson.id}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}
              >
                <div className="flex-1 relative">
                  {/* 3D Lesson Card */}
                  <div className="relative group">
                    <div className={`bg-gradient-to-br ${lesson.color} p-10 rounded-3xl shadow-2xl transform transition-all duration-700 hover:scale-105 hover:rotate-2`}
                         style={{
                           background: `linear-gradient(135deg, ${lesson.color.includes('emerald') ? '#10b981' : lesson.color.includes('blue') ? '#3b82f6' : '#8b5cf6'}, ${lesson.color.includes('emerald') ? '#059669' : lesson.color.includes('blue') ? '#1d4ed8' : '#7c3aed'})`,
                           boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                         }}>
                      <h3 className="text-3xl font-bold text-white mb-6 text-center">{lesson.title}</h3>
                      <p className="text-white/90 text-lg mb-8 text-center leading-relaxed">{lesson.description}</p>
                      
                      {/* Arabic Letters Grid with 3D effect */}
                      <div className="grid grid-cols-3 gap-4 justify-items-center">
                        {lesson.letters.map((letter, letterIndex) => (
                          <div
                            key={letterIndex}
                            className="group/letter relative bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-center min-w-[100px] hover:bg-white/30 transition-all duration-300 transform hover:scale-110 hover:-translate-y-2"
                            style={{
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            <div className="text-5xl font-bold text-white mb-2 group-hover/letter:scale-110 transition-transform duration-300">
                              {letter.symbol}
                            </div>
                            <div className="text-white/90 text-sm font-medium">
                              {letter.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Floating decorative elements */}
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-white/20 rounded-full animate-bounce" 
                         style={{ animationDuration: '3s', animationDelay: `${index * 0.5}s` }} />
                    <div className="absolute -bottom-6 -left-6 w-8 h-8 bg-white/20 rounded-full animate-bounce" 
                         style={{ animationDuration: '4s', animationDelay: `${index * 0.7}s` }} />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl relative overflow-hidden"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                         border: '1px solid rgba(255, 255, 255, 0.2)'
                       }}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5"
                         style={{
                           backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                           backgroundSize: '60px 60px'
                         }} />
                    
                    <div className="relative z-10">
                      <h4 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                        Wat je leert:
                      </h4>
                      <ul className="space-y-4 text-gray-700">
                        {[
                          'Correcte uitspraak van elke letter',
                          'Interactieve audio-oefeningen',
                          'Visuele herkenningsoefeningen',
                          'Voortgang tracking en feedback'
                        ].map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center text-lg">
                            <span className="text-emerald-500 mr-4 text-2xl">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      
                      {!isAuthenticated && (
                        <button
                          onClick={() => router.push('/login')}
                          className="mt-8 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl"
                        >
                          Start Deze Les
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Tajweed Rules Section */}
      <section ref={addToRefs} className="py-20 px-4 relative">
        {/* Background with Arabic calligraphy pattern */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='arabic-pattern' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M50 10 Q60 20 50 30 Q40 20 50 10 M50 30 Q60 40 50 50 Q40 40 50 30 M50 50 Q60 60 50 70 Q40 60 50 50 M50 70 Q60 80 50 90 Q40 80 50 70' stroke='%23059669' stroke-width='2' fill='none' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23arabic-pattern)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px'
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 relative">
              {/* 3D Tajweed Card */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-10 rounded-3xl shadow-2xl transform transition-all duration-700 hover:scale-105 hover:rotate-2"
                     style={{
                       background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                       boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                     }}>
                  <h3 className="text-3xl font-bold text-white mb-6 text-center">Tajweed Regels</h3>
                  <p className="text-white/90 text-lg mb-8 text-center leading-relaxed">
                    Leer de essentiële regels voor correcte Quran recitatie
                  </p>
                  
                  {/* Tajweed Rules Grid with 3D effect */}
                  <div className="grid grid-cols-2 gap-4 justify-items-center">
                    {[
                      { symbol: '🔄', name: 'Idgham', desc: 'Letters samensmelten' },
                      { symbol: '👁️', name: 'Ikhfa', desc: 'Verborgen uitspraak' },
                      { symbol: '⏱️', name: 'Madd', desc: 'Verlengingen' },
                      { symbol: '🔊', name: 'Qalqalah', desc: 'Echo-effecten' }
                    ].map((rule, ruleIndex) => (
                      <div
                        key={ruleIndex}
                        className="group/rule relative bg-white/20 backdrop-blur-sm p-4 rounded-2xl text-center min-w-[120px] hover:bg-white/30 transition-all duration-300 transform hover:scale-110 hover:-translate-y-2"
                        style={{
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <div className="text-3xl font-bold text-white mb-2 group-hover/rule:scale-110 transition-transform duration-300">
                          {rule.symbol}
                        </div>
                        <div className="text-white/90 text-sm font-medium mb-1">
                          {rule.name}
                        </div>
                        <div className="text-white/70 text-xs">
                          {rule.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating decorative elements */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-white/20 rounded-full animate-bounce" 
                     style={{ animationDuration: '3s' }} />
                <div className="absolute -bottom-6 -left-6 w-8 h-8 bg-white/20 rounded-full animate-bounce" 
                     style={{ animationDuration: '4s', animationDelay: '1s' }} />
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl relative overflow-hidden"
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                     border: '1px solid rgba(255, 255, 255, 0.2)'
                   }}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5"
                     style={{
                       backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                       backgroundSize: '60px 60px'
                     }} />
                
                <div className="relative z-10">
                  <h4 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Wat je leert:
                  </h4>
                  <ul className="space-y-4 text-gray-700">
                    {[
                      'Correcte uitspraak van Arabische letters',
                      'Tajweed regels zoals Idgham en Ikhfa',
                      'Interactieve audio-oefeningen',
                      'Voortgang tracking en feedback'
                    ].map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-lg">
                        <span className="text-emerald-500 mr-4 text-2xl">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  
                  {!isAuthenticated && (
                    <button
                      onClick={() => router.push('/login')}
                      className="mt-8 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl"
                    >
                      Start met Tajweed Leren
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={addToRefs} className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Sluit je aan bij duizenden studenten die al Arabisch leren met EdArabic
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-12 py-4 rounded-xl text-xl font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-xl"
          >
            Start Nu Gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">EdArabic</h3>
          <p className="text-gray-400 mb-6">
            Leer Arabisch op een leuke en interactieve manier
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Inloggen
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Registreren
            </Link>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
