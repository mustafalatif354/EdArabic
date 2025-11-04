"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { LevelingSystem } from "@/lib/leveling"

export default function TestPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [audio] = useState<HTMLAudioElement>(new Audio())
  const [currentExercise, setCurrentExercise] = useState(0)
  const [exerciseScore, setExerciseScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [lessonCompleted, setLessonCompleted] = useState(false)
  const [exercises, setExercises] = useState<any[]>([])
  const [finalScore, setFinalScore] = useState(0)
  const [xpAwarded, setXpAwarded] = useState(0)

  // All 28 Arabic letters
  const allArabicLetters = [
    { symbol: 'ا', sound: '/sounds/alif.mp3', name: 'Alif', description: 'De eerste letter van het Arabische alfabet' },
    { symbol: 'ب', sound: '/sounds/ba.mp3', name: 'Ba', description: 'De tweede letter, klinkt als "b"' },
    { symbol: 'ت', sound: '/sounds/ta.mp3', name: 'Ta', description: 'De derde letter, klinkt als "t"' },
    { symbol: 'ث', sound: '/sounds/tha.mp3', name: 'Tha', description: 'Klinkt als "th" in "think"' },
    { symbol: 'ج', sound: '/sounds/jim.mp3', name: 'Jim', description: 'Klinkt als "j" in "jam"' },
    { symbol: 'ح', sound: '/sounds/ha.mp3', name: 'Ha', description: 'Diepe "h" klank' },
    { symbol: 'خ', sound: '/sounds/kha.mp3', name: 'Kha', description: 'Klinkt als "ch" in "Bach"' },
    { symbol: 'د', sound: '/sounds/dal.mp3', name: 'Dal', description: 'Klinkt als "d"' },
    { symbol: 'ذ', sound: '/sounds/dhal.mp3', name: 'Dhal', description: 'Klinkt als "th" in "that"' },
    { symbol: 'ر', sound: '/sounds/ra.mp3', name: 'Ra', description: 'Klinkt als "r"' },
    { symbol: 'ز', sound: '/sounds/za.mp3', name: 'Za', description: 'Klinkt als "z"' },
    { symbol: 'س', sound: '/sounds/sin.mp3', name: 'Sin', description: 'Klinkt als "s"' },
    { symbol: 'ش', sound: '/sounds/shin.mp3', name: 'Shin', description: 'Klinkt als "sh" in "ship"' },
    { symbol: 'ص', sound: '/sounds/sad.mp3', name: 'Sad', description: 'Emfatische "s" klank' },
    { symbol: 'ض', sound: '/sounds/dad.mp3', name: 'Dad', description: 'Emfatische "d" klank' },
    { symbol: 'ط', sound: '/sounds/ta.mp3', name: 'Ta', description: 'Emfatische "t" klank' },
    { symbol: 'ظ', sound: '/sounds/za.mp3', name: 'Za', description: 'Emfatische "z" klank' },
    { symbol: 'ع', sound: '/sounds/ain.mp3', name: 'Ain', description: 'Diepe keelklank' },
    { symbol: 'غ', sound: '/sounds/ghain.mp3', name: 'Ghain', description: 'Raspende keelklank' },
    { symbol: 'ف', sound: '/sounds/fa.mp3', name: 'Fa', description: 'Klinkt als "f"' },
    { symbol: 'ق', sound: '/sounds/qaf.mp3', name: 'Qaf', description: 'Diepe "q" klank' },
    { symbol: 'ك', sound: '/sounds/kaf.mp3', name: 'Kaf', description: 'Klinkt als "k"' },
    { symbol: 'ل', sound: '/sounds/lam.mp3', name: 'Lam', description: 'Klinkt als "l"' },
    { symbol: 'م', sound: '/sounds/mim.mp3', name: 'Mim', description: 'Klinkt als "m"' },
    { symbol: 'ن', sound: '/sounds/nun.mp3', name: 'Nun', description: 'Klinkt als "n"' },
    { symbol: 'ه', sound: '/sounds/ha.mp3', name: 'Ha', description: 'Klinkt als "h"' },
    { symbol: 'و', sound: '/sounds/waw.mp3', name: 'Waw', description: 'Klinkt als "w" of "u"' },
    { symbol: 'ي', sound: '/sounds/ya.mp3', name: 'Ya', description: 'Klinkt als "y" of "i"' },
  ]

  const lessonsData = {
    1: {
      title: "Les 1: Arabisch Alfabet - Eerste Helft",
      letters: allArabicLetters.slice(0, 14)
    },
    2: {
      title: "Les 2: Arabisch Alfabet - Tweede Helft",
      letters: allArabicLetters.slice(14, 28)
    },
    3: {
      title: "Les 3: Geavanceerde Letters",
      letters: [
        { symbol: 'ذ', sound: '/sounds/ta.mp3', name: 'Dhal', description: 'Klinkt als "th" in "that"' },
        { symbol: 'ر', sound: '/sounds/alif.mp3', name: 'Ra', description: 'Klinkt als "r"' },
        { symbol: 'ز', sound: '/sounds/ba.mp3', name: 'Za', description: 'Klinkt als "z"' },
        { symbol: 'س', sound: '/sounds/ta.mp3', name: 'Sin', description: 'Klinkt als "s"' },
      ]
    },
    4: {
      title: "Les 4: Nieuwe Vormen",
      letters: [
        { symbol: 'ش', sound: '/sounds/alif.mp3', name: 'Shin', description: 'Klinkt als "sh" in "ship"' },
        { symbol: 'ص', sound: '/sounds/ba.mp3', name: 'Sad', description: 'Emfatische "s" klank' },
        { symbol: 'ض', sound: '/sounds/ta.mp3', name: 'Dad', description: 'Emfatische "d" klank' },
        { symbol: 'ط', sound: '/sounds/alif.mp3', name: 'Ta', description: 'Emfatische "t" klank' },
      ]
    },
    5: {
      title: "Les 5: Uitbreiding",
      letters: [
        { symbol: 'ظ', sound: '/sounds/ba.mp3', name: 'Za', description: 'Emfatische "z" klank' },
        { symbol: 'ع', sound: '/sounds/ta.mp3', name: 'Ain', description: 'Diepe keelklank' },
        { symbol: 'غ', sound: '/sounds/alif.mp3', name: 'Ghain', description: 'Raspende keelklank' },
        { symbol: 'ف', sound: '/sounds/ba.mp3', name: 'Fa', description: 'Klinkt als "f"' },
      ]
    },
    6: {
      title: "Les 6: Verder Leren",
      letters: [
        { symbol: 'ق', sound: '/sounds/ta.mp3', name: 'Qaf', description: 'Diepe "q" klank' },
        { symbol: 'ك', sound: '/sounds/alif.mp3', name: 'Kaf', description: 'Klinkt als "k"' },
        { symbol: 'ل', sound: '/sounds/ba.mp3', name: 'Lam', description: 'Klinkt als "l"' },
        { symbol: 'م', sound: '/sounds/ta.mp3', name: 'Mim', description: 'Klinkt als "m"' },
      ]
    },
    7: {
      title: "Les 7: Bijna Klaar",
      letters: [
        { symbol: 'ن', sound: '/sounds/alif.mp3', name: 'Nun', description: 'Klinkt als "n"' },
        { symbol: 'ه', sound: '/sounds/ba.mp3', name: 'Ha', description: 'Klinkt als "h"' },
        { symbol: 'و', sound: '/sounds/ta.mp3', name: 'Waw', description: 'Klinkt als "w" of "u"' },
        { symbol: 'ي', sound: '/sounds/alif.mp3', name: 'Ya', description: 'Klinkt als "y" of "i"' },
      ]
    },
    8: {
      title: "Les 8: Complete Alfabet",
      letters: [
        { symbol: 'ا', sound: '/sounds/alif.mp3', name: 'Alif', description: 'De eerste letter van het Arabische alfabet' },
        { symbol: 'ب', sound: '/sounds/ba.mp3', name: 'Ba', description: 'De tweede letter, klinkt als "b"' },
        { symbol: 'ت', sound: '/sounds/ta.mp3', name: 'Ta', description: 'De derde letter, klinkt als "t"' },
        { symbol: 'ث', sound: '/sounds/alif.mp3', name: 'Tha', description: 'Klinkt als "th" in "think"' },
        { symbol: 'ج', sound: '/sounds/ba.mp3', name: 'Jim', description: 'Klinkt als "j" in "jam"' },
        { symbol: 'ح', sound: '/sounds/ta.mp3', name: 'Ha', description: 'Diepe "h" klank' },
        { symbol: 'خ', sound: '/sounds/alif.mp3', name: 'Kha', description: 'Klinkt als "ch" in "Bach"' },
        { symbol: 'د', sound: '/sounds/ba.mp3', name: 'Dal', description: 'Klinkt als "d"' },
        { symbol: 'ذ', sound: '/sounds/ta.mp3', name: 'Dhal', description: 'Klinkt als "th" in "that"' },
        { symbol: 'ر', sound: '/sounds/alif.mp3', name: 'Ra', description: 'Klinkt als "r"' },
        { symbol: 'ز', sound: '/sounds/ba.mp3', name: 'Za', description: 'Klinkt als "z"' },
        { symbol: 'س', sound: '/sounds/ta.mp3', name: 'Sin', description: 'Klinkt als "s"' },
        { symbol: 'ش', sound: '/sounds/alif.mp3', name: 'Shin', description: 'Klinkt als "sh" in "ship"' },
        { symbol: 'ص', sound: '/sounds/ba.mp3', name: 'Sad', description: 'Emfatische "s" klank' },
        { symbol: 'ض', sound: '/sounds/ta.mp3', name: 'Dad', description: 'Emfatische "d" klank' },
        { symbol: 'ط', sound: '/sounds/alif.mp3', name: 'Ta', description: 'Emfatische "t" klank' },
        { symbol: 'ظ', sound: '/sounds/ba.mp3', name: 'Za', description: 'Emfatische "z" klank' },
        { symbol: 'ع', sound: '/sounds/ta.mp3', name: 'Ain', description: 'Diepe keelklank' },
        { symbol: 'غ', sound: '/sounds/alif.mp3', name: 'Ghain', description: 'Raspende keelklank' },
        { symbol: 'ف', sound: '/sounds/ba.mp3', name: 'Fa', description: 'Klinkt als "f"' },
        { symbol: 'ق', sound: '/sounds/ta.mp3', name: 'Qaf', description: 'Diepe "q" klank' },
        { symbol: 'ك', sound: '/sounds/alif.mp3', name: 'Kaf', description: 'Klinkt als "k"' },
        { symbol: 'ل', sound: '/sounds/ba.mp3', name: 'Lam', description: 'Klinkt als "l"' },
        { symbol: 'م', sound: '/sounds/ta.mp3', name: 'Mim', description: 'Klinkt als "m"' },
        { symbol: 'ن', sound: '/sounds/alif.mp3', name: 'Nun', description: 'Klinkt als "n"' },
        { symbol: 'ه', sound: '/sounds/ba.mp3', name: 'Ha', description: 'Klinkt als "h"' },
        { symbol: 'و', sound: '/sounds/ta.mp3', name: 'Waw', description: 'Klinkt als "w" of "u"' },
        { symbol: 'ي', sound: '/sounds/alif.mp3', name: 'Ya', description: 'Klinkt als "y" of "i"' },
      ]
    }
  }

  const lessonId = parseInt(params.id as string)
  const isComprehensiveTest = lessonId === 99
  const lesson = isComprehensiveTest ? null : lessonsData[lessonId as keyof typeof lessonsData]

  const generateExercise = useCallback(() => {
    const exercises: any[] = []
    
    // Comprehensive test (lesson_id 99) - tests all 28 letters
    if (isComprehensiveTest) {
      // Create comprehensive test with all 28 letters
      // Test each letter once (listen or see, randomly)
      allArabicLetters.forEach((letter) => {
        // Get 3 random wrong letters
        const wrongLetters = allArabicLetters
          .filter(l => l.symbol !== letter.symbol)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        
        // Combine with correct letter and shuffle
        const options = [...wrongLetters, letter].sort(() => Math.random() - 0.5)
        
        exercises.push({
          type: Math.random() > 0.5 ? 'listen' : 'see',
          correctLetter: letter,
          question: Math.random() > 0.5 ? `Klik op de letter die je hoort:` : `Klik op de juiste letter:`,
          options: options
        })
      })
    } else if (!lesson) {
      return []
    } else if (lessonId === 2) {
      // Lesson 2 regular test - only test lesson 2 letters
      lesson.letters.forEach((letter) => {
        exercises.push({
          type: 'listen',
          correctLetter: letter,
          question: `Klik op de letter die je hoort:`,
          options: [...lesson.letters].sort(() => Math.random() - 0.5)
        })
        exercises.push({
          type: 'see',
          correctLetter: letter,
          question: `Klik op de juiste letter:`,
          options: [...lesson.letters].sort(() => Math.random() - 0.5)
        })
      })
    } else if (lessonId === 8) {
      // For the complete alphabet lesson, create 8 exercises with 4 random letters each
      const allLetters = lesson.letters
      for (let i = 0; i < 8; i++) {
        const correctLetter = allLetters[Math.floor(Math.random() * allLetters.length)]
        const randomLetters = [...allLetters].sort(() => Math.random() - 0.5).slice(0, 4)
        
        if (!randomLetters.includes(correctLetter)) {
          randomLetters[0] = correctLetter
        }
        
        exercises.push({
          type: Math.random() > 0.5 ? 'listen' : 'see',
          correctLetter: correctLetter,
          question: Math.random() > 0.5 ? `Klik op de letter die je hoort:` : `Klik op de juiste letter:`,
          options: randomLetters.sort(() => Math.random() - 0.5)
        })
      }
    } else {
      // For regular lessons, create exercises: 2 listen and 2 see per letter
      lesson.letters.forEach((letter) => {
        exercises.push({
          type: 'listen',
          correctLetter: letter,
          question: `Klik op de letter die je hoort:`,
          options: [...lesson.letters].sort(() => Math.random() - 0.5)
        })
        exercises.push({
          type: 'see',
          correctLetter: letter,
          question: `Klik op de juiste letter:`,
          options: [...lesson.letters].sort(() => Math.random() - 0.5)
        })
      })
    }
    
    return exercises.sort(() => Math.random() - 0.5)
  }, [lesson, lessonId, isComprehensiveTest])

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
        
        // For comprehensive test, check if lesson 2 is completed
        if (isComprehensiveTest) {
          const { data: progress } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', data.user.id)
            .eq('lesson_id', 2)
            .single()
          
          if (!progress || !progress.completed) {
            alert('Je moet eerst les 2 voltooien voordat je de comprehensieve test kunt maken.')
            router.push("/home")
            return
          }
        }
        
        const generatedExercises = generateExercise()
        setExercises(generatedExercises)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, generateExercise, isComprehensiveTest])


  const currentEx = exercises[currentExercise]

  const playSound = (sound: string) => {
    audio.src = sound
    audio.play().catch(error => {
      console.log("Audio play failed:", error)
    })
  }

  const goBack = () => {
    if (isComprehensiveTest) {
      router.push("/home")
    } else {
      router.push(`/lessons/${lessonId}`)
    }
  }

  const handleExerciseAnswer = (selectedLetter: any) => {
    const isCorrect = currentEx && selectedLetter.symbol === currentEx.correctLetter.symbol
    const newScore = exerciseScore + (isCorrect ? 1 : 0)
    const newMistakes = isCorrect ? mistakes : mistakes + 1

    if (currentExercise < exercises.length - 1) {
      setExerciseScore(newScore)
      setMistakes(newMistakes)
      setCurrentExercise(currentExercise + 1)
    } else {
      // Exercise completed - use the correct final score
      const percentage = Math.round((newScore / exercises.length) * 100)
      const perfectScore = newMistakes === 0 && percentage === 100
      
      console.log(`Final score: ${newScore}/${exercises.length} = ${percentage}%`) // Debug log
      setFinalScore(percentage)
      setMistakes(newMistakes)
      
      // For comprehensive test, require 80% to pass (stricter)
      const requiredScore = isComprehensiveTest ? 80 : 70
      
      if (percentage >= requiredScore) {
        completeLesson(percentage, perfectScore)
      } else {
        // Show failure message and allow retry
        const testType = isComprehensiveTest ? 'comprehensieve test' : 'test'
        alert(`Je score was ${percentage}%. Je moet minimaal ${requiredScore}% scoren om de ${testType} te voltooien. Probeer het opnieuw!`)
        setCurrentExercise(0)
        setExerciseScore(0)
        setMistakes(0)
        setFinalScore(0)
        const generatedExercises = generateExercise()
        setExercises(generatedExercises)
      }
    }
  }

  const completeLesson = async (percentage: number, perfectScore: boolean) => {
    if (!user) return
    
    setLessonCompleted(true)
    
    // For comprehensive test, use lesson_id 99, otherwise use the actual lesson_id
    const progressLessonId = isComprehensiveTest ? 99 : lessonId
    const requiredScore = isComprehensiveTest ? 80 : 70
    
    console.log('Saving progress:', {
      user_id: user.id,
      lesson_id: progressLessonId,
      percentage,
      completed: percentage >= requiredScore,
      perfectScore,
      isComprehensiveTest
    })
    
    // Calculate and award XP
    const xpAwarded = LevelingSystem.calculateXPAward(perfectScore)
    setXpAwarded(xpAwarded)
    
    // Award XP to user
    const levelData = await LevelingSystem.awardXP(xpAwarded)
    
    // Save progress to database
    const { data, error } = await supabase
      .from('progress')
      .upsert({
        user_id: user.id,
        lesson_id: progressLessonId,
        completed: percentage >= requiredScore
      })
      .select()

    if (error) {
      console.error('Error saving progress:', error)
      alert(`Er ging iets mis bij het opslaan van je voortgang: ${error.message}`)
    } else {
      console.log('Progress saved successfully:', data)
      if (levelData) {
        console.log('XP awarded:', xpAwarded, 'New level:', levelData.level)
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p>Bezig met laden...</p>
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Les niet gevonden</h1>
          <button
            onClick={goBack}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition"
          >
            Terug naar Les
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              onClick={goBack}
              className="flex items-center text-emerald-600 hover:text-emerald-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Terug naar Les
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isComprehensiveTest ? 'Comprehensieve Test - Alle Letters' : lesson ? `Test - ${lesson.title}` : 'Test'}
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!lessonCompleted && currentEx && exercises.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {isComprehensiveTest && currentExercise === 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">📚 Comprehensieve Test</h3>
                <p className="text-blue-800 text-sm">
                  Deze test bevat alle 28 letters van het Arabische alfabet. Je moet minimaal 80% scoren om door te gaan naar les 3.
                </p>
              </div>
            )}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Test - Vraag {currentExercise + 1} van {exercises.length}</h2>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-xl mb-6">{currentEx.question}</p>
              
              {currentEx.type === 'listen' && (
                <button
                  onClick={() => playSound(currentEx.correctLetter.sound)}
                  className="bg-blue-500 text-white px-8 py-4 rounded-lg hover:bg-blue-600 transition mb-6 text-lg"
                >
                  🔊 Luister naar de letter
                </button>
              )}
              
              {currentEx.type === 'see' && (
                <div className="text-8xl font-bold mb-6 text-gray-800">
                  {currentEx.correctLetter.symbol}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {currentEx.options.map((letter: any, index: number) => (
                <button
                  key={index}
                  onClick={() => handleExerciseAnswer(letter)}
                  className="bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-600 px-8 py-6 rounded-lg transition text-4xl font-bold border-2 border-transparent hover:border-emerald-300"
                >
                  {letter.symbol}
                </button>
              ))}
            </div>
          </div>
        ) : lessonCompleted ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <div className="text-8xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-6 text-green-600">Gefeliciteerd!</h2>
              {isComprehensiveTest ? (
                <>
                  <p className="text-xl mb-4 font-bold text-blue-600">
                    Je hebt de comprehensieve test voltooid!
                  </p>
                  <p className="text-lg mb-4">
                    Je kent nu alle 28 letters van het Arabische alfabet! Je score: {finalScore}%
                  </p>
                  <p className="text-md mb-4 text-gray-600">
                    Je kunt nu doorgaan naar les 3 en verder!
                  </p>
                </>
              ) : (
                <p className="text-xl mb-4">
                  Je hebt de les voltooid! Je score: {finalScore}%
                </p>
              )}
              {xpAwarded > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-emerald-200">
                  <div className="text-3xl mb-2">⭐</div>
                  <p className="text-lg font-bold text-emerald-600 mb-1">
                    +{xpAwarded} XP verdiend!
                  </p>
                  {xpAwarded > LevelingSystem.BASE_XP && (
                    <p className="text-sm text-gray-600">Perfecte score bonus toegevoegd!</p>
                  )}
                </div>
              )}
              <div className="space-y-4">
                <button
                  onClick={() => router.push("/home")}
                  className="w-full bg-emerald-500 text-white py-4 px-8 rounded-lg hover:bg-emerald-600 transition text-lg font-semibold"
                >
                  Terug naar Homepage
                </button>
                <button
                  onClick={goBack}
                  className="w-full bg-gray-500 text-white py-4 px-8 rounded-lg hover:bg-gray-600 transition text-lg font-semibold"
                >
                  Terug naar Les
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
