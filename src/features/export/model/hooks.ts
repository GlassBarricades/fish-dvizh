import { useMutation, useQuery } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import {
  exportLeagueRating,
  exportCompetitionResults,
  exportUserStats,
  exportAchievements,
  getExportStats
} from '../api/api'
import type {
  ExportResult
} from '../model/types'

// === ЭКСПОРТ РЕЙТИНГА ЛИГИ ===

export function useExportLeagueRating() {
  return useMutation({
    mutationFn: exportLeagueRating,
    onSuccess: (result: ExportResult) => {
      if (result.success && result.downloadUrl) {
        // Создаем ссылку для скачивания
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        notifications.show({ 
          color: 'green', 
          message: `Экспорт рейтинга лиги завершен. Файл: ${result.filename}` 
        })
      } else {
        notifications.show({ 
          color: 'red', 
          message: result.error || 'Ошибка экспорта рейтинга лиги' 
        })
      }
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка экспорта' })
    }
  })
}

// === ЭКСПОРТ РЕЗУЛЬТАТОВ СОРЕВНОВАНИЯ ===

export function useExportCompetitionResults() {
  return useMutation({
    mutationFn: exportCompetitionResults,
    onSuccess: (result: ExportResult) => {
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        notifications.show({ 
          color: 'green', 
          message: `Экспорт результатов соревнования завершен. Файл: ${result.filename}` 
        })
      } else {
        notifications.show({ 
          color: 'red', 
          message: result.error || 'Ошибка экспорта результатов соревнования' 
        })
      }
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка экспорта' })
    }
  })
}

// === ЭКСПОРТ СТАТИСТИКИ ПОЛЬЗОВАТЕЛЯ ===

export function useExportUserStats() {
  return useMutation({
    mutationFn: exportUserStats,
    onSuccess: (result: ExportResult) => {
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        notifications.show({ 
          color: 'green', 
          message: `Экспорт статистики пользователя завершен. Файл: ${result.filename}` 
        })
      } else {
        notifications.show({ 
          color: 'red', 
          message: result.error || 'Ошибка экспорта статистики пользователя' 
        })
      }
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка экспорта' })
    }
  })
}

// === ЭКСПОРТ ДОСТИЖЕНИЙ ===

export function useExportAchievements() {
  return useMutation({
    mutationFn: exportAchievements,
    onSuccess: (result: ExportResult) => {
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        notifications.show({ 
          color: 'green', 
          message: `Экспорт достижений завершен. Файл: ${result.filename}` 
        })
      } else {
        notifications.show({ 
          color: 'red', 
          message: result.error || 'Ошибка экспорта достижений' 
        })
      }
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка экспорта' })
    }
  })
}

// === СТАТИСТИКА ЭКСПОРТА ===

export function useExportStats() {
  return useQuery({
    queryKey: ['export-stats'],
    queryFn: getExportStats
  })
}

// === УТИЛИТАРНЫЕ ХУКИ ===

// Универсальный хук для экспорта с автоматическим скачиванием
export function useExportWithDownload() {
  const exportLeagueRating = useExportLeagueRating()
  const exportCompetitionResults = useExportCompetitionResults()
  const exportUserStats = useExportUserStats()
  const exportAchievements = useExportAchievements()

  const handleExport = async (type: 'league' | 'competition' | 'user' | 'achievements', data: any) => {
    switch (type) {
      case 'league':
        await exportLeagueRating.mutateAsync(data)
        break
      case 'competition':
        await exportCompetitionResults.mutateAsync(data)
        break
      case 'user':
        await exportUserStats.mutateAsync(data)
        break
      case 'achievements':
        await exportAchievements.mutateAsync(data)
        break
      default:
        throw new Error(`Неподдерживаемый тип экспорта: ${type}`)
    }
  }

  return {
    handleExport,
    isLoading: exportLeagueRating.isPending || 
               exportCompetitionResults.isPending || 
               exportUserStats.isPending || 
               exportAchievements.isPending
  }
}
