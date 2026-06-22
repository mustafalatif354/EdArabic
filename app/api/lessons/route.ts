import { NextResponse } from 'next/server'

export async function GET() {
  // In een later stadium komt dit uit een database.
  const lessons = [
    {
      id: 1,
      title: 'Arabisch Alfabet – Les 1',
      letters: [
        { symbol: 'ا', name: 'Alif', sound: '/sounds/alif.mp3' },
        { symbol: 'ب', name: 'Ba', sound: '/sounds/ba.mp3' },
        { symbol: 'ت', name: 'Ta', sound: '/sounds/ta.mp3' },
      ],
    },
  ]

  return NextResponse.json(lessons)
}
  