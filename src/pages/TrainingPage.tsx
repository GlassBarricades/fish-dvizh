import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Container, Loader, Paper, Stack, Text, Title, Tabs } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useAuth } from '../features/auth/hooks'
import { notifications } from '@mantine/notifications'
import { useTrainingData, useCreateCatch, useDeleteCatch, useUpdateCatch, useCreateTrainingEvent, useDeleteTrainingEvent, useUpdateTrainingEvent, useSetTrainingTakenUserBaits } from '../features/trainings/hooks'
import { useFishKinds } from '../features/dicts/fish/hooks'
import type { TrainingCatch, TrainingTask, TrainingEvent } from '../features/trainings/api'
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
} from '../features/trainings/components'
import { TrainingProvider, useTrainingContext } from '../features/trainings/context'

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
  const { data: fishKinds } = useFishKinds()
  
  // Используем оптимизированный хук для получения данных
  const { 
    training, 
    catches, 
    events, 
    takenBaits: takenBaitsTop, 
    segments: segmentsForMap, 
    tasks: tasksForTimers,
    isLoading
  } = useTrainingData(trainingId, user?.id)
  
  // Хуки для мутаций API
  const { mutateAsync: createCatch } = useCreateCatch()
  const { mutateAsync: deleteCatch } = useDeleteCatch()
  const { mutateAsync: updateCatch } = useUpdateCatch()
  const { mutateAsync: addEvent } = useCreateTrainingEvent()
  const { mutateAsync: removeEvent } = useDeleteTrainingEvent()
  const { mutateAsync: updateEvent } = useUpdateTrainingEvent()
  const { mutateAsync: setTakenBaits } = useSetTrainingTakenUserBaits()
  
  // Используем контекст для управления состоянием
  const { state, dispatch, updateCurrentRig } = useTrainingContext()
  const { currentRig } = state
  
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
  const trainingUsers = useMemo(() => {
    const userIds = new Set<string>()
    const userMap = new Map<string, string>()
    
    // Собираем пользователей из поимок
    catches?.forEach(catch_ => {
      if (catch_.user_id && !userIds.has(catch_.user_id)) {
        userIds.add(catch_.user_id)
        // Используем ник из raw_user_meta_data или email как fallback
        const userData = (catch_ as any).users
        let userName = `Пользователь ${catch_.user_id.slice(0, 8)}`
        if (userData?.raw_user_meta_data?.nickname) {
          userName = userData.raw_user_meta_data.nickname
        } else if (userData?.email) {
          userName = userData.email
        }
        userMap.set(catch_.user_id, userName)
      }
    })
    
    // Собираем пользователей из событий
    events?.forEach(event => {
      if (event.user_id && !userIds.has(event.user_id)) {
        userIds.add(event.user_id)
        // Используем ник из raw_user_meta_data или email как fallback
        const userData = (event as any).users
        let userName = `Пользователь ${event.user_id.slice(0, 8)}`
        if (userData?.raw_user_meta_data?.nickname) {
          userName = userData.raw_user_meta_data.nickname
        } else if (userData?.email) {
          userName = userData.email
        }
        userMap.set(event.user_id, userName)
      }
    })
    
    return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }))
  }, [catches, events])
  
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('training-notif-enabled') === '1' } catch { return false }
  })
  const [countdownText, setCountdownText] = useState<string | null>(null)
  const [countdownKind, setCountdownKind] = useState<'starts' | 'ends' | 'next' | null>(null)

  const lastUserBait = useMemo(() => {
    if (!user) return ''
    const own = (catches ?? []).filter((c) => c.user_id === user.id && (c.bait_name || c.bait_id))
    if (own.length === 0) return ''
    own.sort((a,b) => new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime())
    const last = own[0] as TrainingCatchWithDict
    return last.dict_baits ? `${last.dict_baits.brand ?? ''} ${last.dict_baits.name ?? ''} ${last.dict_baits.color ?? ''} ${last.dict_baits.size ?? ''}`.trim() : (last.bait_name || '')
  }, [user, catches])

  // Timers for tasks
  const activeTask = useMemo(() => {
    const now = Date.now()
    return (tasksForTimers ?? []).find((t: TrainingTask) => {
      const st = new Date(t.starts_at).getTime()
      const et = t.ends_at ? new Date(t.ends_at).getTime() : st + 60 * 60 * 1000
      return now >= st && now <= et
    })
  }, [tasksForTimers])
  
  const timeoutsRef = useRef<number[]>([])
  
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

  // Уведомления для задач
  useEffect(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id))
    timeoutsRef.current = []
    if (!notifEnabled || !tasksForTimers) return
    const now = Date.now()
    const playBeep = () => {
      try {
        const Ctx = (window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) return
        const ctx = new Ctx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.value = 0.05
        osc.connect(gain)
        gain.connect(ctx.destination)
        const t = ctx.currentTime
        osc.start(t)
        osc.stop(t + 0.2)
      } catch {
        // Audio context not supported
      }
    }
    const schedule = (ts: number, title: string, body: string) => {
      if (ts <= now) return
      const id = window.setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          try { new Notification(title, { body }) } catch {
            // Notification failed
          }
        }
        playBeep()
        notifications.show({ title, message: body })
      }, ts - now)
      timeoutsRef.current.push(id)
    }
    tasksForTimers.forEach((t: TrainingTask) => {
      const st = new Date(t.starts_at).getTime()
      schedule(st, 'Старт задачи', t.title)
      if (t.ends_at) schedule(new Date(t.ends_at).getTime(), 'Финиш задачи', t.title)
    })
    return () => { timeoutsRef.current.forEach((id) => clearTimeout(id)); timeoutsRef.current = [] }
  }, [notifEnabled, tasksForTimers])

  // Countdown indicator
  useEffect(() => {
    const interval = window.setInterval(() => {
      const tasks = tasksForTimers ?? []
      const now = Date.now()
      let kind: 'starts' | 'ends' | 'next' | null = null
      let target: number | null = null
      let current: TrainingTask | null = null
      current = tasks.find((t: TrainingTask) => {
        const st = new Date(t.starts_at).getTime()
        const et = t.ends_at ? new Date(t.ends_at).getTime() : st
        return now >= st && now <= (et || st)
      }) || null
      if (current) {
        const st = new Date(current.starts_at).getTime()
        const et = current.ends_at ? new Date(current.ends_at).getTime() : st
        if (now < st) { kind = 'starts'; target = st } else if (et && now <= et) { kind = 'ends'; target = et }
      } else {
        const upcoming = tasks.map((t: TrainingTask) => ({ t, st: new Date(t.starts_at).getTime() })).filter(x => x.st > now).sort((a,b) => a.st - b.st)[0]
        if (upcoming) { kind = 'next'; target = upcoming.st }
      }
      if (kind && target) {
        const sec = Math.max(0, Math.floor((target - now)/1000))
        const h = Math.floor(sec/3600).toString().padStart(2,'0')
        const m = Math.floor((sec%3600)/60).toString().padStart(2,'0')
        const s = Math.floor(sec%60).toString().padStart(2,'0')
        setCountdownKind(kind)
        setCountdownText(`${h}:${m}:${s}`)
      } else { setCountdownKind(null); setCountdownText(null) }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [tasksForTimers])

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) { 
      notifications.show({ color: 'red', message: 'Браузер не поддерживает уведомления' }); 
      return 
    }
              if (Notification.permission !== 'granted') {
                const perm = await Notification.requestPermission()
      if (perm !== 'granted') { 
        notifications.show({ color: 'gray', message: 'Уведомления не разрешены' }); 
        return 
      }
              }
              setNotifEnabled(true)
    try { localStorage.setItem('training-notif-enabled', '1') } catch {
      // Local storage not available
    }
              notifications.show({ color: 'green', message: 'Напоминания включены' })
  }

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

  const handleDeleteCatch = async (id: string) => {
    if (!trainingId) return
    await deleteCatch({ id, trainingId })
    notifications.show({ color: 'gray', message: 'Поимка удалена' })
  }

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

  const handleSaveTakenBaits = async (ids: string[]) => {
          if (!trainingId || !user) return
          await setTakenBaits({ trainingId, userId: user.id, userBaitIds: ids })
          notifications.show({ color: 'green', message: 'Список приманок обновлён' })
          takenModalHandlers.close()
}

  const handleAddEvent = async (data: {
    kind: 'strike' | 'lost' | 'snag'
  bait_id?: string
  notes?: string
    at: string
  point?: { lat: number; lng: number } | null
  }) => {
    if (!user || !trainingId) return
    try {
      // В training_events.bait_id должно быть user_bait_id, а не dict_bait_id
      let baitIdToSave = null
      if (data.bait_id) {
        const selected = (takenBaitsTop || []).find((tb: any) => tb.user_bait_id === data.bait_id)
        // Сохраняем user_bait_id, так как внешний ключ ссылается на user_baits
        baitIdToSave = selected?.user_bait_id || null
      }
      
      const eventData = {
        training_id: trainingId, 
        user_id: user.id, 
        kind: data.kind, 
        bait_id: baitIdToSave, // Используем user_bait_id
        lat: data.point?.lat ?? training?.lat ?? 53.9,
        lng: data.point?.lng ?? training?.lng ?? 27.5667,
        notes: data.notes
      }
      
      await addEvent(eventData)
      notifications.show({ color: 'green', message: `${pinLabel(data.kind)} добавлен` })
      eventModalHandlers.close()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить событие'
      notifications.show({ color: 'red', message })
    }
  }

  const handleEditEvent = async (data: {
    kind: 'strike' | 'lost' | 'snag'
    bait_id?: string
    notes?: string
    at: string
    point?: { lat: number; lng: number } | null
  }) => {
    if (!user || !trainingId || !editingEvent) return
    try {
      // В training_events.bait_id должно быть user_bait_id
      let baitIdToSave = null
      if (data.bait_id) {
        // data.bait_id уже является user_bait_id, так как это то, что выбрал пользователь
        baitIdToSave = data.bait_id
      }
      
      // Обновляем событие через API
      await updateEvent({
        id: editingEvent.id,
        data: {
          kind: data.kind,
          bait_id: baitIdToSave,
          notes: data.notes,
          at: data.at,
          lat: data.point?.lat ?? null,
          lng: data.point?.lng ?? null
        }
      })
      
      notifications.show({ color: 'green', message: `${pinLabel(data.kind)} обновлён` })
      editEventModalHandlers.close()
      setEditingEvent(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить событие'
      notifications.show({ color: 'red', message })
    }
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
    if (!user || !trainingId) return
    try {
      const dictId = data.currentBait.dict_bait_id || null
      const label = `${data.currentBait.brand ?? ''} ${data.currentBait.name ?? ''}${data.currentBait.color ? ' ' + data.currentBait.color : ''}${data.currentBait.size ? ' ' + data.currentBait.size : ''}`.trim()

      await createCatch({
        training_id: trainingId,
        user_id: user.id,
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
    currentBait: any
  }) => {
    if (!user || !trainingId) return
    try {
      const eventData = {
        training_id: trainingId, 
        user_id: user.id, 
        kind: data.kind, 
        bait_id: data.currentBait.user_bait_id,
        lat: data.point?.lat ?? training?.lat ?? 53.9,
        lng: data.point?.lng ?? training?.lng ?? 27.5667,
        notes: data.notes
      }
      
      await addEvent(eventData)
      notifications.show({ color: 'green', message: `${pinLabel(data.kind)} добавлен` })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить событие'
      notifications.show({ color: 'red', message })
    }
  }

  // Функция для обновления текущей оснастки
  const handleUpdateCurrentRig = (rig: { bait: any | null; weight: number }) => {
    updateCurrentRig(rig)
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
              user={user}
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
               user={user}
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
               user={user}
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

