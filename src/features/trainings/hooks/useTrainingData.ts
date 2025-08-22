import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { 
  fetchTrainingById, 
  listTrainingCatches, 
  listTrainingEvents, 
  listTrainingTakenUserBaits,
  listTrainingSegments,
  listTrainingTasks
} from '../api'
import type { Training } from '../types'
import type { TrainingCatch, TrainingEvent, TrainingTakenUserBait, TrainingSegment, TrainingTask } from '../api'

interface TrainingData {
  training: Training | null
  catches: TrainingCatch[]
  events: TrainingEvent[]
  takenBaits: TrainingTakenUserBait[]
  segments: TrainingSegment[]
  tasks: TrainingTask[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useTrainingData(trainingId: string | undefined, userId?: string): TrainingData {
  // const queryClient = useQueryClient() // Пока не используется

  const queries = useQueries({
    queries: [
      {
        queryKey: ['training', trainingId],
        queryFn: () => fetchTrainingById(trainingId!),
        enabled: !!trainingId,
        staleTime: 10 * 60 * 1000, // 10 минут - тренировка редко меняется
        gcTime: 30 * 60 * 1000, // 30 минут - дольше держим в памяти
        refetchOnWindowFocus: false, // Не перезагружаем при фокусе окна
        refetchOnMount: false, // Не перезагружаем при монтировании, если есть кэш
      },
      {
        queryKey: ['training-catches', trainingId],
        queryFn: () => listTrainingCatches(trainingId!),
        enabled: !!trainingId,
        staleTime: 1 * 60 * 1000, // 1 минута - поимки могут часто добавляться
        gcTime: 10 * 60 * 1000, // 10 минут
        refetchOnWindowFocus: true, // Перезагружаем при фокусе для актуальности
        refetchOnMount: true, // Перезагружаем при монтировании
      },
      {
        queryKey: ['training-events', trainingId],
        queryFn: () => listTrainingEvents(trainingId!),
        enabled: !!trainingId,
        staleTime: 1 * 60 * 1000, // 1 минута - события могут часто добавляться
        gcTime: 10 * 60 * 1000, // 10 минут
        refetchOnWindowFocus: true, // Перезагружаем при фокусе для актуальности
        refetchOnMount: true, // Перезагружаем при монтировании
      },
      {
        queryKey: ['training-taken-baits', trainingId, userId],
        queryFn: () => listTrainingTakenUserBaits(trainingId!, userId!),
        enabled: !!trainingId && !!userId,
        staleTime: 15 * 60 * 1000, // 15 минут - приманки редко меняются
        gcTime: 60 * 60 * 1000, // 1 час - долго держим в памяти
        refetchOnWindowFocus: false, // Не перезагружаем при фокусе
        refetchOnMount: false, // Не перезагружаем при монтировании
      },
      {
        queryKey: ['training-segments', trainingId],
        queryFn: () => listTrainingSegments(trainingId!),
        enabled: !!trainingId,
        staleTime: 30 * 60 * 1000, // 30 минут - сегменты редко меняются
        gcTime: 2 * 60 * 60 * 1000, // 2 часа - очень долго держим в памяти
        refetchOnWindowFocus: false, // Не перезагружаем при фокусе
        refetchOnMount: false, // Не перезагружаем при монтировании
      },
      {
        queryKey: ['training-tasks', trainingId],
        queryFn: () => listTrainingTasks(trainingId!),
        enabled: !!trainingId,
        staleTime: 5 * 60 * 1000, // 5 минут - задачи могут меняться
        gcTime: 15 * 60 * 1000, // 15 минут
        refetchOnWindowFocus: true, // Перезагружаем при фокусе для актуальности
        refetchOnMount: true, // Перезагружаем при монтировании
      }
    ],
    combine: (results) => {
      const [training, catches, events, takenBaits, segments, tasks] = results
      
      return {
        data: [
          training.data,
          catches.data || [],
          events.data || [],
          takenBaits.data || [],
          segments.data || [],
          tasks.data || []
        ],
        pending: results.some(result => result.isPending),
        error: results.find(result => result.error)?.error || null,
        isError: results.some(result => result.isError),
        isSuccess: results.every(result => result.isSuccess),
        refetch: () => {
          results.forEach(result => result.refetch())
        }
      }
    }
  })

  const [training, catches, events, takenBaits, segments, tasks] = queries.data || []

  // Мемоизация результата для предотвращения лишних рендеров
  const result = useMemo(() => ({
    training: training || null,
    catches: catches || [],
    events: events || [],
    takenBaits: takenBaits || [],
    segments: segments || [],
    tasks: tasks || [],
    isLoading: queries.pending,
    isError: queries.isError,
    error: queries.error,
    refetch: queries.refetch
  }), [
    training, 
    catches, 
    events, 
    takenBaits, 
    segments, 
    tasks, 
    queries.pending, 
    queries.isError, 
    queries.error, 
    queries.refetch
  ])

  return result as TrainingData
}

// Хук для предварительной загрузки данных
export function usePrefetchTrainingData(trainingId: string | undefined) {
  const queryClient = useQueryClient()

  const prefetch = useMemo(() => {
    if (!trainingId) return () => {}

    return () => {
      // Приоритет 1: Основные данные тренировки (критично для UI)
      queryClient.prefetchQuery({
        queryKey: ['training', trainingId],
        queryFn: () => fetchTrainingById(trainingId),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000
      })

      // Приоритет 2: Приманки (нужны для форм)
      queryClient.prefetchQuery({
        queryKey: ['training-taken-baits', trainingId, 'current-user'], // placeholder для userId
        queryFn: () => Promise.resolve([]), // Заглушка, реальный userId будет при загрузке
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000
      })

      // Приоритет 3: Поимки и события (могут быть много)
      Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['training-catches', trainingId],
          queryFn: () => listTrainingCatches(trainingId),
          staleTime: 1 * 60 * 1000,
          gcTime: 10 * 60 * 1000
        }),
        queryClient.prefetchQuery({
          queryKey: ['training-events', trainingId],
          queryFn: () => listTrainingEvents(trainingId),
          staleTime: 1 * 60 * 1000,
          gcTime: 10 * 60 * 1000
        })
      ])

      // Приоритет 4: Сегменты и задачи (менее критично)
      setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: ['training-segments', trainingId],
          queryFn: () => listTrainingSegments(trainingId),
          staleTime: 30 * 60 * 1000,
          gcTime: 2 * 60 * 60 * 1000
        })

        queryClient.prefetchQuery({
          queryKey: ['training-tasks', trainingId],
          queryFn: () => listTrainingTasks(trainingId),
          staleTime: 5 * 60 * 1000,
          gcTime: 15 * 60 * 1000
        })
      }, 100) // Небольшая задержка для приоритизации
    }
  }, [trainingId, queryClient])

  return prefetch
}

// Хук для оптимистичных обновлений
export function useOptimisticTrainingUpdates() {
  const queryClient = useQueryClient()

  const optimisticUpdateCatch = (trainingId: string, newCatch: TrainingCatch) => {
    queryClient.setQueryData(['training-catches', trainingId], (old: TrainingCatch[] | undefined) => {
      if (!old) return [newCatch]
      return [newCatch, ...old]
    })
  }

  const optimisticUpdateEvent = (trainingId: string, newEvent: TrainingEvent) => {
    queryClient.setQueryData(['training-events', trainingId], (old: TrainingEvent[] | undefined) => {
      if (!old) return [newEvent]
      return [newEvent, ...old]
    })
  }

  const optimisticDeleteCatch = (trainingId: string, catchId: string) => {
    queryClient.setQueryData(['training-catches', trainingId], (old: TrainingCatch[] | undefined) => {
      if (!old) return []
      return old.filter(c => c.id !== catchId)
    })
  }

  const optimisticDeleteEvent = (trainingId: string, eventId: string) => {
    queryClient.setQueryData(['training-events', trainingId], (old: TrainingEvent[] | undefined) => {
      if (!old) return []
      return old.filter(e => e.id !== eventId)
    })
  }

  return {
    optimisticUpdateCatch,
    optimisticUpdateEvent,
    optimisticDeleteCatch,
    optimisticDeleteEvent
  }
}

// Новый хук для умного управления кэшем
export function useSmartTrainingCache() {
  const queryClient = useQueryClient()

  // Очистка устаревших данных
  const cleanupOldData = useCallback(() => {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 часа
    
    // Очищаем очень старые данные
    queryClient.removeQueries({
      predicate: (query) => {
        const lastUpdated = query.state.dataUpdatedAt
        return Boolean(lastUpdated && (now - lastUpdated) > maxAge)
      }
    })
  }, [queryClient])

  // Предзагрузка связанных данных
  const prefetchRelatedData = useCallback((trainingId: string, userId: string) => {
    // Предзагружаем данные пользователя
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => Promise.resolve({ id: userId }), // Заглушка
      staleTime: 60 * 60 * 1000, // 1 час
      gcTime: 24 * 60 * 60 * 1000 // 24 часа
    })

    // Предзагружаем статистику
    queryClient.prefetchQuery({
      queryKey: ['training-stats', trainingId],
      queryFn: () => Promise.resolve({}), // Заглушка
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 30 * 60 * 1000 // 30 минут
    })
  }, [queryClient])

  // Инвалидация связанных данных
  const invalidateRelatedData = useCallback((trainingId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['training-stats', trainingId]
    })
    
    // Инвалидируем общие списки тренировок
    queryClient.invalidateQueries({
      queryKey: ['trainings']
    })
  }, [queryClient])

  // Оптимистичное обновление с откатом
  const optimisticUpdateWithRollback = useCallback((
    queryKey: string[],
    updater: (old: any) => any,
    rollbackData: any
  ) => {
    const previousData = queryClient.getQueryData(queryKey)
    
    // Применяем оптимистичное обновление
    queryClient.setQueryData(queryKey, updater)
    
    // Возвращаем функцию для отката
    return () => {
      queryClient.setQueryData(queryKey, rollbackData || previousData)
    }
  }, [queryClient])

  // Умная инвалидация кэша
  const smartInvalidate = useCallback((trainingId: string, dataType: 'catches' | 'events' | 'all') => {
    switch (dataType) {
      case 'catches':
        queryClient.invalidateQueries({
          queryKey: ['training-catches', trainingId]
        })
        break
      case 'events':
        queryClient.invalidateQueries({
          queryKey: ['training-events', trainingId]
        })
        break
      case 'all':
        queryClient.invalidateQueries({
          queryKey: ['training', trainingId]
        })
        queryClient.invalidateQueries({
          queryKey: ['training-catches', trainingId]
        })
        queryClient.invalidateQueries({
          queryKey: ['training-events', trainingId]
        })
        break
    }
    
    // Всегда инвалидируем статистику при изменении данных
    queryClient.invalidateQueries({
      queryKey: ['training-stats', trainingId]
    })
  }, [queryClient])

  return {
    cleanupOldData,
    prefetchRelatedData,
    invalidateRelatedData,
    optimisticUpdateWithRollback,
    smartInvalidate
  }
}
