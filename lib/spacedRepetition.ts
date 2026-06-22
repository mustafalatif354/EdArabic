// lib/spacedRepetition.ts
// Simplified SM-2 spaced repetition.
// Strength 0-5 maps to review intervals (in days).

import { supabase } from "./supabaseClient"

export interface Word {
  id: number
  arabic: string
  transliteration: string
  definition_nl: string
  definition_en: string
  difficulty: number
}

export interface WordProgress {
  word_id: number
  strength: number
  next_review_at: string
  times_correct: number
  times_wrong: number
  last_seen_at: string
}

// Days until next review at each strength level
const INTERVALS_DAYS: Record<number, number> = {
  0: 0,    // new — show today
  1: 1,    // just learned
  2: 3,
  3: 7,
  4: 14,
  5: 30,   // mastered
}

export const SESSION_SIZE = 15

export interface ReviewStats {
  dueNow: number
  newWords: number
  learning: number     // strength 1-3
  mastered: number     // strength 4-5
  totalSeen: number
  totalWords: number
}

export class SpacedRepetition {

  /**
   * Build a 15-word review session for the user.
   * Priority: due words → new words → weakest known words
   */
  static async getReviewSession(userId: string): Promise<Word[]> {
    const now = new Date().toISOString()

    // 1. Fetch all words the user has studied
    const { data: progressData } = await supabase
      .from("word_progress")
      .select("word_id, strength, next_review_at")
      .eq("user_id", userId)

    const progressMap = new Map<number, { strength: number; due: boolean }>()
    for (const p of progressData || []) {
      progressMap.set(p.word_id, {
        strength: p.strength,
        due: new Date(p.next_review_at).toISOString() <= now,
      })
    }

    // 2. Fetch all words (we need the full pool to pick from)
    const { data: allWords } = await supabase
      .from("words")
      .select("*")
      .order("order_index", { ascending: true })

    if (!allWords) return []

    const studiedIds = new Set(progressMap.keys())

    // Bucket A: due words (studied before, past review date)
    const dueWords = allWords.filter(w => {
      const p = progressMap.get(w.id)
      return p && p.due
    })

    // Bucket B: brand new words (never studied)
    const newWords = allWords.filter(w => !studiedIds.has(w.id))

    // Bucket C: weakest known words (studied but not yet due — fallback)
    const weakWords = allWords
      .filter(w => {
        const p = progressMap.get(w.id)
        return p && !p.due
      })
      .sort((a, b) => {
        const sa = progressMap.get(a.id)!.strength
        const sb = progressMap.get(b.id)!.strength
        return sa - sb  // lowest strength first
      })

    // Shuffle within each bucket so sessions feel fresh
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

    // Session composition: prefer due, then new, then weak as fallback
    const session: Word[] = []

    // Up to 10 due words first
    session.push(...shuffle(dueWords).slice(0, 10))

    // Up to 5 new words to keep learning fresh
    const remaining = SESSION_SIZE - session.length
    session.push(...shuffle(newWords).slice(0, Math.min(5, remaining)))

    // Fill any remaining slots with weak words
    if (session.length < SESSION_SIZE) {
      session.push(...weakWords.slice(0, SESSION_SIZE - session.length))
    }

    // If user has fewer than 15 words total, just return what we have
    return shuffle(session).slice(0, SESSION_SIZE)
  }

  /**
   * Record the result of a single answer and update the word's strength.
   */
  static async recordAnswer(userId: string, wordId: number, correct: boolean): Promise<void> {
    // Fetch current progress
    const { data: existing } = await supabase
      .from("word_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .maybeSingle()

    const currentStrength = existing?.strength ?? 0
    const newStrength = correct
      ? Math.min(5, currentStrength + 1)
      : 1   // wrong answer → drop back to "just learning"

    const daysUntilReview = INTERVALS_DAYS[newStrength]
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + daysUntilReview)

    const now = new Date().toISOString()

    await supabase.from("word_progress").upsert({
      user_id: userId,
      word_id: wordId,
      strength: newStrength,
      next_review_at: nextReview.toISOString(),
      times_correct: (existing?.times_correct ?? 0) + (correct ? 1 : 0),
      times_wrong:   (existing?.times_wrong ?? 0)   + (correct ? 0 : 1),
      last_seen_at: now,
      updated_at: now,
    }, { onConflict: "user_id,word_id" })
  }

  /**
   * Get stats for the vocab dashboard.
   */
  static async getStats(userId: string): Promise<ReviewStats> {
    const now = new Date().toISOString()

    const [progressRes, wordsRes] = await Promise.all([
      supabase.from("word_progress").select("strength, next_review_at").eq("user_id", userId),
      supabase.from("words").select("id", { count: "exact", head: true }),
    ])

    const progress = progressRes.data || []
    const totalWords = wordsRes.count ?? 0

    const dueNow = progress.filter(p => new Date(p.next_review_at).toISOString() <= now).length
    const learning = progress.filter(p => p.strength >= 1 && p.strength <= 3).length
    const mastered = progress.filter(p => p.strength >= 4).length
    const totalSeen = progress.length
    const newWords = totalWords - totalSeen

    return { dueNow, newWords, learning, mastered, totalSeen, totalWords }
  }
}
