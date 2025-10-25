// Лига
export type League = {
  id: string
  name: string
  description?: string | null
  image_url?: string | null // URL изображения лиги
  season: string // "2024-spring", "2024-summer", "2024-autumn", "2024-winter"
  start_date: string
  end_date: string
  status: 'upcoming' | 'active' | 'finished'
  rating_config_id: string
  created_by: string
  created_at: string
  updated_at: string
}

// Конфигурация рейтинга
export type RatingConfig = {
  id: string
  name: string
  description?: string | null
  points_per_place: number[] // [100, 80, 60, 50, 40, 30, 20, 10, 5, 1]
  competition_multipliers: Record<string, number> // { "championship": 2.0, "regular": 1.0 }
  decay_period_months: number // период затухания старых результатов
  min_competitions: number // минимальное количество соревнований для попадания в рейтинг
  bonus_rules: BonusRule[]
  created_by: string
  created_at: string
}

// Правила бонусов
export type BonusRule = {
  id: string
  name: string
  description: string
  condition: 'consecutive_wins' | 'participation' | 'record' | 'season_leader'
  value: number // количество бонусных очков
  params?: Record<string, any> // дополнительные параметры
}

// Участие в лиге
export type LeagueParticipation = {
  id: string
  league_id: string
  user_id: string
  class: 'novice' | 'amateur' | 'professional'
  current_rating: number
  competitions_count: number
  best_place: number
  total_points: number
  last_updated: string
  created_at: string
}

// Результат в лиге
export type LeagueResult = {
  id: string
  league_id: string
  competition_id: string
  user_id: string
  place: number
  points_earned: number
  multiplier_applied: number
  bonus_points: number
  total_points: number
  created_at: string
}

// Статистика участника в лиге
export type LeaguePlayerStats = {
  user_id: string
  user_nickname?: string
  user_email?: string
  current_rating: number
  competitions_count: number
  total_points: number
  best_place: number
  average_place: number
  wins_count: number
  top3_count: number
  top10_count: number
  class: 'novice' | 'amateur' | 'professional'
  rank_change: number // изменение позиции за последний период
  recent_form: 'excellent' | 'good' | 'average' | 'poor'
}

// Входные данные для создания лиги
export type CreateLeagueInput = {
  name: string
  description?: string
  image_url?: string
  season: string
  start_date: string
  end_date: string
  rating_config_id: string
}

// Входные данные для обновления лиги
export type UpdateLeagueInput = {
  name?: string
  description?: string
  image_url?: string
  season?: string
  start_date?: string
  end_date?: string
  rating_config_id?: string
  status?: 'upcoming' | 'active' | 'finished'
}

// Входные данные для создания конфигурации рейтинга
export type CreateRatingConfigInput = {
  name: string
  description?: string
  points_per_place: number[]
  competition_multipliers: Record<string, number>
  decay_period_months: number
  min_competitions: number
  bonus_rules: Omit<BonusRule, 'id'>[]
}

// Входные данные для обновления конфигурации рейтинга
export type UpdateRatingConfigInput = {
  name?: string
  description?: string
  points_per_place?: number[]
  competition_multipliers?: Record<string, number>
  decay_period_months?: number
  min_competitions?: number
  bonus_rules?: Omit<BonusRule, 'id'>[]
}

// Входные данные для регистрации в лиге
export type JoinLeagueInput = {
  league_id: string
  user_id: string
  class: 'novice' | 'amateur' | 'professional'
}

// Фильтры для рейтинга
export type LeagueRatingFilters = {
  league_id: string
  class?: 'novice' | 'amateur' | 'professional'
  min_competitions?: number
  period?: 'all' | 'month' | 'season'
}
