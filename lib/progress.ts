import { supabase } from './supabaseClient'

export interface ProgressData {
  id?: number
  user_id: string
  lesson_id: number
  completed: boolean
}

export class ProgressManager {
  // Save or update progress for a lesson
  static async saveProgress(lessonId: number, completed: boolean): Promise<ProgressData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const progressData = {
        user_id: user.id,
        lesson_id: lessonId,
        completed
      }

      const { data, error } = await supabase
        .from('progress')
        .upsert(progressData)
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
      if (!user) {
        throw new Error('User not authenticated')
      }

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
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching lesson progress:', error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Error in getLessonProgress:', error)
      return null
    }
  }

  // Calculate overall progress statistics
  static calculateProgressStats(progressData: ProgressData[]) {
    const totalLessons = 8 // Total number of lessons
    const completedLessons = progressData.filter(p => p.completed).length
    const overallProgress = Math.round((completedLessons / totalLessons) * 100)

    return {
      completedLessons,
      totalLessons,
      averageProgress: overallProgress, // Since we don't have percentage scores, use overall progress
      overallProgress
    }
  }

  // Check if a lesson is unlocked (previous lesson completed)
  static isLessonUnlocked(lessonId: number, progressData: ProgressData[]): boolean {
    if (lessonId === 1) return true // First lesson is always unlocked
    
    const previousLesson = progressData.find(p => p.lesson_id === lessonId - 1)
    return previousLesson ? previousLesson.completed : false
  }
}
