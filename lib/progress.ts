import { supabase } from './supabaseClient'

export interface ProgressData {
  id?: number
  user_id: string
  lesson_id: number
  completed: boolean
  score?: number
  xp?: number
  completed_at?: string
}

export class ProgressManager {
  // Save or update progress for a lesson (now includes score + xp)
  static async saveProgress(
    lessonId: number,
    completed: boolean,
    score: number = 0,
    xpEarned: number = 0
  ): Promise<ProgressData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const progressData = {
        user_id: user.id,
        lesson_id: lessonId,
        completed,
        score,
        xp: xpEarned,
        ...(completed ? { completed_at: new Date().toISOString() } : {})
      }

      const { data, error } = await supabase
        .from('progress')
        .upsert(progressData, { onConflict: 'user_id,lesson_id' })
        .select()
        .single()

      if (error) {
        console.error('Error saving progress:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in saveProgress:', error)
      return null
    }
  }

  // Get all progress for current user
  static async getUserProgress(): Promise<ProgressData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .order('lesson_id', { ascending: true })

      if (error) {
        console.error('Error fetching progress:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserProgress:', error)
      return []
    }
  }

  // Get progress for a specific lesson
  static async getLessonProgress(lessonId: number): Promise<ProgressData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching lesson progress:', error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Error in getLessonProgress:', error)
      return null
    }
  }

  // Sum total XP earned across all progress rows
  static async getTotalXP(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('progress')
        .select('xp')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching XP:', error)
        return 0
      }

      return (data || []).reduce((sum, row) => sum + (row.xp || 0), 0)
    } catch (error) {
      console.error('Error in getTotalXP:', error)
      return 0
    }
  }

  // Calculate overall progress statistics
  static calculateProgressStats(progressData: ProgressData[]) {
    const totalLessons = 8
    const completedLessons = progressData.filter(p => p.completed).length
    const overallProgress = Math.round((completedLessons / totalLessons) * 100)

    return {
      completedLessons,
      totalLessons,
      averageProgress: overallProgress,
      overallProgress
    }
  }

  // Check if comprehensive test is completed (lesson_id 99)
  static isComprehensiveTestCompleted(progressData: ProgressData[]): boolean {
    const comprehensiveTest = progressData.find(p => p.lesson_id === 99)
    return comprehensiveTest ? comprehensiveTest.completed : false
  }

  // Check if a lesson is unlocked
  static isLessonUnlocked(lessonId: number, progressData: ProgressData[]): boolean {
    if (lessonId === 1) return true
    if (lessonId === 2) {
      const lesson1 = progressData.find(p => p.lesson_id === 1)
      return lesson1 ? lesson1.completed : false
    }
    if (lessonId >= 3) {
      return this.isComprehensiveTestCompleted(progressData)
    }
    const previousLesson = progressData.find(p => p.lesson_id === lessonId - 1)
    return previousLesson ? previousLesson.completed : false
  }
}
