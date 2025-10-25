// Типы для системы бонусов и специальных правил

// Тип бонуса
export type BonusType = 
  | 'points_multiplier'     // Множитель очков
  | 'rating_boost'          // Увеличение рейтинга
  | 'achievement_unlock'    // Разблокировка достижения
  | 'special_title'         // Специальный титул
  | 'exclusive_access'      // Эксклюзивный доступ
  | 'custom_reward'         // Пользовательская награда

// Условие активации бонуса
export type BonusCondition = {
  type: 'competition_place' | 'total_weight' | 'fish_count' | 'consecutive_wins' | 'season_performance' | 'custom'
  operator: 'equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'between'
  value: number | [number, number] // Для between - диапазон
  description?: string
}

// Бонус
export type Bonus = {
  id: string
  name: string
  description: string
  type: BonusType
  value: number | string // Значение бонуса (множитель, количество очков, название титула и т.д.)
  conditions: BonusCondition[]
  is_active: boolean
  expires_at?: string
  max_uses?: number
  current_uses: number
  league_id?: string // Если бонус привязан к конкретной лиге
  created_at: string
  updated_at: string
}

// Специальное правило
export type SpecialRule = {
  id: string
  name: string
  description: string
  type: 'scoring_modifier' | 'participation_requirement' | 'bonus_trigger' | 'penalty_rule' | 'custom'
  conditions: BonusCondition[]
  effects: {
    type: 'multiply_points' | 'add_points' | 'subtract_points' | 'modify_rating' | 'unlock_feature' | 'custom'
    value: number | string
    description: string
  }[]
  is_active: boolean
  league_id?: string
  competition_id?: string
  priority: number // Приоритет применения (чем выше, тем раньше применяется)
  created_at: string
  updated_at: string
}

// Пользовательский бонус
export type UserBonus = {
  id: string
  user_id: string
  bonus_id: string
  earned_at: string
  expires_at?: string
  is_active: boolean
  used_at?: string
  bonus?: Bonus
}

// Пользовательское специальное правило
export type UserSpecialRule = {
  id: string
  user_id: string
  rule_id: string
  applied_at: string
  expires_at?: string
  is_active: boolean
  rule?: SpecialRule
}

// Создание бонуса
export type CreateBonusInput = {
  name: string
  description: string
  type: BonusType
  value: number | string
  conditions: BonusCondition[]
  expires_at?: string
  max_uses?: number
  league_id?: string
}

// Обновление бонуса
export type UpdateBonusInput = {
  name?: string
  description?: string
  type?: BonusType
  value?: number | string
  conditions?: BonusCondition[]
  is_active?: boolean
  expires_at?: string
  max_uses?: number
  league_id?: string
}

// Создание специального правила
export type CreateSpecialRuleInput = {
  name: string
  description: string
  type: 'scoring_modifier' | 'participation_requirement' | 'bonus_trigger' | 'penalty_rule' | 'custom'
  conditions: BonusCondition[]
  effects: {
    type: 'multiply_points' | 'add_points' | 'subtract_points' | 'modify_rating' | 'unlock_feature' | 'custom'
    value: number | string
    description: string
  }[]
  league_id?: string
  competition_id?: string
  priority: number
}

// Обновление специального правила
export type UpdateSpecialRuleInput = {
  name?: string
  description?: string
  type?: 'scoring_modifier' | 'participation_requirement' | 'bonus_trigger' | 'penalty_rule' | 'custom'
  conditions?: BonusCondition[]
  effects?: {
    type: 'multiply_points' | 'add_points' | 'subtract_points' | 'modify_rating' | 'unlock_feature' | 'custom'
    value: number | string
    description: string
  }[]
  is_active?: boolean
  league_id?: string
  competition_id?: string
  priority?: number
}

// Результат применения бонуса
export type BonusApplicationResult = {
  bonus_id: string
  user_id: string
  applied_at: string
  points_gained?: number
  rating_change?: number
  achievement_unlocked?: string
  special_title_granted?: string
  custom_reward?: string
}

// Статистика бонусов
export type BonusStats = {
  total_bonuses: number
  active_bonuses: number
  bonuses_by_type: Record<BonusType, number>
  total_uses: number
  most_popular_bonus?: string
  recent_activations: BonusApplicationResult[]
}

// Конфигурация системы бонусов
export type BonusSystemConfig = {
  id: string
  name: string
  description: string
  auto_apply_bonuses: boolean
  max_bonuses_per_user: number
  bonus_cooldown_hours: number
  special_rules_enabled: boolean
  custom_bonuses_enabled: boolean
  created_at: string
  updated_at: string
}
