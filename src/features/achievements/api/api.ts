import { supabase } from '@/lib/supabaseClient'
import type { 
  Achievement, 
  UserAchievement, 
  UserAchievementStats,
  CreateAchievementInput,
  UpdateAchievementInput,
  AchievementFilters,
  Reward,
  UserReward,
  CreateRewardInput,
  UpdateRewardInput
} from '../model/types'

// Таблицы
const ACHIEVEMENTS_TABLE = 'achievements'
const USER_ACHIEVEMENTS_TABLE = 'user_achievements'
const REWARDS_TABLE = 'rewards'
const USER_REWARDS_TABLE = 'user_rewards'

// === ДОСТИЖЕНИЯ ===

export async function fetchAchievements(filters?: AchievementFilters): Promise<Achievement[]> {
  try {
    let query = supabase
      .from(ACHIEVEMENTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.rarity) {
      query = query.eq('rarity', filters.rarity)
    }

    const { data, error } = await query
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return []
      }
      throw error
    }
    return data as Achievement[]
  } catch (error: any) {
    console.warn('Ошибка загрузки достижений:', error.message)
    return []
  }
}

export async function fetchAchievement(achievementId: string): Promise<Achievement | null> {
  const { data, error } = await supabase
    .from(ACHIEVEMENTS_TABLE)
    .select('*')
    .eq('id', achievementId)
    .single()

  if (error) throw error
  return data as Achievement
}

export async function createAchievement(input: CreateAchievementInput, createdBy: string): Promise<Achievement> {
  const { data, error } = await supabase
    .from(ACHIEVEMENTS_TABLE)
    .insert({
      ...input,
      created_by: createdBy
    })
    .select()
    .single()

  if (error) throw error
  return data as Achievement
}

export async function updateAchievement(achievementId: string, input: UpdateAchievementInput): Promise<Achievement> {
  const { data, error } = await supabase
    .from(ACHIEVEMENTS_TABLE)
    .update(input)
    .eq('id', achievementId)
    .select()
    .single()

  if (error) throw error
  return data as Achievement
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  const { error } = await supabase
    .from(ACHIEVEMENTS_TABLE)
    .delete()
    .eq('id', achievementId)

  if (error) throw error
}

// === ПОЛЬЗОВАТЕЛЬСКИЕ ДОСТИЖЕНИЯ ===

export async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from(USER_ACHIEVEMENTS_TABLE)
      .select(`
        *,
        achievements!inner(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return []
      }
      throw error
    }
    return data as UserAchievement[]
  } catch (error: any) {
    console.warn('Ошибка загрузки достижений пользователя:', error.message)
    return []
  }
}

export async function fetchUserAchievementStats(userId: string): Promise<UserAchievementStats> {
  try {
    const { data: achievements, error } = await supabase
      .from(USER_ACHIEVEMENTS_TABLE)
      .select(`
        *,
        achievements!inner(*)
      `)
      .eq('user_id', userId)

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          user_id: userId,
          total_achievements: 0,
          total_points: 0,
          achievements_by_category: {},
          achievements_by_rarity: {},
          recent_achievements: []
        }
      }
      throw error
    }

    const userAchievements = achievements as any[]
    const totalAchievements = userAchievements.length
    const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0)

    // Группировка по категориям
    const achievementsByCategory: Record<string, number> = {}
    const achievementsByRarity: Record<string, number> = {}

    for (const ua of userAchievements) {
      const category = ua.achievements?.category || 'unknown'
      const rarity = ua.achievements?.rarity || 'unknown'
      
      achievementsByCategory[category] = (achievementsByCategory[category] || 0) + 1
      achievementsByRarity[rarity] = (achievementsByRarity[rarity] || 0) + 1
    }

    // Последние достижения
    const recentAchievements = userAchievements
      .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 5)

    return {
      user_id: userId,
      total_achievements: totalAchievements,
      total_points: totalPoints,
      achievements_by_category: achievementsByCategory,
      achievements_by_rarity: achievementsByRarity,
      recent_achievements: recentAchievements
    }
  } catch (error: any) {
    console.warn('Ошибка загрузки статистики достижений:', error.message)
    return {
      user_id: userId,
      total_achievements: 0,
      total_points: 0,
      achievements_by_category: {},
      achievements_by_rarity: {},
      recent_achievements: []
    }
  }
}

export async function checkAndAwardAchievements(userId: string, context: {
  competitionId?: string
  leagueId?: string
  trainingId?: string
  newStats?: Record<string, any>
}): Promise<UserAchievement[]> {
  // Получаем все достижения
  const { data: achievements, error } = await supabase
    .from(ACHIEVEMENTS_TABLE)
    .select('*')

  if (error) throw error

  // Получаем уже полученные достижения пользователя
  const { data: userAchievements, error: uaError } = await supabase
    .from(USER_ACHIEVEMENTS_TABLE)
    .select('achievement_id')
    .eq('user_id', userId)

  if (uaError) throw uaError

  const earnedAchievementIds = new Set((userAchievements || []).map(ua => ua.achievement_id))
  const newAchievements: UserAchievement[] = []

  // Проверяем каждое достижение
  for (const achievement of achievements || []) {
    if (earnedAchievementIds.has(achievement.id)) continue

    // Проверяем условия достижения
    const isEarned = await checkAchievementConditions(achievement, userId, context)
    
    if (isEarned) {
      // Добавляем достижение пользователю
      const { data: newAchievement, error: insertError } = await supabase
        .from(USER_ACHIEVEMENTS_TABLE)
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          earned_at: new Date().toISOString(),
          is_notified: false
        })
        .select()
        .single()

      if (!insertError && newAchievement) {
        newAchievements.push(newAchievement as UserAchievement)
      }
    }
  }

  return newAchievements
}

async function checkAchievementConditions(achievement: Achievement, userId: string, context: any): Promise<boolean> {
  // Здесь должна быть логика проверки условий достижения
  // Это упрощенная версия - в реальности нужно будет получать статистику пользователя
  // и проверять каждое условие
  
  for (const condition of achievement.conditions) {
    let userValue = 0
    
    switch (condition.type) {
      case 'wins_count':
        // Получаем количество побед пользователя
        userValue = await getUserWinsCount(userId, context)
        break
      case 'competitions_count':
        // Получаем количество соревнований
        userValue = await getUserCompetitionsCount(userId, context)
        break
      case 'total_weight':
        // Получаем общий вес пойманной рыбы
        userValue = await getUserTotalWeight(userId, context)
        break
      case 'consecutive_wins':
        // Получаем количество побед подряд
        userValue = await getUserConsecutiveWins(userId, context)
        break
      case 'league_position':
        // Получаем позицию в лиге
        userValue = await getUserLeaguePosition(userId, context.leagueId)
        break
      default:
        continue
    }

    // Проверяем условие
    const conditionMet = checkCondition(userValue, condition.operator, condition.value)
    if (!conditionMet) return false
  }

  return true
}

function checkCondition(value: number, operator: string, targetValue: number): boolean {
  switch (operator) {
    case 'gte': return value >= targetValue
    case 'lte': return value <= targetValue
    case 'eq': return value === targetValue
    case 'gt': return value > targetValue
    case 'lt': return value < targetValue
    default: return false
  }
}

// Вспомогательные функции для получения статистики пользователя
async function getUserWinsCount(_userId: string, _context: any): Promise<number> {
  // Реализация получения количества побед
  return 0
}

async function getUserCompetitionsCount(_userId: string, _context: any): Promise<number> {
  // Реализация получения количества соревнований
  return 0
}

async function getUserTotalWeight(_userId: string, _context: any): Promise<number> {
  // Реализация получения общего веса
  return 0
}

async function getUserConsecutiveWins(_userId: string, _context: any): Promise<number> {
  // Реализация получения побед подряд
  return 0
}

async function getUserLeaguePosition(userId: string, leagueId?: string): Promise<number> {
  if (!leagueId) return 0
  
  // Получаем позицию в лиге
  const { data: rating } = await supabase
    .from('league_participations')
    .select('current_rating')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .single()

  if (!rating) return 0

  // Получаем общий рейтинг лиги для определения позиции
  const { data: allRatings } = await supabase
    .from('league_participations')
    .select('user_id, current_rating')
    .eq('league_id', leagueId)
    .order('current_rating', { ascending: false })

  if (!allRatings) return 0

  const position = allRatings.findIndex(r => r.user_id === userId) + 1
  return position
}

// === НАГРАДЫ ===

export async function fetchRewards(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from(REWARDS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Reward[]
}

export async function fetchReward(rewardId: string): Promise<Reward | null> {
  const { data, error } = await supabase
    .from(REWARDS_TABLE)
    .select('*')
    .eq('id', rewardId)
    .single()

  if (error) throw error
  return data as Reward
}

export async function createReward(input: CreateRewardInput, createdBy: string): Promise<Reward> {
  const { data, error } = await supabase
    .from(REWARDS_TABLE)
    .insert({
      ...input,
      created_by: createdBy
    })
    .select()
    .single()

  if (error) throw error
  return data as Reward
}

export async function updateReward(rewardId: string, input: UpdateRewardInput): Promise<Reward> {
  const { data, error } = await supabase
    .from(REWARDS_TABLE)
    .update(input)
    .eq('id', rewardId)
    .select()
    .single()

  if (error) throw error
  return data as Reward
}

export async function deleteReward(rewardId: string): Promise<void> {
  const { error } = await supabase
    .from(REWARDS_TABLE)
    .delete()
    .eq('id', rewardId)

  if (error) throw error
}

// === ПОЛЬЗОВАТЕЛЬСКИЕ НАГРАДЫ ===

export async function fetchUserRewards(userId: string): Promise<UserReward[]> {
  const { data, error } = await supabase
    .from(USER_REWARDS_TABLE)
    .select(`
      *,
      rewards!inner(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) throw error
  return data as UserReward[]
}

export async function checkAndAwardRewards(userId: string, leagueId: string, season: string): Promise<UserReward[]> {
  // Получаем все награды
  const { data: rewards, error } = await supabase
    .from(REWARDS_TABLE)
    .select('*')

  if (error) throw error

  // Получаем уже полученные награды пользователя в этой лиге/сезоне
  const { data: userRewards, error: urError } = await supabase
    .from(USER_REWARDS_TABLE)
    .select('reward_id')
    .eq('user_id', userId)
    .eq('league_id', leagueId)
    .eq('season', season)

  if (urError) throw urError

  const earnedRewardIds = new Set((userRewards || []).map(ur => ur.reward_id))
  const newRewards: UserReward[] = []

  // Проверяем каждую награду
  for (const reward of rewards || []) {
    if (earnedRewardIds.has(reward.id)) continue

    // Проверяем условия награды
    const isEarned = await checkRewardConditions(reward, userId, leagueId, season)
    
    if (isEarned) {
      // Добавляем награду пользователю
      const { data: newReward, error: insertError } = await supabase
        .from(USER_REWARDS_TABLE)
        .insert({
          user_id: userId,
          reward_id: reward.id,
          earned_at: new Date().toISOString(),
          league_id: leagueId,
          season: season,
          is_active: true
        })
        .select()
        .single()

      if (!insertError && newReward) {
        newRewards.push(newReward as UserReward)
      }
    }
  }

  return newRewards
}

async function checkRewardConditions(reward: Reward, userId: string, leagueId: string, _season: string): Promise<boolean> {
  // Логика проверки условий награды
  // Аналогично достижениям, но для наград
  
  for (const condition of reward.conditions) {
    let userValue = 0
    
    switch (condition.type) {
      case 'league_position':
        userValue = await getUserLeaguePosition(userId, leagueId)
        break
      case 'season_leader':
        // Проверяем, является ли пользователь лидером сезона
        userValue = await getUserLeaguePosition(userId, leagueId) === 1 ? 1 : 0
        break
      case 'achievement_count':
        // Получаем количество достижений
        const stats = await fetchUserAchievementStats(userId)
        userValue = stats.total_achievements
        break
      case 'competitions_won':
        // Получаем количество выигранных соревнований
        userValue = await getUserWinsCount(userId, { leagueId })
        break
      case 'total_points':
        // Получаем общее количество очков в лиге
        const { data: participation } = await supabase
          .from('league_participations')
          .select('total_points')
          .eq('league_id', leagueId)
          .eq('user_id', userId)
          .single()
        userValue = participation?.total_points || 0
        break
      default:
        continue
    }

    const conditionMet = checkCondition(userValue, condition.operator, condition.value)
    if (!conditionMet) return false
  }

  return true
}
