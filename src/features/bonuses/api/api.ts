import { supabase } from '@/lib/supabaseClient'
import type { 
  Bonus,
  SpecialRule,
  UserBonus,
  CreateBonusInput,
  UpdateBonusInput,
  CreateSpecialRuleInput,
  UpdateSpecialRuleInput,
  BonusApplicationResult,
  BonusStats,
  BonusSystemConfig,
  BonusCondition
} from '../model/types'

// === УПРАВЛЕНИЕ БОНУСАМИ ===

export async function getBonuses(leagueId?: string): Promise<Bonus[]> {
  try {
    let query = supabase
      .from('bonuses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (leagueId) {
      query = query.or(`league_id.is.null,league_id.eq.${leagueId}`)
    }

    const { data, error } = await query
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return []
      }
      throw error
    }
    return data || []
  } catch (error: any) {
    console.warn('Ошибка загрузки бонусов:', error.message)
    return []
  }
}

export async function getBonus(id: string): Promise<Bonus | null> {
  const { data, error } = await supabase
    .from('bonuses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createBonus(input: CreateBonusInput): Promise<Bonus> {
  const { data, error } = await supabase
    .from('bonuses')
    .insert({
      ...input,
      current_uses: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBonus(id: string, input: UpdateBonusInput): Promise<Bonus> {
  const { data, error } = await supabase
    .from('bonuses')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBonus(id: string): Promise<void> {
  const { error } = await supabase
    .from('bonuses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// === УПРАВЛЕНИЕ СПЕЦИАЛЬНЫМИ ПРАВИЛАМИ ===

export async function getSpecialRules(leagueId?: string, competitionId?: string): Promise<SpecialRule[]> {
  try {
    let query = supabase
      .from('special_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (leagueId) {
      query = query.or(`league_id.is.null,league_id.eq.${leagueId}`)
    }

    if (competitionId) {
      query = query.or(`competition_id.is.null,competition_id.eq.${competitionId}`)
    }

    const { data, error } = await query
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return []
      }
      throw error
    }
    return data || []
  } catch (error: any) {
    console.warn('Ошибка загрузки специальных правил:', error.message)
    return []
  }
}

export async function getSpecialRule(id: string): Promise<SpecialRule | null> {
  const { data, error } = await supabase
    .from('special_rules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createSpecialRule(input: CreateSpecialRuleInput): Promise<SpecialRule> {
  const { data, error } = await supabase
    .from('special_rules')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSpecialRule(id: string, input: UpdateSpecialRuleInput): Promise<SpecialRule> {
  const { data, error } = await supabase
    .from('special_rules')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSpecialRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('special_rules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// === ПОЛЬЗОВАТЕЛЬСКИЕ БОНУСЫ ===

export async function getUserBonuses(userId: string, activeOnly = true): Promise<UserBonus[]> {
  let query = supabase
    .from('user_bonuses')
    .select(`
      *,
      bonuses!inner(*)
    `)
    .eq('user_id', userId)

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function grantBonusToUser(userId: string, bonusId: string): Promise<UserBonus> {
  // Проверяем, не превышен ли лимит использований бонуса
  const bonus = await getBonus(bonusId)
  if (!bonus) throw new Error('Бонус не найден')

  if (bonus.max_uses && bonus.current_uses >= bonus.max_uses) {
    throw new Error('Достигнут лимит использований бонуса')
  }

  // Проверяем, не истек ли бонус
  if (bonus.expires_at && new Date(bonus.expires_at) < new Date()) {
    throw new Error('Бонус истек')
  }

  // Создаем пользовательский бонус
  const { data, error } = await supabase
    .from('user_bonuses')
    .insert({
      user_id: userId,
      bonus_id: bonusId,
      earned_at: new Date().toISOString(),
      expires_at: bonus.expires_at,
      is_active: true
    })
    .select(`
      *,
      bonuses!inner(*)
    `)
    .single()

  if (error) throw error

  // Увеличиваем счетчик использований бонуса
  await supabase
    .from('bonuses')
    .update({ current_uses: bonus.current_uses + 1 })
    .eq('id', bonusId)

  return data
}

export async function useUserBonus(userBonusId: string): Promise<void> {
  const { error } = await supabase
    .from('user_bonuses')
    .update({ 
      is_active: false,
      used_at: new Date().toISOString()
    })
    .eq('id', userBonusId)

  if (error) throw error
}

// === ПРИМЕНЕНИЕ БОНУСОВ И ПРАВИЛ ===

export async function checkAndApplyBonuses(
  userId: string, 
  competitionId: string, 
  leagueId?: string
): Promise<BonusApplicationResult[]> {
  const results: BonusApplicationResult[] = []

  // Получаем результаты соревнования пользователя
  const { data: competitionResults } = await supabase
    .from('competition_results')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('participant_user_id', userId)

  if (!competitionResults || competitionResults.length === 0) {
    return results
  }

  // Получаем доступные бонусы
  const bonuses = await getBonuses(leagueId)

  for (const bonus of bonuses) {
    if (await checkBonusConditions(bonus, competitionResults, userId)) {
      const result = await applyBonus(bonus, userId, competitionResults)
      if (result) {
        results.push(result)
      }
    }
  }

  return results
}

async function checkBonusConditions(
  bonus: Bonus, 
  competitionResults: any[], 
  userId: string
): Promise<boolean> {
  for (const condition of bonus.conditions) {
    if (!(await evaluateCondition(condition, competitionResults, userId))) {
      return false
    }
  }
  return true
}

async function evaluateCondition(
  condition: BonusCondition, 
  competitionResults: any[], 
  userId: string
): Promise<boolean> {
  switch (condition.type) {
    case 'competition_place':
      const place = await getUserCompetitionPlace(userId, competitionResults[0].competition_id)
      return compareValues(place, condition.operator, condition.value)

    case 'total_weight':
      const totalWeight = competitionResults.reduce((sum, result) => sum + (result.weight_grams || 0), 0)
      return compareValues(totalWeight, condition.operator, condition.value)

    case 'fish_count':
      const fishCount = competitionResults.length
      return compareValues(fishCount, condition.operator, condition.value)

    case 'consecutive_wins':
      const consecutiveWins = await getUserConsecutiveWins(userId)
      return compareValues(consecutiveWins, condition.operator, condition.value)

    case 'season_performance':
      const seasonPerformance = await getUserSeasonPerformance(userId)
      return compareValues(seasonPerformance, condition.operator, condition.value)

    default:
      return false
  }
}

function compareValues(actual: number, operator: string, expected: number | [number, number]): boolean {
  switch (operator) {
    case 'equals':
      return actual === expected
    case 'greater_than':
      return actual > (expected as number)
    case 'less_than':
      return actual < (expected as number)
    case 'greater_equal':
      return actual >= (expected as number)
    case 'less_equal':
      return actual <= (expected as number)
    case 'between':
      const [min, max] = expected as [number, number]
      return actual >= min && actual <= max
    default:
      return false
  }
}

async function getUserCompetitionPlace(userId: string, competitionId: string): Promise<number> {
  // Получаем все результаты соревнования и сортируем по весу
  const { data: allResults } = await supabase
    .from('competition_results')
    .select('participant_user_id, weight_grams')
    .eq('competition_id', competitionId)

  if (!allResults) return 0

  // Группируем по пользователям и считаем общий вес
  const userWeights = new Map<string, number>()
  for (const result of allResults) {
    const userId = result.participant_user_id
    userWeights.set(userId, (userWeights.get(userId) || 0) + (result.weight_grams || 0))
  }

  // Сортируем по весу
  const sortedUsers = Array.from(userWeights.entries())
    .sort(([, a], [, b]) => b - a)

  // Находим место пользователя
  const userIndex = sortedUsers.findIndex(([id]) => id === userId)
  return userIndex + 1
}

async function getUserConsecutiveWins(userId: string): Promise<number> {
  // Получаем последние соревнования пользователя
  const { data: competitions } = await supabase
    .from('competition_results')
    .select('competition_id, weight_grams')
    .eq('participant_user_id', userId)
    .order('created_at', { ascending: false })

  if (!competitions) return 0

  // Группируем по соревнованиям
  const competitionWeights = new Map<string, number>()
  for (const result of competitions) {
    competitionWeights.set(result.competition_id, 
      (competitionWeights.get(result.competition_id) || 0) + (result.weight_grams || 0))
  }

  // Считаем последовательные победы
  let consecutiveWins = 0
  const sortedCompetitions = Array.from(competitionWeights.entries())
    .sort(([, a], [, b]) => b - a)

  for (let i = 0; i < sortedCompetitions.length; i++) {
    const [competitionId, _weight] = sortedCompetitions[i]
    const userWeight = competitionWeights.get(competitionId) || 0
    
    // Проверяем, выиграл ли пользователь это соревнование
    const { data: allResults } = await supabase
      .from('competition_results')
      .select('participant_user_id, weight_grams')
      .eq('competition_id', competitionId)

    if (allResults) {
      const allWeights = new Map<string, number>()
      for (const result of allResults) {
        allWeights.set(result.participant_user_id, 
          (allWeights.get(result.participant_user_id) || 0) + (result.weight_grams || 0))
      }

      const maxWeight = Math.max(...Array.from(allWeights.values()))
      if (userWeight === maxWeight) {
        consecutiveWins++
      } else {
        break
      }
    }
  }

  return consecutiveWins
}

async function getUserSeasonPerformance(userId: string): Promise<number> {
  // Получаем статистику пользователя за текущий сезон
  const { data: participations } = await supabase
    .from('league_participations')
    .select('total_points, competitions_count')
    .eq('user_id', userId)

  if (!participations || participations.length === 0) return 0

  const totalPoints = participations.reduce((sum, p) => sum + p.total_points, 0)
  const totalCompetitions = participations.reduce((sum, p) => sum + p.competitions_count, 0)

  return totalCompetitions > 0 ? totalPoints / totalCompetitions : 0
}

async function applyBonus(
  bonus: Bonus, 
  userId: string, 
  competitionResults: any[]
): Promise<BonusApplicationResult | null> {
  try {
    // Предоставляем бонус пользователю
    await grantBonusToUser(userId, bonus.id)

    const result: BonusApplicationResult = {
      bonus_id: bonus.id,
      user_id: userId,
      applied_at: new Date().toISOString()
    }

    // Применяем эффекты бонуса
    switch (bonus.type) {
      case 'points_multiplier':
        const multiplier = bonus.value as number
        const basePoints = competitionResults.reduce((sum, result) => sum + (result.points || 0), 0)
        result.points_gained = Math.round(basePoints * (multiplier - 1))
        break

      case 'rating_boost':
        result.rating_change = bonus.value as number
        break

      case 'achievement_unlock':
        result.achievement_unlocked = bonus.value as string
        break

      case 'special_title':
        result.special_title_granted = bonus.value as string
        break

      case 'custom_reward':
        result.custom_reward = bonus.value as string
        break
    }

    return result
  } catch (error) {
    console.error('Ошибка применения бонуса:', error)
    return null
  }
}

// === СТАТИСТИКА БОНУСОВ ===

export async function getBonusStats(): Promise<BonusStats> {
  const { data: bonuses } = await supabase
    .from('bonuses')
    .select('*')

  const { data: _userBonuses } = await supabase
    .from('user_bonuses')
    .select('*')
    .gte('earned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // За последнюю неделю

  const totalBonuses = bonuses?.length || 0
  const activeBonuses = bonuses?.filter(b => b.is_active).length || 0
  const totalUses = bonuses?.reduce((sum, b) => sum + b.current_uses, 0) || 0

  const bonusesByType = bonuses?.reduce((acc, bonus) => {
    acc[bonus.type] = (acc[bonus.type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const mostPopularBonus = bonuses?.reduce((max, bonus) => 
    bonus.current_uses > max.current_uses ? bonus : max
  )?.name

  return {
    total_bonuses: totalBonuses,
    active_bonuses: activeBonuses,
    bonuses_by_type: bonusesByType as any,
    total_uses: totalUses,
    most_popular_bonus: mostPopularBonus,
    recent_activations: [] // TODO: реализовать получение недавних активаций
  }
}

// === КОНФИГУРАЦИЯ СИСТЕМЫ БОНУСОВ ===

export async function getBonusSystemConfig(): Promise<BonusSystemConfig | null> {
  const { data, error } = await supabase
    .from('bonus_system_config')
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateBonusSystemConfig(input: Partial<BonusSystemConfig>): Promise<BonusSystemConfig> {
  const { data, error } = await supabase
    .from('bonus_system_config')
    .upsert(input)
    .select()
    .single()

  if (error) throw error
  return data
}
