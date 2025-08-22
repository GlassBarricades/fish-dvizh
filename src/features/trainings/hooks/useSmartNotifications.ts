import { useCallback, useEffect, useMemo, useRef } from 'react'
import { notifications } from '@mantine/notifications'
import { useTrainingContext } from '../context'

interface TrainingTip {
  type: 'bait' | 'timing' | 'technique' | 'weather' | 'general'
  message: string
  priority: 'low' | 'medium' | 'high'
  action?: () => void
}

export function useSmartNotifications() {
  const { state } = useTrainingContext()
  const { training, currentRig, catches, events, takenBaits } = state
  
  // Отслеживаем уже показанные уведомления
  const shownNotifications = useRef(new Set<string>())
  const componentMountTime = useRef(Date.now())

  // Анализ эффективности приманок
  const baitEffectiveness = useMemo(() => {
    if (catches.length < 3) return null

    const baitStats = catches.reduce((acc, catch_) => {
      const baitKey = catch_.bait_id || catch_.bait_name || 'unknown'
      if (!acc[baitKey]) {
        acc[baitKey] = { count: 0, totalWeight: 0, baitName: catch_.bait_name || 'Неизвестная приманка' }
      }
      acc[baitKey].count++
      if (catch_.weight_g) {
        acc[baitKey].totalWeight += catch_.weight_g
      }
      return acc
    }, {} as Record<string, { count: number; totalWeight: number; baitName: string }>)

    return Object.entries(baitStats)
      .map(([key, stats]) => ({
        baitId: key,
        baitName: stats.baitName,
        count: stats.count,
        avgWeight: stats.totalWeight / stats.count,
        effectiveness: stats.count * (stats.totalWeight / stats.count)
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness)
  }, [catches])

  // Анализ времени клёва
  const timeEffectiveness = useMemo(() => {
    if (catches.length < 3) return null

    const hourlyStats = catches.reduce((acc, catch_) => {
      const hour = new Date(catch_.caught_at).getHours()
      if (!acc[hour]) acc[hour] = 0
      acc[hour]++
      return acc
    }, {} as Record<number, number>)

    const bestHour = Object.entries(hourlyStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]

    return bestHour ? parseInt(bestHour) : null
  }, [catches])

  // Анализ техники ловли
  const techniqueAnalysis = useMemo(() => {
    if (catches.length < 2) return null

    const releasedCount = catches.filter(c => c.released).length
    const totalCount = catches.length
    const releaseRate = releasedCount / totalCount

    return {
      releaseRate,
      shouldReleaseMore: releaseRate < 0.3,
      shouldReleaseLess: releaseRate > 0.8
    }
  }, [catches])

  // Генерация подсказок
  const tips = useMemo((): TrainingTip[] => {
    const tips: TrainingTip[] = []

    // Подсказки по приманкам
    if (baitEffectiveness && currentRig?.bait) {
      const bestBait = baitEffectiveness[0]
      const currentBaitEffectiveness = baitEffectiveness.find(
        b => b.baitId === currentRig.bait?.dict_bait_id || b.baitName === currentRig.bait?.name
      )

      if (bestBait && currentBaitEffectiveness && 
          bestBait.effectiveness > currentBaitEffectiveness.effectiveness * 1.5) {
        tips.push({
          type: 'bait',
          message: `Попробуйте ${bestBait.baitName} - лучшая эффективность (${bestBait.count} поимок)`,
          priority: 'high'
        })
      }
    }

    // Подсказки по времени
    if (timeEffectiveness !== null) {
      const currentHour = new Date().getHours()
      if (Math.abs(currentHour - timeEffectiveness) > 2) {
        tips.push({
          type: 'timing',
          message: `Лучший клёв наблюдался в ${timeEffectiveness}:00. Сейчас ${currentHour}:00`,
          priority: 'medium'
        })
      }
    }

    // Подсказки по технике
    if (techniqueAnalysis) {
      if (techniqueAnalysis.shouldReleaseMore) {
        tips.push({
          type: 'technique',
          message: 'Попробуйте отпускать больше рыбы для сохранения популяции',
          priority: 'medium'
        })
      } else if (techniqueAnalysis.shouldReleaseLess) {
        tips.push({
          type: 'technique',
          message: 'Возможно, стоит оставлять больше рыбы для еды',
          priority: 'low'
        })
      }
    }

    // Общие подсказки
    if (!currentRig?.bait && takenBaits.length > 0) {
      tips.push({
        type: 'bait',
        message: 'Выберите приманку для начала тренировки',
        priority: 'high',
        action: () => {
          // Можно добавить действие для открытия модального окна выбора приманки
        }
      })
    }

    if (catches.length === 0 && events.length === 0) {
      tips.push({
        type: 'general',
        message: 'Начните с первой поимки или события для анализа эффективности',
        priority: 'medium'
      })
    }

    if (catches.length > 10 && events.length === 0) {
      tips.push({
        type: 'technique',
        message: 'Попробуйте фиксировать поклёвки и сходы для лучшего анализа',
        priority: 'medium'
      })
    }

    return tips.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [baitEffectiveness, timeEffectiveness, techniqueAnalysis, currentRig, takenBaits, catches, events])

  // Показ уведомлений
  const showContextualNotification = useCallback(() => {
    if (!training) return

    // Показываем только высокоприоритетные подсказки автоматически
    const highPriorityTips = tips.filter(tip => tip.priority === 'high')
    
    highPriorityTips.forEach(tip => {
      notifications.show({
        title: getTipTitle(tip.type),
        message: tip.message,
        color: getTipColor(tip.priority),
        autoClose: 8000,
        // action: tip.action ? {
        //   label: 'Действие',
        //   onClick: tip.action
        // } : undefined
      })
    })
  }, [tips, training])

  // Автоматические уведомления при определённых условиях
  useEffect(() => {
    if (!training || catches.length === 0) return

    // Проверяем только новые поимки (созданные после загрузки компонента)
    const recentCatches = catches.filter(catch_ => {
      const catchTime = new Date(catch_.caught_at).getTime()
      return catchTime > componentMountTime.current
    })

    if (recentCatches.length === 0) return

    const latestCatch = recentCatches[0]
    const catchId = latestCatch.id

    // Избегаем дублирования уведомлений
    if (shownNotifications.current.has(`catch-${catchId}`)) return

    // Уведомление о первой поимке
    if (catches.length === 1) {
      notifications.show({
        title: '🎣 Первая поимка!',
        message: 'Отличное начало! Продолжайте в том же духе.',
        color: 'green',
        autoClose: 5000
      })
      shownNotifications.current.add(`catch-${catchId}`)
      return
    }

    // Уведомление о достижении 5 поимок
    if (catches.length === 5) {
      notifications.show({
        title: '🏆 5 поимок!',
        message: 'Вы набираете обороты! Попробуйте разные техники.',
        color: 'blue',
        autoClose: 5000
      })
      shownNotifications.current.add(`milestone-5`)
      return
    }

    // Уведомление о рекордной рыбе
    const maxWeight = Math.max(...catches.map(c => c.weight_g || 0))
    if (latestCatch.weight_g === maxWeight && maxWeight > 0) {
      // Проверяем, что это действительно новый рекорд
      const previousMaxWeight = Math.max(...catches.filter(c => c.id !== catchId).map(c => c.weight_g || 0))
      if (maxWeight > previousMaxWeight) {
        notifications.show({
          title: '🐟 Новый рекорд!',
          message: `Рыба весом ${maxWeight}г - это ваша самая крупная поимка!`,
          color: 'yellow',
          autoClose: 6000
        })
        shownNotifications.current.add(`record-${catchId}`)
      }
    }
  }, [catches, training])

  // Уведомления о событиях
  useEffect(() => {
    if (!training || events.length === 0) return

    // Проверяем только новые события (созданные после загрузки компонента)
    const recentEvents = events.filter(event => {
      const eventTime = new Date(event.at).getTime()
      return eventTime > componentMountTime.current
    })

    if (recentEvents.length === 0) return

    const latestEvent = recentEvents[0]
    const eventId = latestEvent.id
    const eventType = latestEvent.kind

    // Избегаем дублирования уведомлений
    if (shownNotifications.current.has(`event-${eventId}`)) return

    const eventMessages = {
      strike: { title: '⚡ Поклёвка!', message: 'Рыба клюнула! Готовьтесь к подсечке.', color: 'blue' },
      lost: { title: '💨 Сход', message: 'Рыба сорвалась. Попробуйте другую технику.', color: 'orange' },
      snag: { title: '🌿 Зацеп', message: 'Зацепились. Проверьте снасть.', color: 'red' }
    }

    const eventInfo = eventMessages[eventType as keyof typeof eventMessages]
    if (eventInfo) {
      notifications.show({
        title: eventInfo.title,
        message: eventInfo.message,
        color: eventInfo.color,
        autoClose: 4000
      })
      shownNotifications.current.add(`event-${eventId}`)
    }
  }, [events, training])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      shownNotifications.current.clear()
    }
  }, [])

  return {
    tips,
    showContextualNotification,
    baitEffectiveness,
    timeEffectiveness,
    techniqueAnalysis
  }
}

// Вспомогательные функции
function getTipTitle(type: TrainingTip['type']): string {
  const titles = {
    bait: '🎣 Приманка',
    timing: '⏰ Время',
    technique: '🎯 Техника',
    weather: '🌤️ Погода',
    general: '💡 Совет'
  }
  return titles[type]
}

function getTipColor(priority: TrainingTip['priority']): string {
  const colors = {
    high: 'red',
    medium: 'yellow',
    low: 'blue'
  }
  return colors[priority]
}
