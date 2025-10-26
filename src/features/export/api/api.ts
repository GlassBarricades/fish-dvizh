import { supabase } from '@/lib/supabaseClient'
import type { 
  ExportConfig,
  LeagueRatingExport,
  CompetitionResultsExport,
  UserStatsExport,
  AchievementsExport,
  ExportResult,
  ExportStats
} from '../model/types'

// === ЭКСПОРТ РЕЙТИНГА ЛИГИ ===

export async function exportLeagueRating(input: LeagueRatingExport): Promise<ExportResult> {
  try {
    // Получаем данные рейтинга лиги
    const { data: rating, error } = await supabase
      .from('league_participations')
      .select(`
        *,
        users!inner(id, email, raw_user_meta_data),
        leagues!inner(name, season)
      `)
      .eq('league_id', input.leagueId)
      .order('current_rating', { ascending: false })

    if (error) throw error
    if (!rating) throw new Error('Данные рейтинга не найдены')

    // Формируем данные для экспорта
    const exportData = rating.map((participant: any, index: number) => {
      const baseData = {
        'Место': index + 1,
        'Участник': participant.users?.raw_user_meta_data?.nickname || participant.users?.email || participant.user_id,
        'Email': participant.users?.email || '',
        'Класс': participant.class,
        'Рейтинг': participant.current_rating,
        'Общие очки': participant.total_points,
        'Количество соревнований': participant.competitions_count,
        'Лучшее место': participant.best_place,
        'Последнее обновление': new Date(participant.last_updated).toLocaleString()
      }

      if (input.includeStatistics) {
        // Добавляем дополнительную статистику
        return {
          ...baseData,
          'Лига': participant.leagues?.name || '',
          'Сезон': participant.leagues?.season || '',
          'Дата присоединения': new Date(participant.created_at).toLocaleString()
        }
      }

      return baseData
    })

    // Генерируем файл
    const filename = `league-rating-${input.leagueId}-${new Date().toISOString().split('T')[0]}.${input.config.format}`
    const downloadUrl = await generateExportFile(exportData, input.config, filename)

    return {
      success: true,
      downloadUrl,
      filename,
      size: 0 // Размер будет рассчитан при генерации файла
    }
  } catch (error: any) {
    return {
      success: false,
      filename: '',
      size: 0,
      error: error.message
    }
  }
}

// === ЭКСПОРТ РЕЗУЛЬТАТОВ СОРЕВНОВАНИЯ ===

export async function exportCompetitionResults(input: CompetitionResultsExport): Promise<ExportResult> {
  try {
    // Получаем данные результатов соревнования
    const { data: results, error } = await supabase
      .from('competition_results')
      .select(`
        *,
        users!inner(id, email, raw_user_meta_data),
        competitions!inner(title, starts_at),
        fish_kinds!inner(name)
      `)
      .eq('competition_id', input.competitionId)

    if (error) throw error
    if (!results) throw new Error('Результаты соревнования не найдены')

    // Группируем результаты по пользователям для расчета мест
    const userResults = new Map<string, { weight: number; count: number; userId: string; details: any[] }>()
    
    for (const result of results) {
      const userId = result.participant_user_id
      if (!userResults.has(userId)) {
        userResults.set(userId, { weight: 0, count: 0, userId, details: [] })
      }
      const userResult = userResults.get(userId)!
      userResult.weight += result.weight_grams || 0
      userResult.count += 1
      userResult.details.push(result)
    }

    // Сортируем по весу
    const sortedResults = Array.from(userResults.values())
      .sort((a, b) => b.weight - a.weight || b.count - a.count)

    // Формируем данные для экспорта
    const exportData = sortedResults.map((userResult, index) => {
      const firstDetail = userResult.details[0]
      const baseData = {
        'Место': index + 1,
        'Участник': firstDetail.users?.raw_user_meta_data?.nickname || firstDetail.users?.email || firstDetail.participant_user_id,
        'Email': firstDetail.users?.email || '',
        'Общий вес (г)': userResult.weight,
        'Количество поимок': userResult.count,
        'Средний вес (г)': Math.round(userResult.weight / userResult.count),
        'Соревнование': firstDetail.competitions?.title || '',
        'Дата соревнования': new Date(firstDetail.competitions?.starts_at || '').toLocaleString()
      }

      if (input.includeFishDetails) {
        // Добавляем детали по видам рыбы
        const fishDetails = userResult.details.reduce((acc: any, detail: any) => {
          const fishName = detail.fish_kinds?.name || 'Неизвестно'
          if (!acc[fishName]) {
            acc[fishName] = { count: 0, weight: 0 }
          }
          acc[fishName].count += 1
          acc[fishName].weight += detail.weight_grams || 0
          return acc
        }, {})

        const fishDetailsStr = Object.entries(fishDetails)
          .map(([fish, data]: [string, any]) => `${fish}: ${data.count} шт. (${data.weight}г)`)
          .join(', ')

        return {
          ...baseData,
          'Детали по видам рыбы': fishDetailsStr
        }
      }

      return baseData
    })

    const filename = `competition-results-${input.competitionId}-${new Date().toISOString().split('T')[0]}.${input.config.format}`
    const downloadUrl = await generateExportFile(exportData, input.config, filename)

    return {
      success: true,
      downloadUrl,
      filename,
      size: 0
    }
  } catch (error: any) {
    return {
      success: false,
      filename: '',
      size: 0,
      error: error.message
    }
  }
}

// === ЭКСПОРТ СТАТИСТИКИ ПОЛЬЗОВАТЕЛЯ ===

export async function exportUserStats(input: UserStatsExport): Promise<ExportResult> {
  try {
    const exportData: any[] = []

    // Базовая информация о пользователе
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', input.userId)
      .single()

    if (userError) throw userError

    const baseData = {
      'Пользователь': user.raw_user_meta_data?.nickname || user.email || user.id,
      'Email': user.email || '',
      'Дата регистрации': new Date(user.created_at).toLocaleString(),
      'Последний вход': new Date(user.last_sign_in_at || user.created_at).toLocaleString()
    }

    // Статистика участия в лигах
    const { data: leagueParticipations } = await supabase
      .from('league_participations')
      .select(`
        *,
        leagues!inner(name, season)
      `)
      .eq('user_id', input.userId)

    if (leagueParticipations && leagueParticipations.length > 0) {
      exportData.push({
        ...baseData,
        'Тип данных': 'Участие в лигах',
        'Количество лиг': leagueParticipations.length,
        'Лучший рейтинг': Math.max(...leagueParticipations.map((p: any) => p.current_rating)),
        'Общие очки': leagueParticipations.reduce((sum: number, p: any) => sum + p.total_points, 0),
        'Общее количество соревнований': leagueParticipations.reduce((sum: number, p: any) => sum + p.competitions_count, 0)
      })
    }

    // Статистика достижений
    if (input.includeAchievements) {
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements!inner(name, points, category, rarity)
        `)
        .eq('user_id', input.userId)

      if (achievements && achievements.length > 0) {
        const achievementStats = achievements.reduce((acc: any, ach: any) => {
          acc.totalPoints += ach.achievements?.points || 0
          acc.byCategory[ach.achievements?.category || 'unknown'] = (acc.byCategory[ach.achievements?.category || 'unknown'] || 0) + 1
          acc.byRarity[ach.achievements?.rarity || 'unknown'] = (acc.byRarity[ach.achievements?.rarity || 'unknown'] || 0) + 1
          return acc
        }, { totalPoints: 0, byCategory: {}, byRarity: {} })

        exportData.push({
          ...baseData,
          'Тип данных': 'Достижения',
          'Общее количество достижений': achievements.length,
          'Общие очки достижений': achievementStats.totalPoints,
          'Достижения по категориям': JSON.stringify(achievementStats.byCategory),
          'Достижения по редкости': JSON.stringify(achievementStats.byRarity)
        })
      }
    }

    // Статистика наград
    if (input.includeRewards) {
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select(`
          *,
          rewards!inner(name, type, rarity)
        `)
        .eq('user_id', input.userId)

      if (rewards && rewards.length > 0) {
        exportData.push({
          ...baseData,
          'Тип данных': 'Награды',
          'Общее количество наград': rewards.length,
          'Активные награды': rewards.filter((r: any) => r.is_active).length
        })
      }
    }

    if (exportData.length === 0) {
      exportData.push({
        ...baseData,
        'Тип данных': 'Общая информация',
        'Примечание': 'Данные для экспорта не найдены'
      })
    }

    const filename = `user-stats-${input.userId}-${new Date().toISOString().split('T')[0]}.${input.config.format}`
    const downloadUrl = await generateExportFile(exportData, input.config, filename)

    return {
      success: true,
      downloadUrl,
      filename,
      size: 0
    }
  } catch (error: any) {
    return {
      success: false,
      filename: '',
      size: 0,
      error: error.message
    }
  }
}

// === ЭКСПОРТ ДОСТИЖЕНИЙ ===

export async function exportAchievements(input: AchievementsExport): Promise<ExportResult> {
  try {
    let query = supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false })

    if (input.userId) {
      // Экспортируем только достижения конкретного пользователя
      query = supabase
        .from('user_achievements')
        .select(`
          *,
          achievements!inner(*)
        `)
        .eq('user_id', input.userId)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data) throw new Error('Достижения не найдены')

    const exportData = data.map((item: any) => {
      const achievement = input.userId ? item.achievements : item
      const baseData = {
        'Название': achievement.name,
        'Описание': achievement.description,
        'Категория': achievement.category,
        'Редкость': achievement.rarity,
        'Очки': achievement.points,
        'Иконка': achievement.icon
      }

      if (input.userId && input.includeProgress) {
        return {
          ...baseData,
          'Получено': new Date(item.earned_at).toLocaleString(),
          'Прогресс': item.progress || 'Завершено'
        }
      }

      return baseData
    })

    const filename = `achievements${input.userId ? `-user-${input.userId}` : ''}-${new Date().toISOString().split('T')[0]}.${input.config.format}`
    const downloadUrl = await generateExportFile(exportData, input.config, filename)

    return {
      success: true,
      downloadUrl,
      filename,
      size: 0
    }
  } catch (error: any) {
    return {
      success: false,
      filename: '',
      size: 0,
      error: error.message
    }
  }
}

// === УТИЛИТАРНЫЕ ФУНКЦИИ ===

async function generateExportFile(data: any[], config: ExportConfig, filename: string): Promise<string> {
  // В реальном приложении здесь была бы логика генерации файлов
  // Для демонстрации возвращаем URL для скачивания
  
  switch (config.format) {
    case 'csv':
      return generateCSV(data, filename)
    case 'xlsx':
      return generateXLSX(data, filename)
    case 'pdf':
      return generatePDF(data, filename)
    case 'json':
      return generateJSON(data, filename)
    default:
      throw new Error(`Неподдерживаемый формат: ${config.format}`)
  }
}

function generateCSV(data: any[], _filename: string): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  return URL.createObjectURL(blob)
}

function generateXLSX(data: any[], filename: string): string {
  // В реальном приложении использовался бы библиотека типа xlsx
  // Для демонстрации возвращаем CSV
  return generateCSV(data, filename)
}

function generatePDF(data: any[], filename: string): string {
  // В реальном приложении использовался бы библиотека типа jsPDF
  // Для демонстрации возвращаем JSON
  return generateJSON(data, filename)
}

function generateJSON(data: any[], _filename: string): string {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  return URL.createObjectURL(blob)
}

// === СТАТИСТИКА ЭКСПОРТА ===

export async function getExportStats(): Promise<ExportStats> {
  // В реальном приложении статистика хранилась бы в базе данных
  return {
    totalExports: 0,
    exportsByFormat: {
      csv: 0,
      xlsx: 0,
      pdf: 0,
      json: 0
    },
    exportsByType: {
      league_rating: 0,
      competition_results: 0,
      user_stats: 0,
      achievements: 0
    }
  }
}
