// Типы экспорта
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json'

// Конфигурация экспорта
export type ExportConfig = {
  format: ExportFormat
  includeHeaders: boolean
  dateRange?: {
    start: string
    end: string
  }
  filters?: Record<string, any>
  columns?: string[]
}

// Экспорт рейтинга лиги
export type LeagueRatingExport = {
  leagueId: string
  config: ExportConfig
  includeUserDetails: boolean
  includeStatistics: boolean
}

// Экспорт результатов соревнования
export type CompetitionResultsExport = {
  competitionId: string
  config: ExportConfig
  includeFishDetails: boolean
  includeZoneDetails: boolean
}

// Экспорт статистики пользователя
export type UserStatsExport = {
  userId: string
  config: ExportConfig
  includeAchievements: boolean
  includeRewards: boolean
  includeTrainingData: boolean
}

// Экспорт достижений
export type AchievementsExport = {
  userId?: string // если не указан, экспортируются все достижения
  config: ExportConfig
  includeProgress: boolean
}

// Результат экспорта
export type ExportResult = {
  success: boolean
  downloadUrl?: string
  filename: string
  size: number
  error?: string
}

// Статистика экспорта
export type ExportStats = {
  totalExports: number
  exportsByFormat: Record<ExportFormat, number>
  exportsByType: Record<string, number>
  lastExport?: string
}
