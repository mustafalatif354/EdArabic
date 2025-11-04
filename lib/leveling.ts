import { supabase } from './supabaseClient'

export interface UserLevelData {
  level: number
  xp: number
  xpForNextLevel: number
  xpProgress: number
  progressPercentage: number
}

export class LevelingSystem {
  // Base XP per lesson completion
  static readonly BASE_XP = 10
  // Bonus percentage for perfect score (no mistakes)
  static readonly PERFECT_BONUS = 0.05 // 5%

  /**
   * Calculate XP required to reach a specific level (total XP needed)
   * Level 1: 0 XP (starting point)
   * Level 2: 15 XP total
   * Level 3: 30 XP total (15 more)
   * Level 4: 50 XP total (20 more)
   * Level 5: 75 XP total (25 more)
   * Level 6: 105 XP total (30 more)
   * Progressive: each level requires 15 + (level-2)*5 more XP than previous
   */
  static getXPForLevel(level: number): number {
    if (level <= 1) return 0
    if (level === 2) return 15
    
    let totalXP = 15 // Level 2 requirement
    for (let i = 3; i <= level; i++) {
      // Each level adds 15 + (i - 2) * 5 more XP
      totalXP += 15 + (i - 2) * 5
    }
    return totalXP
  }

  /**
   * Calculate current level based on total XP
   */
  static calculateLevel(totalXP: number): number {
    if (totalXP < 15) return 1
    
    let level = 1
    let nextLevelXP = this.getXPForLevel(level + 1)
    
    while (totalXP >= nextLevelXP) {
      level++
      nextLevelXP = this.getXPForLevel(level + 1)
      // Safety check to prevent infinite loops
      if (level > 100) break
    }
    
    return level
  }

  /**
   * Calculate XP needed for next level
   */
  static getXPForNextLevel(currentLevel: number): number {
    return this.getXPForLevel(currentLevel + 1)
  }

  /**
   * Get user level data
   */
  static getUserLevelData(totalXP: number): UserLevelData {
    const level = this.calculateLevel(totalXP)
    const xpForCurrentLevel = this.getXPForLevel(level)
    const xpForNextLevel = this.getXPForLevel(level + 1)
    const xpProgress = totalXP - xpForCurrentLevel
    const xpNeeded = xpForNextLevel - xpForCurrentLevel
    const progressPercentage = xpNeeded > 0 ? (xpProgress / xpNeeded) * 100 : 100

    return {
      level,
      xp: totalXP,
      xpForNextLevel,
      xpProgress,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage))
    }
  }

  /**
   * Award XP for completing a lesson
   * @param perfectScore - Whether the user completed with 100% (no mistakes)
   * @returns XP awarded
   */
  static calculateXPAward(perfectScore: boolean = false): number {
    let xp = this.BASE_XP
    if (perfectScore) {
      xp = Math.floor(xp * (1 + this.PERFECT_BONUS))
    }
    return xp
  }

  /**
   * Award XP to user and update level
   */
  static async awardXP(xpAwarded: number): Promise<UserLevelData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get current user profile
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('xp')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', fetchError)
        return null
      }

      const currentXP = profile?.xp || 0
      const newXP = currentXP + xpAwarded
      const newLevelData = this.getUserLevelData(newXP)

      // Update user profile with new XP and level
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          xp: newXP,
          level: newLevelData.level
        }, {
          onConflict: 'user_id'
        })

      if (updateError) {
        console.error('Error updating user XP:', updateError)
        return null
      }

      return newLevelData
    } catch (error) {
      console.error('Error in awardXP:', error)
      return null
    }
  }

  /**
   * Get user's current level data
   */
  static async getUserLevelData(): Promise<UserLevelData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('xp, level')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user level data:', error)
        return null
      }

      const totalXP = profile?.xp || 0
      return this.getUserLevelData(totalXP)
    } catch (error) {
      console.error('Error in getUserLevelData:', error)
      return null
    }
  }
}

