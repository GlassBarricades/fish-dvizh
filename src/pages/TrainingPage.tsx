import { useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Container, Loader, Paper, Stack, Text, Title, Tabs } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useAuth } from '@/features/auth/hooks'
import type { TrainingCatch, TrainingEvent } from '@/features/trainings/api'
import {
  TrainingHeader,
  CatchesTab,
  MapTab,
  StatsTab,
  BaitsTab,
  AddCatchModal,
  EditCatchModal,
  ManageTakenBaitsModal,
  TrainingPlanTab,
  AddEventModal,
  EventsTab,
  EditEventModal,
  RigTab,
  TrainingTips
} from '@/features/trainings/components'
import { TrainingProvider } from '@/features/trainings/context'
import { useTrainingPageVM } from '@/features/trainings/model/useTrainingPageVM'

// Extended type for catches with dict_baits from the API
type TrainingCatchWithDict = TrainingCatch & {
  dict_baits?: {
    brand?: string | null
    name?: string | null
    color?: string | null
    size?: string | null
  } | null
}

function TrainingPageContent() {
  const { trainingId } = useParams<{ trainingId: string }>()
  const { user } = useAuth()
  const vm = useTrainingPageVM(trainingId, user?.id)
  const {
    training,
    catches,
    events,
    takenBaitsTop,
    segmentsForMap,
    isLoading,
    fishKinds,
    user: vmUser,
    trainingUsers,
    activeTask,
    notifEnabled,
    countdownText,
    countdownKind,
    toggleNotifications,
    addCatch,
    removeCatch,
    editCatch,
    deleteEvent,
    saveTakenBaits,
    addEventAction,
    editEventAction,
    quickCatch,
    quickEvent,
    updateRig,
  } = vm
  
  // Синхронизируем данные из API с контекстом
  useEffect(() => {
    if (training) {
      dispatch({ type: 'SET_TRAINING', payload: training })
    }
  }, [training, dispatch])
  
  useEffect(() => {
    if (catches) {
      dispatch({ type: 'SET_CATCHES', payload: catches })
    }
  }, [catches, dispatch])
  
  useEffect(() => {
    if (events) {
      dispatch({ type: 'SET_EVENTS', payload: events })
    }
  }, [events, dispatch])
  
  useEffect(() => {
    if (takenBaitsTop) {
      dispatch({ type: 'SET_TAKEN_BAITS', payload: takenBaitsTop })
    }
  }, [takenBaitsTop, dispatch])
  
  // Восстанавливаем оснастку из localStorage при загрузке данных
  useEffect(() => {
    if (takenBaitsTop && takenBaitsTop.length > 0 && !currentRig?.bait) {
      try {
        const saved = localStorage.getItem('current-rig')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.baitId) {
            const savedBait = takenBaitsTop.find(tb => tb.user_bait_id === parsed.baitId)
            if (savedBait) {
              updateCurrentRig({ 
                bait: savedBait, 
                weight: parsed.weight || 0,
                notes: parsed.notes || ''
              })
            }
          }
        }
      } catch {
        // Игнорируем ошибки
      }
    }
  }, [takenBaitsTop, currentRig?.bait, updateCurrentRig])
  
  const [opened, handlers] = useDisclosure(false)
  const [eventModalOpened, eventModalHandlers] = useDisclosure(false)
  const [eventKind, setEventKind] = useState<'strike' | 'lost' | 'snag' | null>(null)
  const [editEventModalOpened, editEventModalHandlers] = useDisclosure(false)
  const [editingEvent, setEditingEvent] = useState<TrainingEvent | null>(null)
  const [editCatchModalOpened, editCatchModalHandlers] = useDisclosure(false)
  const [editingCatch, setEditingCatch] = useState<TrainingCatch | null>(null)
  const [takenModalOpened, takenModalHandlers] = useDisclosure(false)
  
  // Получаем список пользователей тренировки из поимок и событий
  // trainingUsers теперь приходит из VM
  
  // notifEnabled, countdownText, countdownKind приходят из VM

  const lastUserBait = useMemo(() => {
    if (!user) return ''
    const own = (catches ?? []).filter((c) => c.user_id === user.id && (c.bait_name || c.bait_id))
    if (own.length === 0) return ''
    own.sort((a,b) => new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime())
    const last = own[0] as TrainingCatchWithDict
    return last.dict_baits ? `${last.dict_baits.brand ?? ''} ${last.dict_baits.name ?? ''} ${last.dict_baits.color ?? ''} ${last.dict_baits.size ?? ''}`.trim() : (last.bait_name || '')
  }, [user, catches])

  // таймеры инкапсулированы в VM
  
  function quickPin(kind: 'strike' | 'lost' | 'snag') {
    setEventKind(kind)
    eventModalHandlers.open()
  }

  function openEditEvent(event: TrainingEvent) {
    setEditingEvent(event)
    editEventModalHandlers.open()
  }

  function openEditCatch(catch_: TrainingCatch) {
    setEditingCatch(catch_)
    editCatchModalHandlers.open()
  }

  // таймеры и уведомления инкапсулированы в VM

  const handleToggleNotifications = toggleNotifications

  const handleAddCatch = async (values: {
    fish_kind_id?: string
    bait_name?: string
    bait_id?: string
    weight_g?: number
    length_cm?: number
    caught_at: string
    released: boolean
    notes?: string
    point?: { lat: number; lng: number } | null
  }) => {
          if (!user || !trainingId) return
          try {
            const selected = (takenBaitsTop || []).find((tb: any) => tb.user_bait_id === values.bait_id)
            const dictId = selected?.dict_bait_id || null
            const label = selected ? `${selected.brand ?? ''} ${selected.name ?? ''}${selected.color ? ' ' + selected.color : ''}${selected.size ? ' ' + selected.size : ''}`.trim() : undefined
            await createCatch({
              training_id: trainingId,
              user_id: user.id,
              fish_kind_id: values.fish_kind_id || null,
              bait_id: dictId,
              weight_g: values.weight_g ?? null,
              length_cm: values.length_cm ?? null,
              lat: values.point?.lat ?? null,
              lng: values.point?.lng ?? null,
              caught_at: values.caught_at,
              released: values.released,
              notes: values.notes || undefined,
              bait_name: dictId ? undefined : (label || undefined),
            })
            notifications.show({ color: 'green', message: 'Поимка добавлена' })
            handlers.close()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить поимку'
      notifications.show({ color: 'red', message })
    }
  }

  const handleDeleteCatch = async (id: string) => { await removeCatch(id) }

  const handleEditCatch = async (values: {
    fish_kind_id?: string
    bait_name?: string
    bait_id?: string
    weight_g?: number
    length_cm?: number
    caught_at: string
    released: boolean
    notes?: string
    point?: { lat: number; lng: number } | null
  }) => {
    if (!user || !trainingId || !editingCatch) return
    try {
      const selected = (takenBaitsTop || []).find((tb: any) => tb.user_bait_id === values.bait_id)
      const dictId = selected?.dict_bait_id || null
      const label = selected ? `${selected.brand ?? ''} ${selected.name ?? ''}${selected.color ? ' ' + selected.color : ''}${selected.size ? ' ' + selected.size : ''}`.trim() : undefined
      
      await updateCatch({
        id: editingCatch.id,
        trainingId,
        input: {
          fish_kind_id: values.fish_kind_id || null,
          bait_id: dictId,
              weight_g: values.weight_g ?? null,
              length_cm: values.length_cm ?? null,
          lat: values.point?.lat ?? null,
          lng: values.point?.lng ?? null,
              caught_at: values.caught_at,
              released: values.released,
          notes: values.notes || undefined,
          bait_name: dictId ? undefined : (label || undefined),
        }
      })
      
            notifications.show({ color: 'green', message: 'Поимка обновлена' })
      editCatchModalHandlers.close()
      setEditingCatch(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить поимку'
      notifications.show({ color: 'red', message })
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!trainingId) return
    await removeEvent({ id, trainingId: trainingId as string })
    notifications.show({ color: 'gray', message: 'Пин удалён' })
  }

  const handleSaveTakenBaits = async (ids: string[]) => { await saveTakenBaits(ids); takenModalHandlers.close() }

  const handleAddEvent = async (data: {
    kind: 'strike' | 'lost' | 'snag'
  bait_id?: string
  notes?: string
    at: string
  point?: { lat: number; lng: number } | null
  }) => {
    await addEventAction(data)
    eventModalHandlers.close()
  }

  const handleEditEvent = async (data: {
    kind: 'strike' | 'lost' | 'snag'
    bait_id?: string
    notes?: string
    at: string
    point?: { lat: number; lng: number } | null
  }) => {
    if (!editingEvent) return
    await editEventAction(editingEvent, data)
    editEventModalHandlers.close()
    setEditingEvent(null)
  }

  // Быстрые действия для вкладки "Оснастка"
  const handleQuickCatch = async (data: {
    fish_kind_id?: string
    weight_g?: number
    length_cm?: number
    point?: { lat: number; lng: number } | null
    notes?: string
    released: boolean
    currentBait: any
  }) => {
    await quickCatch(data)
  }

  const handleQuickEvent = async (data: {
    kind: 'strike' | 'lost' | 'snag'
    point?: { lat: number; lng: number } | null
    notes?: string
    currentBait: any
  }) => {
    await quickEvent(data)
  }

  // Функция для обновления текущей оснастки
  const handleUpdateCurrentRig = (rig: { bait: any | null; weight: number }) => { updateRig(rig) }



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
    <Container size="lg" py="md">
      <Stack gap="md">
        <TrainingHeader
          training={training}
          countdownText={countdownText}
          countdownKind={countdownKind}
          notifEnabled={notifEnabled}
          onToggleNotifications={handleToggleNotifications}
          onQuickPin={quickPin}
          currentRig={currentRig}
        />

        {/* Умные подсказки */}
        <TrainingTips />

        <Tabs defaultValue="catches">
                     <Tabs.List>
             <Tabs.Tab value="catches">Поимки ({catches?.length ?? 0})</Tabs.Tab>
             <Tabs.Tab value="events">События ({events?.length ?? 0})</Tabs.Tab>
                           <Tabs.Tab value="rig">Оснастка</Tabs.Tab>
              <Tabs.Tab value="map">Карта</Tabs.Tab>
             <Tabs.Tab value="stats">Статистика</Tabs.Tab>
             <Tabs.Tab value="baits">Мои приманки</Tabs.Tab>
             <Tabs.Tab value="plan">План</Tabs.Tab>
           </Tabs.List>

          <Tabs.Panel value="catches" pt="md">
            <CatchesTab
              catches={catches || []}
              fishKinds={fishKinds || []}
              user={vmUser}
              onOpenManageBaits={takenModalHandlers.open}
              onAddCatch={handlers.open}
              onEditCatch={openEditCatch}
              onDeleteCatch={handleDeleteCatch}
              activeTask={activeTask}
            />
          </Tabs.Panel>

                     <Tabs.Panel value="events" pt="md">
             <EventsTab
               events={events || []}
               user={vmUser}
               users={trainingUsers}
               takenBaits={takenBaitsTop || []}
               onAddEvent={quickPin}
               onEditEvent={openEditEvent}
               onDeleteEvent={handleDeleteEvent}
             />
           </Tabs.Panel>

           <Tabs.Panel value="rig" pt="md">
             <RigTab
               takenBaits={takenBaitsTop || []}
               fishKinds={fishKinds || []}
               onQuickCatch={handleQuickCatch}
               onQuickEvent={handleQuickEvent}
               training={training}
               onUpdateCurrentRig={handleUpdateCurrentRig}
             />
           </Tabs.Panel>

           

          <Tabs.Panel value="map" pt="md">
                         <MapTab
               catches={catches || []}
               fishKinds={fishKinds || []}
               segments={segmentsForMap || []}
               events={events || []}
               activeTask={activeTask}
               user={vmUser}
               users={trainingUsers}
               takenBaits={takenBaitsTop || []}
               onDeleteEvent={handleDeleteEvent}
               training={training}
             />
          </Tabs.Panel>

          <Tabs.Panel value="stats" pt="md">
            <StatsTab
              catches={catches || []}
              events={events || []}
              fishKinds={fishKinds || []}
              takenBaits={takenBaitsTop || []}
              filterFish={undefined}
              filterUser={undefined}
              filterBait=""
              targetFishKinds={training?.target_fish_kinds}
            />
          </Tabs.Panel>

          <Tabs.Panel value="baits" pt="md">
            <BaitsTab
              takenBaits={takenBaitsTop || []}
              catches={catches || []}
              onOpenManageBaits={takenModalHandlers.open}
            />
          </Tabs.Panel>

          <Tabs.Panel value="plan" pt="md">
            <TrainingPlanTab trainingId={trainingId as string} />
          </Tabs.Panel>
        </Tabs>
        </Stack>

      <AddCatchModal
        opened={opened}
        onClose={handlers.close}
        initialBait={lastUserBait}
        onOpenManageBaits={takenModalHandlers.open}
        onSubmit={handleAddCatch}
        training={training}
      />

      <ManageTakenBaitsModal
        opened={takenModalOpened}
        onClose={takenModalHandlers.close}
        baitsSource="user"
        selectedIds={new Set((takenBaitsTop ?? []).map((tb: any) => tb.user_bait_id))}
        onSave={handleSaveTakenBaits}
      />

      {eventKind && (
        <AddEventModal
          opened={eventModalOpened}
          onClose={eventModalHandlers.close}
          eventKind={eventKind}
          training={training}
          onSubmit={handleAddEvent}
        />
      )}

             {editingEvent && (
         <EditEventModal
           opened={editEventModalOpened}
           onClose={editEventModalHandlers.close}
           event={editingEvent}
           training={training}
           onSubmit={handleEditEvent}
         />
       )}

       {editingCatch && (
         <EditCatchModal
           opened={editCatchModalOpened}
           onClose={editCatchModalHandlers.close}
           catch_={editingCatch}
           training={training}
           fishKinds={fishKinds || []}
           onSubmit={handleEditCatch}
         />
       )}
    </Container>
  )
}

// Вспомогательная функция для меток пинов
function pinLabel(kind: 'strike' | 'lost' | 'snag') {
  return kind === 'strike' ? 'Поклёвка' : kind === 'lost' ? 'Сход' : 'Зацеп'
}

// Обёртка с TrainingProvider
export default function TrainingPage() {
  const { trainingId } = useParams<{ trainingId: string }>()
  
  return (
    <TrainingProvider trainingId={trainingId}>
      <TrainingPageContent />
    </TrainingProvider>
  )
}

