import { supabase } from '@/lib/supabaseClient'
import type { 
  League, 
  RatingConfig, 
  LeagueParticipation, 
  LeagueResult, 
  LeaguePlayerStats,
  CreateLeagueInput, 
  UpdateLeagueInput,
  CreateRatingConfigInput,
  UpdateRatingConfigInput,
  JoinLeagueInput,
  LeagueRatingFilters
} from '../model/types'

// Таблицы
const LEAGUES_TABLE = 'leagues'
const RATING_CONFIGS_TABLE = 'rating_configs'
const LEAGUE_PARTICIPATIONS_TABLE = 'league_participations'
const LEAGUE_RESULTS_TABLE = 'league_results'

// === ВСПОМОГАТЕЛЬНОЕ: статус лиги по датам ===
function computeLeagueStatus(startDateIso: string, endDateIso: string): 'upcoming' | 'active' | 'finished' {
  const now = new Date()
  const start = new Date(startDateIso)
  const end = new Date(endDateIso)
  if (now < start) return 'upcoming'
  if (now > end) return 'finished'
  return 'active'
}

async function ensureLeagueStatuses(leagues: League[]): Promise<void> {
  const updates: { id: string; status: League['status'] }[] = []
  for (const league of leagues) {
    try {
      const expected = computeLeagueStatus(league.start_date, league.end_date)
      if (league.status !== expected) {
        updates.push({ id: league.id, status: expected })
      }
    } catch (_) {
      // ignore parse errors
    }
  }
  if (updates.length > 0) {
    // Обновляем статусы пакетно
    for (const u of updates) {
      await supabase.from(LEAGUES_TABLE).update({ status: u.status }).eq('id', u.id)
    }
  }
}

// === ЛИГИ ===

export async function fetchLeagues(): Promise<League[]> {
  try {
    const { data, error } = await supabase
      .from(LEAGUES_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return []
      }
      throw error
    }
    const leagues = (data || []) as League[]
    // Попробуем синхронизировать статусы по датам (не блокируем вывод)
    ensureLeagueStatuses(leagues).catch(() => {})
    // Обновим статусы на лету для UI
    return leagues.map((l) => ({ ...l, status: computeLeagueStatus(l.start_date, l.end_date) }))
  } catch (error: any) {
    console.warn('Ошибка загрузки лиг:', error.message)
    return []
  }
}

export async function fetchLeague(leagueId: string): Promise<League | null> {
  const { data, error } = await supabase
    .from(LEAGUES_TABLE)
    .select('*')
    .eq('id', leagueId)
    .single()

  if (error) throw error
  return data as League
}

export async function fetchActiveLeagues(): Promise<League[]> {
  try {
    const { data, error } = await supabase
      .from(LEAGUES_TABLE)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return []
      }
      throw error
    }
    return data as League[]
  } catch (error: any) {
    console.warn('Ошибка загрузки активных лиг:', error.message)
    return []
  }
}

export async function createLeague(input: CreateLeagueInput, createdBy: string): Promise<League> {
  const { data, error } = await supabase
    .from(LEAGUES_TABLE)
    .insert({
      ...input,
      created_by: createdBy,
      status: 'upcoming'
    })
    .select()
    .single()

  if (error) throw error
  return data as League
}

export async function updateLeague(leagueId: string, input: UpdateLeagueInput): Promise<League> {
  const { data, error } = await supabase
    .from(LEAGUES_TABLE)
    .update(input)
    .eq('id', leagueId)
    .select()
    .single()

  if (error) throw error
  return data as League
}

export async function deleteLeague(leagueId: string): Promise<void> {
  const { error } = await supabase
    .from(LEAGUES_TABLE)
    .delete()
    .eq('id', leagueId)

  if (error) throw error
}

// === КОНФИГУРАЦИИ РЕЙТИНГА ===

export async function fetchRatingConfigs(): Promise<RatingConfig[]> {
  try {
    const { data, error } = await supabase
      .from(RATING_CONFIGS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Если таблица не существует, возвращаем пустой массив
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return []
      }
      throw error
    }
    return data as RatingConfig[]
  } catch (error: any) {
    // Если произошла ошибка, возвращаем пустой массив
    console.warn('Ошибка загрузки конфигураций рейтинга:', error.message)
    return []
  }
}

export async function fetchRatingConfig(configId: string): Promise<RatingConfig | null> {
  const { data, error } = await supabase
    .from(RATING_CONFIGS_TABLE)
    .select('*')
    .eq('id', configId)
    .single()

  if (error) throw error
  return data as RatingConfig
}

export async function createRatingConfig(input: CreateRatingConfigInput, createdBy: string): Promise<RatingConfig> {
  const { data, error } = await supabase
    .from(RATING_CONFIGS_TABLE)
    .insert({
      ...input,
      created_by: createdBy
    })
    .select()
    .single()

  if (error) throw error
  return data as RatingConfig
}

export async function updateRatingConfig(configId: string, input: UpdateRatingConfigInput): Promise<RatingConfig> {
  const { data, error } = await supabase
    .from(RATING_CONFIGS_TABLE)
    .update(input)
    .eq('id', configId)
    .select()
    .single()

  if (error) throw error
  return data as RatingConfig
}

export async function deleteRatingConfig(configId: string): Promise<void> {
  const { error } = await supabase
    .from(RATING_CONFIGS_TABLE)
    .delete()
    .eq('id', configId)

  if (error) throw error
}

// === УЧАСТИЕ В ЛИГЕ ===

export async function joinLeague(input: JoinLeagueInput): Promise<LeagueParticipation> {
  const { data, error } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .insert({
      ...input,
      current_rating: 0,
      competitions_count: 0,
      best_place: 0,
      total_points: 0
    })
    .select()
    .single()

  if (error) throw error
  return data as LeagueParticipation
}

export async function leaveLeague(leagueId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function fetchLeagueParticipants(leagueId: string): Promise<LeagueParticipation[]> {
  const { data, error } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .select('*')
    .eq('league_id', leagueId)
    .order('current_rating', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data as LeagueParticipation[]
}

export async function fetchUserLeagueParticipations(userId: string): Promise<LeagueParticipation[]> {
  const { data, error } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data as LeagueParticipation[]
}

// === РЕЙТИНГ ЛИГИ ===

export async function fetchLeagueRating(filters: LeagueRatingFilters): Promise<LeaguePlayerStats[]> {
  const { league_id, class: playerClass, min_competitions = 0 } = filters

  // Базовый запрос участников лиги
  let query = supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .select(`
      *,
      users!inner(id, email, raw_user_meta_data)
    `)
    .eq('league_id', league_id)

  // Фильтр по классу
  if (playerClass) {
    query = query.eq('class', playerClass)
  }

  // Фильтр по минимальному количеству соревнований
  if (min_competitions > 0) {
    query = query.gte('competitions_count', min_competitions)
  }

  const { data: participants, error } = await query.order('current_rating', { ascending: false })

  if (error) throw error
  if (!participants) return []

  // Получаем результаты для расчета статистики
  const { data: results, error: resultsError } = await supabase
    .from(LEAGUE_RESULTS_TABLE)
    .select('*')
    .eq('league_id', league_id)
    .in('user_id', participants.map(p => p.user_id))

  if (resultsError) throw resultsError

  // Группируем результаты по пользователям
  const resultsByUser = new Map<string, any[]>()
  for (const result of results || []) {
    if (!resultsByUser.has(result.user_id)) {
      resultsByUser.set(result.user_id, [])
    }
    resultsByUser.get(result.user_id)!.push(result)
  }

  // Для расчета rank_change подготовим прошлый рейтинг (30 дней назад)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const previousPointsByUser = new Map<string, number>()
  for (const participant of participants as any[]) {
    previousPointsByUser.set(participant.user_id, 0)
  }
  for (const r of (results || [])) {
    const createdAt = new Date(r.created_at)
    if (createdAt <= cutoff) {
      previousPointsByUser.set(r.user_id, (previousPointsByUser.get(r.user_id) || 0) + (r.total_points || 0))
    }
  }
  const previousRanking = Array.from(previousPointsByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([userId]) => userId)

  // Формируем статистику
  const stats: LeaguePlayerStats[] = participants.map((participant: any) => {
    const userResults = resultsByUser.get(participant.user_id) || []
    const places = userResults.map(r => r.place).sort((a, b) => a - b)
    const wins = userResults.filter(r => r.place === 1).length
    const top3 = userResults.filter(r => r.place <= 3).length
    const top10 = userResults.filter(r => r.place <= 10).length
    const averagePlace = places.length > 0 ? places.reduce((a, b) => a + b, 0) / places.length : 0

    // Определяем форму (последние 5 соревнований)
    const recentResults = userResults
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
    const recentAveragePlace = recentResults.length > 0 
      ? recentResults.reduce((sum, r) => sum + r.place, 0) / recentResults.length 
      : 0

    let recentForm: 'excellent' | 'good' | 'average' | 'poor' = 'average'
    if (recentAveragePlace <= 3) recentForm = 'excellent'
    else if (recentAveragePlace <= 5) recentForm = 'good'
    else if (recentAveragePlace <= 10) recentForm = 'average'
    else recentForm = 'poor'

    const prevRankIndex = previousRanking.indexOf(participant.user_id)
    // Текущий ранг вычислим после сортировки; временно 0, пересчитаем позже
    return {
      user_id: participant.user_id,
      user_nickname: participant.users?.raw_user_meta_data?.nickname,
      user_email: participant.users?.email,
      current_rating: participant.current_rating,
      competitions_count: participant.competitions_count,
      total_points: participant.total_points,
      best_place: participant.best_place,
      average_place: Math.round(averagePlace * 10) / 10,
      wins_count: wins,
      top3_count: top3,
      top10_count: top10,
      class: participant.class,
      rank_change: Number.isFinite(prevRankIndex) && prevRankIndex >= 0 ? prevRankIndex + 1 : 0,
      recent_form: recentForm
    }
  })

  // Отсортируем по текущему рейтингу и завершим расчет rank_change
  const sorted = stats.sort((a, b) => b.current_rating - a.current_rating)
  for (let i = 0; i < sorted.length; i++) {
    const prevRank = sorted[i].rank_change // временно хранится prevRankIndex+1
    const currentRank = i + 1
    sorted[i].rank_change = prevRank ? prevRank - currentRank : 0
  }

  return sorted
}

// === РЕЗУЛЬТАТЫ В ЛИГЕ ===

export async function addLeagueResult(input: {
  league_id: string
  competition_id: string
  user_id: string
  place: number
  multiplier_applied: number
  bonus_points?: number
}): Promise<LeagueResult> {
  // Получаем конфигурацию рейтинга для расчета очков
  const league = await fetchLeague(input.league_id)
  if (!league) throw new Error('League not found')

  const config = await fetchRatingConfig(league.rating_config_id)
  if (!config) throw new Error('Rating config not found')

  // Рассчитываем очки за место
  const pointsForPlace = config.points_per_place[input.place - 1] || 0
  const pointsEarned = Math.round(pointsForPlace * input.multiplier_applied)
  const bonusPoints = input.bonus_points || 0
  const totalPoints = pointsEarned + bonusPoints

  const { data, error } = await supabase
    .from(LEAGUE_RESULTS_TABLE)
    .insert({
      ...input,
      points_earned: pointsEarned,
      total_points: totalPoints
    })
    .select()
    .single()

  if (error) throw error

  // Обновляем статистику участника
  await updateLeagueParticipantStats(input.league_id, input.user_id)

  return data as LeagueResult
}

// === АВТОМАТИЧЕСКОЕ ДОБАВЛЕНИЕ РЕЗУЛЬТАТОВ В ЛИГУ ===

export async function processCompetitionResults(competitionId: string): Promise<void> {
  // Получаем информацию о соревновании
  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .single()

  if (compError) throw compError
  if (!competition) return

  // Получаем лиги, к которым привязано это соревнование
  const { data: leagueCompetitions, error: leagueError } = await supabase
    .from('league_competitions')
    .select('league_id')
    .eq('competition_id', competitionId)

  if (leagueError) throw leagueError
  if (!leagueCompetitions || leagueCompetitions.length === 0) return

  // Обрабатываем результаты для каждой лиги
  for (const leagueComp of leagueCompetitions) {
    const leagueId = leagueComp.league_id
    
    // Получаем конфигурацию рейтинга лиги
    const league = await fetchLeague(leagueId)
    if (!league) continue

    const config = await fetchRatingConfig(league.rating_config_id)
    if (!config) continue

    // Получаем результаты соревнования
    const { data: results, error: resultsError } = await supabase
      .from('competition_results')
      .select(`
        *,
        users!inner(id, email, raw_user_meta_data)
      `)
      .eq('competition_id', competitionId)

    if (resultsError) throw resultsError
    if (!results || results.length === 0) continue

    // Группируем результаты по пользователям и рассчитываем места
    const userResults = new Map<string, { weight: number; count: number; userId: string }>()
    
    for (const result of results) {
      const userId = result.participant_user_id
      if (!userResults.has(userId)) {
        userResults.set(userId, { weight: 0, count: 0, userId })
      }
      const userResult = userResults.get(userId)!
      userResult.weight += result.weight_grams || 0
      userResult.count += 1
    }

    // Сортируем по весу (места в соревновании)
    const sortedResults = Array.from(userResults.values())
      .sort((a, b) => b.weight - a.weight || b.count - a.count)

    // Получаем множитель для типа соревнования
    const multiplier = config.competition_multipliers[competition.competition_type || 'regular'] || 1.0

    // Добавляем результаты в лигу
    for (let i = 0; i < sortedResults.length; i++) {
      const userResult = sortedResults[i]
      const place = i + 1
      
      // Рассчитываем бонусные очки
      const bonusPoints = await calculateBonusPoints(userResult.userId, place, competition, config)

      await addLeagueResult({
        league_id: leagueId,
        competition_id: competitionId,
        user_id: userResult.userId,
        place: place,
        multiplier_applied: multiplier,
      bonus_points: bonusPoints
    })
  }

    // Проверяем и награждаем достижения
    await checkAchievementsForCompetition(competitionId, leagueId)
  }
}

async function calculateBonusPoints(userId: string, place: number, competition: any, config: any): Promise<number> {
  let bonusPoints = 0

  // Проверяем правила бонусов из конфигурации
  for (const rule of config.bonus_rules) {
    switch (rule.condition) {
      case 'consecutive_wins':
        if (place === 1) {
          const consecutiveWins = await getConsecutiveWins(userId, competition.league_id)
          if (consecutiveWins >= (rule.params?.min_wins || 2)) {
            bonusPoints += rule.value
          }
        }
        break
      case 'participation':
        // Бонус за участие (если указан в параметрах)
        if (rule.params?.always) {
          bonusPoints += rule.value
        }
        break
      case 'record':
        // Бонус за рекорд (если это лучший результат пользователя)
        const isRecord = await isUserRecord(userId, competition.league_id, place)
        if (isRecord) {
          bonusPoints += rule.value
        }
        break
      case 'season_leader':
        // Бонус за лидерство в сезоне
        if (place === 1) {
          const seasonLeader = await isSeasonLeader(userId, competition.league_id)
          if (seasonLeader) {
            bonusPoints += rule.value
          }
        }
        break
    }
  }

  return bonusPoints
}

async function getConsecutiveWins(userId: string, leagueId: string): Promise<number> {
  const { data: recentResults } = await supabase
    .from(LEAGUE_RESULTS_TABLE)
    .select('place')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!recentResults) return 0

  let consecutiveWins = 0
  for (const result of recentResults) {
    if (result.place === 1) {
      consecutiveWins++
    } else {
      break
    }
  }

  return consecutiveWins
}

async function isUserRecord(userId: string, leagueId: string, place: number): Promise<boolean> {
  const { data: bestResult } = await supabase
    .from(LEAGUE_RESULTS_TABLE)
    .select('place')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .order('place', { ascending: true })
    .limit(1)
    .single()

  return bestResult ? place < bestResult.place : true
}

async function isSeasonLeader(userId: string, leagueId: string): Promise<boolean> {
  const { data: participation } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .select('current_rating')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .single()

  if (!participation) return false

  // Проверяем, является ли пользователь лидером по рейтингу
  const { data: leader } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .select('user_id')
    .eq('league_id', leagueId)
    .order('current_rating', { ascending: false })
    .limit(1)
    .single()

  return leader?.user_id === userId
}

async function checkAchievementsForCompetition(competitionId: string, leagueId: string): Promise<void> {
  // Получаем всех участников соревнования
  const { data: participants } = await supabase
    .from('competition_results')
    .select('participant_user_id')
    .eq('competition_id', competitionId)

  if (!participants) return

  const userIds = [...new Set(participants.map(p => p.participant_user_id))]

  // Проверяем достижения для каждого участника
  for (const userId of userIds) {
    try {
      // Импортируем функцию проверки достижений
      const { checkAndAwardAchievements } = await import('@/features/achievements/api/api')
      
      await checkAndAwardAchievements(userId, {
        competitionId,
        leagueId,
        newStats: {
          competition_completed: true,
          league_participation: true
        }
      })
    } catch (error) {
      console.error(`Ошибка проверки достижений для пользователя ${userId}:`, error)
    }
  }
}

// === УТИЛИТАРНЫЕ ФУНКЦИИ ===

export async function recalculateLeagueRating(leagueId: string): Promise<void> {
  // Получаем всех участников лиги
  const { data: participants } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .select('user_id')
    .eq('league_id', leagueId)

  if (!participants) return

  // Пересчитываем статистику для каждого участника
  for (const participant of participants) {
    await updateLeagueParticipantStats(leagueId, participant.user_id)
  }
}

export async function getLeagueSeasonStats(leagueId: string, _season: string): Promise<any[]> {
  // Сначала получаем ID соревнований лиги
  const { data: leagueCompetitions, error: leagueError } = await supabase
    .from('league_competitions')
    .select('competition_id')
    .eq('league_id', leagueId)

  if (leagueError) throw leagueError
  if (!leagueCompetitions || leagueCompetitions.length === 0) return []

  const competitionIds = leagueCompetitions.map(lc => lc.competition_id)

  // Затем получаем статистику для этих соревнований
  const { data: stats, error } = await supabase
    .from(LEAGUE_RESULTS_TABLE)
    .select(`
      *,
      competitions!inner(*),
      users!inner(id, email, raw_user_meta_data)
    `)
    .eq('league_id', leagueId)
    .in('competition_id', competitionIds)

  if (error) throw error
  return stats || []
}

async function updateLeagueParticipantStats(leagueId: string, userId: string): Promise<void> {
  // Получаем все результаты участника в лиге
  const { data: results, error } = await supabase
    .from(LEAGUE_RESULTS_TABLE)
    .select('*')
    .eq('league_id', leagueId)
    .eq('user_id', userId)

  if (error) throw error

  if (!results || results.length === 0) return

  // Рассчитываем статистику
  const totalPoints = results.reduce((sum, r) => sum + r.total_points, 0)
  const bestPlace = Math.min(...results.map(r => r.place))
  const competitionsCount = results.length

  // Обновляем участие в лиге
  const { error: updateError } = await supabase
    .from(LEAGUE_PARTICIPATIONS_TABLE)
    .update({
      current_rating: totalPoints,
      total_points: totalPoints,
      best_place: bestPlace,
      competitions_count: competitionsCount,
      last_updated: new Date().toISOString()
    })
    .eq('league_id', leagueId)
    .eq('user_id', userId)

  if (updateError) throw updateError
}

// === ПОЛУЧЕНИЕ СОРЕВНОВАНИЙ ЛИГИ ===
export async function fetchLeagueCompetitions(leagueId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('league_competitions')
    .select(`
      *,
      competitions!inner(*)
    `)
    .eq('league_id', leagueId)

  if (error) throw error
  
  // Сортируем в JavaScript после получения данных
  const competitions = data?.map(item => item.competitions) || []
  return competitions.sort((a, b) => 
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )
}

// === ПРИВЯЗКА СОРЕВНОВАНИЙ К ЛИГЕ ===
export async function linkCompetitionsToLeague(leagueId: string, competitionIds: string[]): Promise<void> {
  if (!competitionIds || competitionIds.length === 0) return
  
  // Сначала удаляем существующие связи для этой лиги
  const { error: deleteError } = await supabase
    .from('league_competitions')
    .delete()
    .eq('league_id', leagueId)
  
  if (deleteError) throw deleteError
  
  // Затем создаем новые связи
  const links = competitionIds.map(competitionId => ({
    league_id: leagueId,
    competition_id: competitionId
  }))
  
  const { error: insertError } = await supabase
    .from('league_competitions')
    .insert(links)
  
  if (insertError) throw insertError
}

// === ПОЛУЧЕНИЕ ЛИГ СОРЕВНОВАНИЯ ===
export async function fetchCompetitionLeagues(competitionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('league_competitions')
    .select(`
      *,
      leagues!inner(*)
    `)
    .eq('competition_id', competitionId)
    .order('leagues.name', { ascending: true })

  if (error) throw error
  return data?.map(item => item.leagues) || []
}

// === ПРИГЛАШЕНИЯ В ЛИГИ ===

export interface LeagueInvitation {
  id: string
  league_id: string
  email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  token: string
  expires_at: string
  created_at: string
  accepted_at?: string
}

export interface CreateInvitationInput {
  league_id: string
  email: string
  invited_by: string
  expires_in_days?: number
}

export interface AcceptInvitationInput {
  token: string
  user_id: string
}

// Создание приглашения в лигу
export async function createLeagueInvitation(input: CreateInvitationInput): Promise<LeagueInvitation> {
  const { league_id, email, invited_by, expires_in_days = 7 } = input
  
  // Проверяем, что пользователь с таким email еще не приглашен в эту лигу
  const { data: existingInvitations, error: checkError } = await supabase
    .from('league_invitations')
    .select('id, status')
    .eq('league_id', league_id)
    .eq('email', email)

  if (checkError) throw checkError

  if (existingInvitations && existingInvitations.length > 0) {
    const existingInvitation = existingInvitations[0]
    if (existingInvitation.status === 'pending') {
      throw new Error('Пользователь уже приглашен в эту лигу')
    }
    if (existingInvitation.status === 'accepted') {
      throw new Error('Пользователь уже является участником этой лиги')
    }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expires_in_days)

  const { data, error } = await supabase
    .from('league_invitations')
    .insert({
      league_id,
      email,
      invited_by,
      expires_at: expiresAt.toISOString(),
      token: generateInvitationToken()
    })
    .select()
    .single()

  if (error) throw error
  return data as LeagueInvitation
}

// Получение приглашений лиги
export async function fetchLeagueInvitations(leagueId: string): Promise<LeagueInvitation[]> {
  const { data, error } = await supabase
    .from('league_invitations')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as LeagueInvitation[]
}

// Получение всех приглашений пользователя по email
export async function fetchUserInvitations(userEmail: string): Promise<LeagueInvitation[]> {
  const { data, error } = await supabase
    .from('league_invitations')
    .select(`
      *,
      leagues!inner(id, name, description, season, status, start_date, end_date)
    `)
    .eq('email', userEmail)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as LeagueInvitation[]
}

// Получение приглашения по токену
export async function fetchInvitationByToken(token: string): Promise<LeagueInvitation | null> {
  const { data, error } = await supabase
    .from('league_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw error
  }
  return data as LeagueInvitation
}

// Принятие приглашения
export async function acceptLeagueInvitation(input: AcceptInvitationInput): Promise<void> {
  const { token, user_id } = input

  // Получаем приглашение
  const invitation = await fetchInvitationByToken(token)
  if (!invitation) {
    throw new Error('Приглашение не найдено')
  }

  if (invitation.status !== 'pending') {
    throw new Error('Приглашение уже обработано')
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('Приглашение истекло')
  }

  // Начинаем транзакцию
  const { error: updateError } = await supabase
    .from('league_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitation.id)

  if (updateError) throw updateError

  // Добавляем пользователя в лигу
  const { error: joinError } = await supabase
    .from('league_participations')
    .insert({
      league_id: invitation.league_id,
      user_id: user_id,
      class: 'open',
      current_rating: 0,
      total_points: 0,
      competitions_count: 0
    })

  if (joinError) throw joinError
}

// Отклонение приглашения
export async function declineLeagueInvitation(token: string): Promise<void> {
  const { error } = await supabase
    .from('league_invitations')
    .update({ status: 'declined' })
    .eq('token', token)

  if (error) throw error
}

// Отзыв приглашения
export async function revokeLeagueInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('league_invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId)

  if (error) throw error
}

// Повторная отправка приглашения
export async function resendLeagueInvitation(invitationId: string): Promise<LeagueInvitation> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase
    .from('league_invitations')
    .update({
      status: 'pending',
      token: generateInvitationToken(),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single()

  if (error) throw error
  return data as LeagueInvitation
}

// Массовое создание приглашений
export async function createBulkLeagueInvitations(
  leagueId: string, 
  emails: string[], 
  invitedBy: string
): Promise<LeagueInvitation[]> {
  const invitations = emails.map(email => ({
    league_id: leagueId,
    email: email.trim().toLowerCase(),
    invited_by: invitedBy,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней
    token: generateInvitationToken()
  }))

  const { data, error } = await supabase
    .from('league_invitations')
    .insert(invitations)
    .select()

  if (error) throw error
  return data as LeagueInvitation[]
}

// Вспомогательная функция для генерации токена
function generateInvitationToken(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${randomPart}`
}

// Массовое добавление участников в лигу
export interface BulkParticipantInput {
  league_id: string
  participants: Array<{
    email: string
    name?: string
    class?: string
  }>
  invited_by: string
}

export async function bulkAddParticipants(input: BulkParticipantInput): Promise<{
  success: number
  errors: Array<{ email: string; error: string }>
}> {
  const { league_id, participants, invited_by } = input
  const results = {
    success: 0,
    errors: [] as Array<{ email: string; error: string }>
  }

  // Проверяем, что лига существует
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name')
    .eq('id', league_id)
    .single()

  if (leagueError || !league) {
    throw new Error('Лига не найдена')
  }

  // Обрабатываем каждого участника
  for (const participant of participants) {
    try {
      // Проверяем, есть ли уже приглашение для этого email
      const { data: existingInvitation } = await supabase
        .from('league_invitations')
        .select('id, status')
        .eq('league_id', league_id)
        .eq('email', participant.email)
        .single()

      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          results.errors.push({
            email: participant.email,
            error: 'Приглашение уже отправлено'
          })
          continue
        } else if (existingInvitation.status === 'accepted') {
          results.errors.push({
            email: participant.email,
            error: 'Участник уже в лиге'
          })
          continue
        }
      }

      // Создаем приглашение
      const invitationData = {
        league_id,
        email: participant.email,
        invited_by,
        status: 'pending' as const,
        token: generateInvitationToken(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней
      }

      const { error: invitationError } = await supabase
        .from('league_invitations')
        .insert(invitationData)

      if (invitationError) {
        results.errors.push({
          email: participant.email,
          error: invitationError.message
        })
      } else {
        results.success++
      }
    } catch (error) {
      results.errors.push({
        email: participant.email,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  return results
}
