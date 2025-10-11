"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [audio] = useState<HTMLAudioElement>(new Audio())

  const lessonsData = {
    1: {
      title: "Les 1: Arabisch Alfabet - Basis",
      letters: [
        { symbol: 'ا', sound: '/sounds/alif.mp3', name: 'Alif', description: 'De eerste letter van het Arabische alfabet' },
        { symbol: 'ب', sound: '/sounds/ba.mp3', name: 'Ba', description: 'De tweede letter, klinkt als "b"' },
        { symbol: 'ت', sound: '/sounds/ta.mp3', name: 'Ta', description: 'De derde letter, klinkt als "t"' },
        { symbol: 'ث', sound: '/sounds/tha.mp3', name: 'Tha', description: 'Klinkt als "th" in "think"' },
      ]
    },
    2: {
      title: "Les 2: Meer Letters",
      letters: [
        { symbol: 'ج', sound: '/sounds/jim.mp3', name: 'Jim', description: 'Klinkt als "j" in "jam"' },
        { symbol: 'ح', sound: '/sounds/ha.mp3', name: 'Ha', description: 'Diepe "h" klank' },
        { symbol: 'خ', sound: '/sounds/kha.mp3', name: 'Kha', description: 'Klinkt als "ch" in "Bach"' },
        { symbol: 'د', sound: '/sounds/ba.mp3', name: 'Dal', description: 'Klinkt als "d"' },
      ]
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
  const lesson = lessonsData[lessonId as keyof typeof lessonsData]

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const playSound = (sound: string) => {
    audio.src = sound
    audio.play().catch(error => {
      console.log("Audio play failed:", error)
    })
  }

  const goBack = () => {
    router.push("/home")
  }

  const goToTest = () => {
    router.push(`/lessons/${lessonId}/test`)
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
            Terug naar Homepage
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
              Terug naar Homepage
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Instructies</h2>
          <p className="text-gray-600 mb-4">
            Klik op elke letter om de uitspraak te horen. Probeer elke letter meerdere keren uit te spreken.
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Zorg dat je geluid aanstaat
          </div>
        </div>

        {/* Letters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {lesson.letters.map((letter, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <button
                onClick={() => playSound(letter.sound)}
                className="w-full text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl"
              >
                <div className="text-8xl font-bold mb-4 text-gray-800 hover:text-emerald-600 transition-colors">
                  {letter.symbol}
                </div>
              </button>
              
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{letter.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{letter.description}</p>
                
                <button
                  onClick={() => playSound(letter.sound)}
                  className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Luister
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Test Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Test Je Kennis</h2>
          <p className="text-gray-600 mb-6">
            Nu ga je een korte test doen om te zien of je de letters goed kent. 
            Je moet 70% of hoger scoren om de les te voltooien.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            {lesson.letters.map((letter, index) => (
              <button
                key={index}
                onClick={() => playSound(letter.sound)}
                className="bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-600 px-4 py-2 rounded-lg transition flex items-center"
              >
                <span className="text-2xl mr-2">{letter.symbol}</span>
                <span className="text-sm">{letter.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={goToTest}
            className="w-full bg-emerald-500 text-white py-3 px-6 rounded-lg hover:bg-emerald-600 transition text-lg font-semibold"
          >
            Start Test
          </button>
        </div>
      </div>
    </main>
  )
}
