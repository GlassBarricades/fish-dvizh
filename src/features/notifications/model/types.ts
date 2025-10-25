// Уведомление
export type Notification = {
  id: string
  user_id: string
  type: 'achievement' | 'rating_change' | 'league_update' | 'competition_result' | 'reward' | 'system'
  title: string
  message: string
  data?: Record<string, any> // дополнительные данные
  is_read: boolean
  created_at: string
  expires_at?: string
}

// Настройки уведомлений пользователя
export type NotificationSettings = {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  achievement_notifications: boolean
  rating_change_notifications: boolean
  league_update_notifications: boolean
  competition_result_notifications: boolean
  reward_notifications: boolean
  system_notifications: boolean
  updated_at: string
}

// Входные данные для создания уведомления
export type CreateNotificationInput = {
  user_id: string
  type: 'achievement' | 'rating_change' | 'league_update' | 'competition_result' | 'reward' | 'system'
  title: string
  message: string
  data?: Record<string, any>
  expires_at?: string
}

// Входные данные для обновления настроек уведомлений
export type UpdateNotificationSettingsInput = {
  email_notifications?: boolean
  push_notifications?: boolean
  achievement_notifications?: boolean
  rating_change_notifications?: boolean
  league_update_notifications?: boolean
  competition_result_notifications?: boolean
  reward_notifications?: boolean
  system_notifications?: boolean
}

// Статистика уведомлений
export type NotificationStats = {
  total: number
  unread: number
  by_type: Record<string, number>
  recent_count: number
}

// Фильтры для уведомлений
export type NotificationFilters = {
  type?: string
  is_read?: boolean
  limit?: number
  offset?: number
}
