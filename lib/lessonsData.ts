// lib/lessonsData.ts
// Single source of truth for lesson + letter data.
// All pages should fetch from here instead of using hardcoded arrays.

import { supabase } from '@/lib/supabaseClient'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface Letter {
  id: number
  lesson_id: number
  order_index: number
  symbol: string
  name: string
  transliteration: string | null
  description_nl: string | null
  description_en: string | null
  sound_file: string | null
}

export interface Lesson {
  id: number
  title_nl: string
  title_en: string
  category: string
  order_index: number
  icon: string | null
  color: string | null
  unlocked_after_lesson_id: number | null
  letters?: Letter[]
}

// ----------------------------------------------------------------
// Fetch all lessons (without letters)
// ----------------------------------------------------------------

export async function getAllLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching lessons:', error)
    return []
  }

  return data ?? []
}

// ----------------------------------------------------------------
// Fetch a single lesson with its letters
// ----------------------------------------------------------------

export async function getLessonWithLetters(lessonId: number): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      letters (
        *
      )
    `)
    .eq('id', lessonId)
    .order('order_index', { foreignTable: 'letters', ascending: true })
    .single()

  if (error) {
    console.error(`Error fetching lesson ${lessonId}:`, error)
    return null
  }

  return data ?? null
}

// ----------------------------------------------------------------
// Fetch letters for a specific lesson (useful for exercise pages)
// ----------------------------------------------------------------

export async function getLettersForLesson(lessonId: number): Promise<Letter[]> {
  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error(`Error fetching letters for lesson ${lessonId}:`, error)
    return []
  }

  return data ?? []
}

// ----------------------------------------------------------------
// Fetch lessons by category  (e.g. 'alphabet' | 'vocabulary')
// ----------------------------------------------------------------

export async function getLessonsByCategory(category: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('category', category)
    .order('order_index', { ascending: true })

  if (error) {
    console.error(`Error fetching lessons for category "${category}":`, error)
    return []
  }

  return data ?? []
}
