import { useEffect, useMemo, useRef, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { notifications } from '@mantine/notifications'
import { useAuth } from '@/features/auth/hooks'
import { useFishKinds } from '@/features/dicts/fish/hooks'
import { useTrainingData, useCreateCatch, useDeleteCatch, useUpdateCatch, useCreateTrainingEvent, useDeleteTrainingEvent, useUpdateTrainingEvent, useSetTrainingTakenUserBaits } from '@/features/trainings/hooks'
import type { TrainingCatch, TrainingTask, TrainingEvent } from '@/features/trainings/api'
import { useTrainingContext } from '@/features/trainings/context'

type QuickCatchInput = {
  fish_kind_id?: string
  weight_g?: number
  length_cm?: number
  point?: { lat: number; lng: number } | null
  notes?: string
  released: boolean
  currentBait: any
}

type QuickEventInput = {
  kind: 'strike' | 'lost' | 'snag'
  point?: { lat: number; lng: number } | null
  notes?: string
  currentBait: any
}

export function useTrainingPageVM(trainingId: string | undefined, userId: string | undefined) {
  const { state, updateCurrentRig, dispatch } = useTrainingContext()
  const { currentRig } = state
  const { user } = useAuth()
  const { data: fishKinds } = useFishKinds()

  const {
    training,
    catches,
    events,
    takenBaits: takenBaitsTop,
    segments: segmentsForMap,
    tasks: tasksForTimers,
    isLoading,
  } = useTrainingData(trainingId, userId)

  const { mutateAsync: createCatch } = useCreateCatch()
  const { mutateAsync: deleteCatch } = useDeleteCatch()
  const { mutateAsync: updateCatch } = useUpdateCatch()
  const { mutateAsync: addEvent } = useCreateTrainingEvent()
  const { mutateAsync: removeEvent } = useDeleteTrainingEvent()
  const { mutateAsync: updateEvent } = useUpdateTrainingEvent()
  const { mutateAsync: setTakenBaits } = useSetTrainingTakenUserBaits()

  // Геолокация пользователя для дефолтных координат
  const { coords: userCoords } = useGeolocation()

  useEffect(() => {
    if (training) dispatch({ type: 'SET_TRAINING', payload: training })
  }, [training, dispatch])

  useEffect(() => {
    if (catches) dispatch({ type: 'SET_CATCHES', payload: catches })
  }, [catches, dispatch])

  useEffect(() => {
    if (events) dispatch({ type: 'SET_EVENTS', payload: events })
  }, [events, dispatch])

  useEffect(() => {
    if (takenBaitsTop) dispatch({ type: 'SET_TAKEN_BAITS', payload: takenBaitsTop })
  }, [takenBaitsTop, dispatch])

  // training users list for filters/labels
  const trainingUsers = useMemo(() => {
    const userIds = new Set<string>()
    const userMap = new Map<string, string>()
    catches?.forEach((catch_) => {
      if (catch_.user_id && !userIds.has(catch_.user_id)) {
        userIds.add(catch_.user_id)
        const u = (catch_ as any).users
        let name = `Пользователь ${catch_.user_id.slice(0, 8)}`
        if (u?.raw_user_meta_data?.nickname) name = u.raw_user_meta_data.nickname
        else if (u?.email) name = u.email
        userMap.set(catch_.user_id, name)
      }
    })
    events?.forEach((event) => {
      if (event.user_id && !userIds.has(event.user_id)) {
        userIds.add(event.user_id)
        const u = (event as any).users
        let name = `Пользователь ${event.user_id.slice(0, 8)}`
        if (u?.raw_user_meta_data?.nickname) name = u.raw_user_meta_data.nickname
        else if (u?.email) name = u.email
        userMap.set(event.user_id, name)
      }
    })
    return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }))
  }, [catches, events])

  // notifications & countdown
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('training-notif-enabled') === '1' } catch { return false }
  })
  const [countdownText, setCountdownText] = useState<string | null>(null)
  const [countdownKind, setCountdownKind] = useState<'starts' | 'ends' | 'next' | null>(null)
  const timeoutsRef = useRef<number[]>([])

  useEffect(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id))
    timeoutsRef.current = []
    if (!notifEnabled || !tasksForTimers) return
    const now = Date.now()
    const playBeep = () => {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
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
      } catch {}
    }
    const schedule = (ts: number, title: string, body: string) => {
      if (ts <= now) return
      const id = window.setTimeout(() => {
        if ('Notification' in window && (Notification as any).permission === 'granted') {
          try { new Notification(title, { body }) } catch {}
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

  async function toggleNotifications() {
    if (!('Notification' in window)) { notifications.show({ color: 'red', message: 'Браузер не поддерживает уведомления' }); return }
    if ((Notification as any).permission !== 'granted') {
      const perm = await (Notification as any).requestPermission()
      if (perm !== 'granted') { notifications.show({ color: 'gray', message: 'Уведомления не разрешены' }); return }
    }
    setNotifEnabled(true)
    try { localStorage.setItem('training-notif-enabled', '1') } catch {}
    notifications.show({ color: 'green', message: 'Напоминания включены' })
  }

  async function addCatch(values: {
    fish_kind_id?: string
    bait_name?: string
    bait_id?: string
    weight_g?: number
    length_cm?: number
    caught_at: string
    released: boolean
    notes?: string
    point?: { lat: number; lng: number } | null
  }) {
    if (!user || !trainingId) return
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
  }

  async function removeCatch(id: string) {
    if (!trainingId) return
    await deleteCatch({ id, trainingId })
    notifications.show({ color: 'gray', message: 'Поимка удалена' })
  }

  async function editCatch(editingCatch: TrainingCatch, values: {
    fish_kind_id?: string
    bait_name?: string
    bait_id?: string
    weight_g?: number
    length_cm?: number
    caught_at: string
    released: boolean
    notes?: string
    point?: { lat: number; lng: number } | null
  }) {
    if (!user || !trainingId || !editingCatch) return
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
  }

  async function deleteEvent(id: string) {
    if (!trainingId) return
    await removeEvent({ id, trainingId: trainingId as string })
    notifications.show({ color: 'gray', message: 'Пин удалён' })
  }

  async function saveTakenBaits(ids: string[]) {
    if (!trainingId || !user) return
    await setTakenBaits({ trainingId, userId: user.id, userBaitIds: ids })
    notifications.show({ color: 'green', message: 'Список приманок обновлён' })
  }

  async function addEventAction(data: { kind: 'strike' | 'lost' | 'snag'; bait_id?: string; notes?: string; at: string; point?: { lat: number; lng: number } | null }) {
    if (!user || !trainingId) return
    let baitIdToSave = null
    if (data.bait_id) {
      const selected = (takenBaitsTop || []).find((tb: any) => tb.user_bait_id === data.bait_id)
      baitIdToSave = selected?.user_bait_id || null
    }
    const eventData = {
      training_id: trainingId,
      user_id: user.id,
      kind: data.kind,
      bait_id: baitIdToSave,
      lat: data.point?.lat ?? userCoords?.lat ?? training?.lat ?? 53.9,
      lng: data.point?.lng ?? userCoords?.lng ?? training?.lng ?? 27.5667,
      notes: data.notes,
    }
    await addEvent(eventData)
    notifications.show({ color: 'green', message: `${pinLabel(data.kind)} добавлен` })
  }

  async function editEventAction(editingEvent: TrainingEvent, data: { kind: 'strike' | 'lost' | 'snag'; bait_id?: string; notes?: string; at: string; point?: { lat: number; lng: number } | null }) {
    if (!user || !trainingId || !editingEvent) return
    let baitIdToSave = null
    if (data.bait_id) baitIdToSave = data.bait_id
    await updateEvent({
      id: editingEvent.id,
      data: { kind: data.kind, bait_id: baitIdToSave, notes: data.notes, at: data.at, lat: data.point?.lat ?? null, lng: data.point?.lng ?? null },
    })
    notifications.show({ color: 'green', message: `${pinLabel(data.kind)} обновлён` })
  }

  async function quickCatch(data: QuickCatchInput) {
    if (!user || !trainingId) return
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
  }

  async function quickEvent(data: QuickEventInput) {
    if (!user || !trainingId) return
    const eventData = {
      training_id: trainingId,
      user_id: user.id,
      kind: data.kind,
      bait_id: data.currentBait.user_bait_id,
      lat: data.point?.lat ?? userCoords?.lat ?? training?.lat ?? 53.9,
      lng: data.point?.lng ?? userCoords?.lng ?? training?.lng ?? 27.5667,
      notes: data.notes,
    }
    await addEvent(eventData)
    notifications.show({ color: 'green', message: `${pinLabel(data.kind)} добавлен` })
  }

  function updateRig(rig: { bait: any | null; weight: number }) {
    updateCurrentRig(rig)
  }

  const activeTask = useMemo(() => {
    const now = Date.now()
    return (tasksForTimers ?? []).find((t: TrainingTask) => {
      const st = new Date(t.starts_at).getTime()
      const et = t.ends_at ? new Date(t.ends_at).getTime() : st + 60 * 60 * 1000
      return now >= st && now <= et
    })
  }, [tasksForTimers])

  return {
    // data
    training, catches, events, takenBaitsTop, segmentsForMap, tasksForTimers, fishKinds, user,
    // derived
    trainingUsers, activeTask,
    // timers/notifications
    notifEnabled, countdownText, countdownKind,
    toggleNotifications,
    // actions
    addCatch, removeCatch, editCatch, deleteEvent, saveTakenBaits, addEventAction, editEventAction, quickCatch, quickEvent, updateRig,
    // loading
    isLoading,
  }
}

function pinLabel(kind: 'strike' | 'lost' | 'snag') {
  return kind === 'strike' ? 'Поклёвка' : kind === 'lost' ? 'Сход' : 'Зацеп'
}

export type UseTrainingPageVMReturn = ReturnType<typeof useTrainingPageVM>


