// Достижение
export type Achievement = {
  id: string
  name: string
  description: string
  icon: string // название иконки
  image_url?: string | null // URL изображения достижения
  category: 'competition' | 'league' | 'training' | 'social' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number // очки за получение достижения
  conditions: AchievementCondition[]
  created_at: string
  created_by: string
}

// Условие для получения достижения
export type AchievementCondition = {
  id: string
  type: 'wins_count' | 'competitions_count' | 'total_weight' | 'consecutive_wins' | 'league_position' | 'fish_kind_count' | 'training_days' | 'team_members'
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt'
  value: number
  params?: Record<string, any> // дополнительные параметры
}

// Полученное достижение пользователем
export type UserAchievement = {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  progress?: number // текущий прогресс (если достижение прогрессивное)
  is_notified: boolean
}

// Статистика достижений пользователя
export type UserAchievementStats = {
  user_id: string
  total_achievements: number
  total_points: number
  achievements_by_category: Record<string, number>
  achievements_by_rarity: Record<string, number>
  recent_achievements: UserAchievement[]
}

// Входные данные для создания достижения
export type CreateAchievementInput = {
  name: string
  description: string
  icon: string
  category: 'competition' | 'league' | 'training' | 'social' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  conditions: Omit<AchievementCondition, 'id'>[]
}

// Входные данные для обновления достижения
export type UpdateAchievementInput = {
  name?: string
  description?: string
  icon?: string
  category?: 'competition' | 'league' | 'training' | 'social' | 'special'
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  points?: number
  conditions?: Omit<AchievementCondition, 'id'>[]
}

// Фильтры для достижений
export type AchievementFilters = {
  category?: string
  rarity?: string
  user_id?: string
  earned_only?: boolean
}

// Типы наград
export type Reward = {
  id: string
  name: string
  description: string
  type: 'badge' | 'title' | 'privilege' | 'item'
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  conditions: RewardCondition[]
  created_at: string
  created_by: string
}

// Условие для получения награды
export type RewardCondition = {
  id: string
  type: 'league_position' | 'season_leader' | 'achievement_count' | 'competitions_won' | 'total_points'
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt'
  value: number
  params?: Record<string, any>
}

// Полученная награда пользователем
export type UserReward = {
  id: string
  user_id: string
  reward_id: string
  earned_at: string
  league_id?: string // если награда привязана к лиге
  season?: string
  is_active: boolean
}

// Входные данные для создания награды
export type CreateRewardInput = {
  name: string
  description: string
  type: 'badge' | 'title' | 'privilege' | 'item'
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  conditions: Omit<RewardCondition, 'id'>[]
}

// Входные данные для обновления награды
export type UpdateRewardInput = {
  name?: string
  description?: string
  type?: 'badge' | 'title' | 'privilege' | 'item'
  icon?: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  conditions?: Omit<RewardCondition, 'id'>[]
}
