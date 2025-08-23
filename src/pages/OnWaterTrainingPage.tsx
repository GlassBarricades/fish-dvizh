import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Container, Stack, Card, Title, Text, Button, Group, Loader, Paper } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useTraining, useTrainingTakenUserBaits, useCreateCatch, useCreateTrainingEvent } from '../features/trainings/hooks'
import { useAuth } from '../features/auth/hooks'
import { useFishKinds } from '../features/dicts/fish/hooks'
import type { TrainingTakenUserBait } from '../features/trainings/api'
import { OnWaterPage, CurrentTargetFishSelector } from '../features/trainings/components'
import { TrainingProvider } from '../features/trainings/context'

interface CurrentRig {
  bait: TrainingTakenUserBait | null
  weight: number
  notes: string
}

export default function OnWaterTrainingPage() {
  const { trainingId } = useParams<{ trainingId: string }>()
  const { user } = useAuth()
  const { data: training, isLoading } = useTraining(trainingId)
  const { data: takenBaits } = useTrainingTakenUserBaits(trainingId, user?.id)
  const { data: fishKinds } = useFishKinds()
  const { mutateAsync: createCatch } = useCreateCatch()
  const { mutateAsync: addEvent } = useCreateTrainingEvent()
  
  const [currentRig, setCurrentRig] = useState<CurrentRig>(() => {
    // Загружаем сохраненную оснастку из localStorage
    try {
      const saved = localStorage.getItem('current-rig')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          bait: null, // Будет установлено после загрузки takenBaits
          weight: parsed.weight || 0,
          notes: parsed.notes || ''
        }
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    return { bait: null, weight: 0, notes: '' }
  })

  // Восстанавливаем приманку из localStorage после загрузки takenBaits
  useEffect(() => {
    if (takenBaits && takenBaits.length > 0) {
      try {
        const saved = localStorage.getItem('current-rig')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.baitId) {
            const savedBait = takenBaits.find(tb => tb.user_bait_id === parsed.baitId)
            if (savedBait) {
              setCurrentRig(prev => ({ 
                bait: savedBait, 
                weight: prev?.weight || parsed.weight || 0,
                notes: prev?.notes || parsed.notes || ''
              }))
            }
          }
        }
      } catch {
        // Игнорируем ошибки
      }
    }
  }, [takenBaits])

  const handleQuickCatch = async (data: {
    fish_kind_id?: string
    weight_g?: number
    length_cm?: number
    point?: { lat: number; lng: number } | null
    notes?: string
    released: boolean
    currentBait: TrainingTakenUserBait
  }) => {
    if (!trainingId) return
    try {
      const dictId = data.currentBait.dict_bait_id || null
      const label = `${data.currentBait.brand ?? ''} ${data.currentBait.name ?? ''}${data.currentBait.color ? ' ' + data.currentBait.color : ''}${data.currentBait.size ? ' ' + data.currentBait.size : ''}`.trim()

      await createCatch({
        training_id: trainingId,
        user_id: user?.id || '',
        fish_kind_id: data.fish_kind_id || null,
        bait_id: dictId,
        weight_g: data.weight_g ?? null,
        length_cm: data.length_cm ?? null,
        lat: data.point?.lat ?? null,
        lng: data.point?.lng ?? null,
        caught_at: new Date().toISOString(),
        released: data.released,
        notes: data.notes || undefined,
        bait_name: dictId ? undefined : (label || undefined),
      })
      
      notifications.show({ color: 'green', message: 'Поимка добавлена' })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить поимку'
      notifications.show({ color: 'red', message })
    }
  }

  const handleQuickEvent = async (data: {
    kind: 'strike' | 'lost' | 'snag'
    point?: { lat: number; lng: number } | null
    notes?: string
    currentBait: TrainingTakenUserBait
  }) => {
    if (!trainingId) return
    try {
      const eventData = {
        training_id: trainingId, 
        user_id: user?.id || '', 
        kind: data.kind, 
        bait_id: data.currentBait.user_bait_id,
        lat: data.point?.lat ?? training?.lat ?? 53.9,
        lng: data.point?.lng ?? training?.lng ?? 27.5667,
        notes: data.notes
      }
      
      await addEvent(eventData)
      const eventLabel = data.kind === 'strike' ? 'Поклёвка' : data.kind === 'lost' ? 'Сход' : 'Зацеп'
      notifications.show({ color: 'green', message: `${eventLabel} добавлен` })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить событие'
      notifications.show({ color: 'red', message })
    }
  }

  const handleUpdateCurrentRig = (rig: { bait: TrainingTakenUserBait | null; weight: number }) => {
    setCurrentRig(prev => ({ ...prev, ...rig }))
    
    // Сохраняем в localStorage
    try {
      localStorage.setItem('current-rig', JSON.stringify({
        baitId: rig.bait?.user_bait_id || null,
        weight: rig.weight,
        notes: currentRig.notes
      }))
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  if (isLoading) {
    return (
      <Container size="lg" py="md">
        <Loader />
      </Container>
    )
  }

  if (!training) {
    return (
      <Container size="lg" py="md">
        <Paper withBorder p="lg">
          <Stack>
            <Title order={3}>Тренировка не найдена</Title>
            <Text c="dimmed">Возможно, она была удалена или у вас нет доступа.</Text>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <TrainingProvider trainingId={trainingId}>
      <Container size="lg" py="md">
        <Stack gap="md">
          {/* Заголовок страницы */}
          <Card withBorder p="md">
            <Group justify="space-between" align="center">
              <Stack gap={4}>
                <Title order={2}>🌊 Режим "На воде"</Title>
                <Text size="sm" c="dimmed">
                  {training.title} • {new Date(training.starts_at).toLocaleDateString('ru-RU')}
                </Text>
                
                {/* Селектор целевой рыбы */}
                <Group gap="xs" align="center">
                  <Text size="sm" c="dimmed" fw={500}>
                    Целевая рыба:
                  </Text>
                  {training?.target_fish_kinds && training.target_fish_kinds.length > 0 ? (
                    <CurrentTargetFishSelector />
                  ) : (
                    <Text size="sm" c="red" fw={500}>
                      Не задана для тренировки
                    </Text>
                  )}
                </Group>
              </Stack>
              <Button 
                component={Link} 
                to={`/training/${trainingId}`} 
                variant="light" 
                leftSection={<IconArrowLeft size={16} />}
              >
                К тренировке
              </Button>
            </Group>
          </Card>

          {/* Основной контент */}
          <OnWaterPage
            takenBaits={takenBaits || []}
            fishKinds={fishKinds || []}
            onQuickCatch={handleQuickCatch}
            onQuickEvent={handleQuickEvent}
            training={training}
            onUpdateCurrentRig={handleUpdateCurrentRig}
          />
        </Stack>
      </Container>
    </TrainingProvider>
  )
}
