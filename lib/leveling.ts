import { supabase } from './supabaseClient'
import { ProgressManager } from './progress'

export interface UserLevelData {
  level: number
  xp: number
  xpForNextLevel: number
  xpProgress: number
  progressPercentage: number
}

export class LevelingSystem {
  // XP awarded per lesson based on score
  static calculateXPForScore(score: number): number {
    if (score >= 100) return 50
    if (score >= 80)  return 40
    if (score >= 70)  return 30
    if (score >= 60)  return 20
    return 10
  }

  static getXPForLevel(level: number): number {
    if (level <= 1) return 0
    if (level === 2) return 15
    let totalXP = 15
    for (let i = 3; i <= level; i++) {
      totalXP += 15 + (i - 2) * 5
    }
    return totalXP
  }

  static calculateLevel(totalXP: number): number {
    if (totalXP < 15) return 1
    let level = 1
    let nextLevelXP = this.getXPForLevel(level + 1)
    while (totalXP >= nextLevelXP) {
      level++
      nextLevelXP = this.getXPForLevel(level + 1)
      if (level > 100) break
    }
    return level
  }

  static calculateUserLevelData(totalXP: number): UserLevelData {
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

  // Get user level data — now reads XP from progress table
  static async getUserLevelData(): Promise<UserLevelData | null> {
    try {
      const totalXP = await ProgressManager.getTotalXP()
      return this.calculateUserLevelData(totalXP)
    } catch (error) {
      console.error('Error in getUserLevelData:', error)
      return null
    }
  }
}
