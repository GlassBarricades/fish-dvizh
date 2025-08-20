import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Container, Group, Loader, Modal, Paper, Stack, Text, Title, Tabs, Badge, Textarea, Select, NumberInput, Switch, TextInput, Checkbox, ScrollArea, Divider } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { MapContainer, Marker, Polygon as RLPolygon, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useAuth } from '../features/auth/hooks'
import { notifications } from '@mantine/notifications'
import { useTraining, useTrainingCatches, useCreateCatch, useDeleteCatch, useUpdateCatch, useTrainingTakenBaits, useSetTrainingTakenBaits } from '../features/trainings/hooks'
import { useFishKinds } from '../features/dicts/fish/hooks'
import { useBaits } from '../features/dicts/baits/hooks'
import type { TrainingCatch } from '../features/trainings/api'
import { useCreateTrainingSegment, useCreateTrainingTask, useDeleteTrainingSegment, useDeleteTrainingTask, useTrainingPlan, useTrainingSegments, useTrainingTasks, useUpsertTrainingPlan, useUpdateTrainingTask } from '../features/trainings/hooks'

export default function TrainingPage() {
  const { trainingId } = useParams<{ trainingId: string }>()
  const { data: training, isLoading } = useTraining(trainingId)
  const { data: catches } = useTrainingCatches(trainingId)
  const [opened, handlers] = useDisclosure(false)
  const { user } = useAuth()
  const { mutateAsync: createCatch } = useCreateCatch()
  const { mutateAsync: deleteCatch } = useDeleteCatch()
  const { mutateAsync: updateCatch } = useUpdateCatch()
  const { data: fishKinds } = useFishKinds()
  const { data: baits } = useBaits()
  const { data: takenBaitsTop } = useTrainingTakenBaits(trainingId, user?.id)
  const { mutateAsync: setTakenBaits } = useSetTrainingTakenBaits()
  const [takenModalOpened, takenModalHandlers] = useDisclosure(false)
  const [editing, setEditing] = useState<TrainingCatch | null>(null)
  const [filterFish, setFilterFish] = useState<string | undefined>(undefined)
  const [filterBait, setFilterBait] = useState<string>('')
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('training-notif-enabled') === '1' } catch { return false }
  })
  const [onlyActiveSegment, setOnlyActiveSegment] = useState<boolean>(false)
  const [countdownText, setCountdownText] = useState<string | null>(null)
  const [countdownKind, setCountdownKind] = useState<'starts' | 'ends' | 'next' | null>(null)

  const lastUserBait = (() => {
    if (!user) return ''
    const own = (catches ?? []).filter((c) => c.user_id === user.id && (c.bait_name || c.bait_id))
    if (own.length === 0) return ''
    own.sort((a,b) => new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime())
    const last = own[0] as any
    return last.dict_baits ? `${last.dict_baits.brand ?? ''} ${last.dict_baits.name ?? ''} ${last.dict_baits.color ?? ''} ${last.dict_baits.size ?? ''}`.trim() : (last.bait_name || '')
  })()

  const mapCatches = useMemo(() => (
    (catches ?? [])
      .filter((c) => !filterFish || c.fish_kind_id === filterFish)
      .filter((c) => {
        const baitLabel = (c as any).dict_baits
          ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`.toLowerCase()
          : (c.bait_name || '').toLowerCase()
        return !filterBait || baitLabel.includes(filterBait.toLowerCase())
      })
      .filter((c) => c.lat && c.lng)
  ), [catches, filterFish, filterBait])

  // Timers for tasks
  const { data: segmentsForMap } = useTrainingSegments(trainingId)
  const { data: tasksForTimers } = useTrainingTasks(trainingId)
  const activeTask = useMemo(() => {
    const now = Date.now()
    return (tasksForTimers ?? []).find((t: any) => {
      const st = new Date(t.starts_at).getTime()
      const et = t.ends_at ? new Date(t.ends_at).getTime() : st + 60 * 60 * 1000
      return now >= st && now <= et
    })
  }, [tasksForTimers])
  const timeoutsRef = useRef<number[]>([])
  useEffect(() => {
    timeoutsRef.current.forEach((id: any) => clearTimeout(id as any))
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
        if ('Notification' in window && Notification.permission === 'granted') {
          try { new Notification(title, { body }) } catch {}
        }
        playBeep()
        notifications.show({ title, message: body })
      }, ts - now)
      timeoutsRef.current.push(id)
    }
    tasksForTimers.forEach((t: any) => {
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
      let current: any = null
      current = tasks.find((t: any) => {
        const st = new Date(t.starts_at).getTime()
        const et = t.ends_at ? new Date(t.ends_at).getTime() : st
        return now >= st && now <= (et || st)
      })
      if (current) {
        const st = new Date(current.starts_at).getTime()
        const et = current.ends_at ? new Date(current.ends_at).getTime() : st
        if (now < st) { kind = 'starts'; target = st } else if (et && now <= et) { kind = 'ends'; target = et }
      } else {
        const upcoming = tasks.map((t: any) => ({ t, st: new Date(t.starts_at).getTime() })).filter(x => x.st > now).sort((a,b) => a.st - b.st)[0]
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
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={2}>{training.title}</Title>
            <Group gap="xs">
              <Badge variant="light">{training.type === 'team' ? 'Командная' : 'Личная'}</Badge>
              <Text size="sm" c="dimmed">Начало: {new Date(training.starts_at).toLocaleString('ru-RU')}</Text>
              {training.ends_at && (
                <Text size="sm" c="dimmed">Окончание: {new Date(training.ends_at).toLocaleString('ru-RU')}</Text>
              )}
            </Group>
          </Stack>
          <Group>
            {countdownText && (
              <Badge variant="outline" color={countdownKind === 'ends' ? 'green' : countdownKind === 'starts' ? 'yellow' : 'blue'}>
                {countdownKind === 'ends' ? 'Осталось ' : countdownKind === 'starts' ? 'Старт через ' : 'След. задача через '}
                {countdownText}
              </Badge>
            )}
            <Button variant={notifEnabled ? 'filled' : 'light'} onClick={async () => {
              if (!('Notification' in window)) { notifications.show({ color: 'red', message: 'Браузер не поддерживает уведомления' }); return }
              if (Notification.permission !== 'granted') {
                const perm = await Notification.requestPermission()
                if (perm !== 'granted') { notifications.show({ color: 'gray', message: 'Уведомления не разрешены' }); return }
              }
              setNotifEnabled(true)
              try { localStorage.setItem('training-notif-enabled', '1') } catch {}
              notifications.show({ color: 'green', message: 'Напоминания включены' })
            }}>{notifEnabled ? 'Напоминания включены' : 'Включить напоминания'}</Button>
            <Button component={Link} to="/competitions" variant="light">К списку</Button>
          </Group>
        </Group>

        <Tabs defaultValue="catches">
          <Tabs.List>
            <Tabs.Tab value="catches">Поимки ({catches?.length ?? 0})</Tabs.Tab>
            <Tabs.Tab value="map">Карта</Tabs.Tab>
            <Tabs.Tab value="stats">Статистика</Tabs.Tab>
            <Tabs.Tab value="baits">Мои приманки</Tabs.Tab>
            <Tabs.Tab value="plan">План</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="catches" pt="md">
            <Stack gap="sm">
              <Group>
                <Select
                  label="Фильтр: вид рыбы"
                  placeholder="Все"
                  data={(fishKinds ?? []).map((f) => ({ value: f.id, label: f.name }))}
                  value={filterFish}
                  onChange={(v) => setFilterFish(v || undefined)}
                  clearable
                  searchable
                />
                <TextInput
                  label="Фильтр: приманка"
                  placeholder="строка поиска"
                  value={filterBait}
                  onChange={(e) => setFilterBait(e.currentTarget.value)}
                />
                <Switch
                  label="Только активный сегмент"
                  checked={onlyActiveSegment}
                  onChange={(e) => setOnlyActiveSegment(e.currentTarget.checked)}
                  disabled={!activeTask?.segment_id}
                />
              </Group>
              <Group justify="space-between" align="center">
                <Group>
                  <Button variant="light" onClick={takenModalHandlers.open}>Мои приманки</Button>
                </Group>
                <Button onClick={handlers.open}>Добавить поимку</Button>
              </Group>
              {((catches ?? []).length === 0) ? (
                <Text c="dimmed">Поимок пока нет</Text>
              ) : (
                ((catches ?? [])
                  .filter((c) => !filterFish || c.fish_kind_id === filterFish)
                  .filter((c) => !filterBait || (c.bait_name || '').toLowerCase().includes(filterBait.toLowerCase()))
                ).map((c) => (
                  <Card key={c.id} withBorder>
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Text fw={500}>Вид: {fishKinds?.find(f => f.id === c.fish_kind_id)?.name || '—'}</Text>
                        <Text size="sm" c="dimmed">
                          {new Date(c.caught_at).toLocaleString('ru-RU')}
                          {c.weight_g ? ` • Вес: ${(c.weight_g/1000).toFixed(2)} кг` : ''}
                          {c.length_cm ? ` • Длина: ${c.length_cm} см` : ''}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Приманка: {(((c as any).dict_baits
                            ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`
                            : (c.bait_name || '')).trim()) || '—'}
                        </Text>
                      </Stack>
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          {c.lat && c.lng ? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : ''}
                        </Text>
                        <Button size="xs" variant="light" onClick={() => setEditing(c)}>Редактировать</Button>
                        <Button size="xs" color="red" variant="light" onClick={async () => {
                          if (!trainingId) return
                          await deleteCatch({ id: c.id, trainingId })
                          notifications.show({ color: 'gray', message: 'Поимка удалена' })
                        }}>Удалить</Button>
                      </Group>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="map" pt="md">
            <Stack gap="sm">
              <Group>
                <Select
                  label="Фильтр: вид рыбы"
                  placeholder="Все"
                  data={(fishKinds ?? []).map((f) => ({ value: f.id, label: f.name }))}
                  value={filterFish}
                  onChange={(v) => setFilterFish(v || undefined)}
                  clearable
                  searchable
                />
                <TextInput
                  label="Фильтр: приманка"
                  placeholder="строка поиска"
                  value={filterBait}
                  onChange={(e) => setFilterBait(e.currentTarget.value)}
                />
              </Group>
              <Paper withBorder>
                <div style={{ height: 520 }}>
                  <MapContainer center={[53.9, 27.5667]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapVisibilityFix />
                    <FlyToActiveSegment segments={segmentsForMap || []} activeSegmentId={activeTask?.segment_id || undefined} />
                    {(segmentsForMap ?? []).map((s: any) => {
                      const ring = s.area_geojson?.coordinates?.[0] || []
                      const latlngs = ring.map((p: [number, number]) => [p[1], p[0]])
                      const isActive = activeTask && activeTask.segment_id === s.id
                      return (
                        <RLPolygon key={s.id} positions={latlngs as any} pathOptions={{ color: isActive ? 'red' : 'orange', weight: isActive ? 3 : 2, fillOpacity: isActive ? 0.2 : 0.1 }} />
                      )
                    })}
                    {mapCatches.map((c) => (
                      <Marker key={c.id} position={[c.lat as number, c.lng as number]} icon={new L.Icon({ iconUrl, shadowUrl: iconShadowUrl, iconSize: [25,41], iconAnchor:[12,41] })}>
                        <Popup>
                          <Stack gap={4}>
                            <Text size="sm">{new Date(c.caught_at).toLocaleString('ru-RU')}</Text>
                            <Text size="sm">{fishKinds?.find(f => f.id === c.fish_kind_id)?.name || '—'}</Text>
                            {(c as any).dict_baits ? (
                              <Text size="sm">{`${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`.trim()}</Text>
                            ) : (c.bait_name && <Text size="sm">{c.bait_name}</Text>)}
                            {(c.weight_g || c.length_cm) && <Text size="sm">{c.weight_g ? `${(c.weight_g/1000).toFixed(2)} кг` : ''}{c.length_cm ? ` • ${c.length_cm} см` : ''}</Text>}
                          </Stack>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="stats" pt="md">
            <Stack gap="sm">
              {(() => {
                const list = catches ?? []
                const total = list.length
                const totalWeightG = list.reduce((s, c) => s + (c.weight_g || 0), 0)
                const species: Record<string, number> = {}
                list.forEach((c) => { const id = c.fish_kind_id || '—'; species[id] = (species[id] || 0) + 1 })
                return (
                  <Group grow>
                    <Card withBorder p="md"><Stack gap={4}><Text size="sm" c="dimmed">Всего поимок</Text><Title order={3}>{total}</Title></Stack></Card>
                    <Card withBorder p="md"><Stack gap={4}><Text size="sm" c="dimmed">Суммарный вес</Text><Title order={3}>{(totalWeightG/1000).toFixed(2)} кг</Title></Stack></Card>
                    <Card withBorder p="md"><Stack gap={4}><Text size="sm" c="dimmed">Видов</Text><Title order={3}>{Object.keys(species).filter(k=>k!=='—').length}</Title></Stack></Card>
                  </Group>
                )
              })()}
              <Card withBorder p="md">
                <Title order={5} mb="xs">По видам</Title>
                <Stack gap={4}>
                  {Object.entries(((catches ?? []).reduce((acc: Record<string, number>, c) => { const id = c.fish_kind_id || '—'; acc[id] = (acc[id] || 0) + 1; return acc }, {}))).map(([id, count]) => (
                    <Group key={id} justify="space-between">
                      <Text>{fishKinds?.find(f => f.id === id)?.name || '—'}</Text>
                      <Text c="dimmed">{count}</Text>
                    </Group>
                  ))}
                  {(catches ?? []).length === 0 && <Text c="dimmed">Нет данных</Text>}
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="baits" pt="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Title order={5}>Мои приманки</Title>
                <Button variant="light" onClick={takenModalHandlers.open}>Управлять</Button>
              </Group>
              <Card withBorder p="md">
                <Stack gap={6}>
                  {((takenBaitsTop ?? []).length === 0) && <Text c="dimmed">Список пуст</Text>}
                  {(takenBaitsTop ?? []).map((b: any) => {
                    const label = `${b.brand ?? ''} ${b.name ?? ''}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}`.trim().toLowerCase()
                    const count = (catches ?? []).filter((c) => {
                      const direct = c.bait_id === b.bait_id
                      const textLabel = ((c as any).dict_baits
                        ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`
                        : (c.bait_name || '')).trim().toLowerCase()
                      return direct || (textLabel !== '' && textLabel === label)
                    }).length
                    return (
                      <Group key={b.bait_id} justify="space-between">
                        <Text>{`${b.brand ?? ''} ${b.name ?? ''}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}`.trim()}</Text>
                        <Text c="dimmed">{count}</Text>
                      </Group>
                    )
                  })}
                </Stack>
              </Card>
            </Stack>
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
        onSubmit={async (values) => {
          if (!user || !trainingId) return
          try {
            await createCatch({
              training_id: trainingId,
              user_id: user.id,
              fish_kind_id: values.fish_kind_id || null,
              bait_id: values.bait_id || null,
              weight_g: values.weight_g ?? null,
              length_cm: values.length_cm ?? null,
              lat: values.point?.lat ?? null,
              lng: values.point?.lng ?? null,
              caught_at: values.caught_at,
              released: values.released,
              notes: values.notes || undefined,
              bait_name: undefined,
            })
            notifications.show({ color: 'green', message: 'Поимка добавлена' })
            handlers.close()
          } catch (e: any) {
            notifications.show({ color: 'red', message: e?.message ?? 'Не удалось добавить поимку' })
          }
        }}
      />
      <EditCatchModal
        opened={!!editing}
        onClose={() => setEditing(null)}
        initial={editing as any}
        onOpenManageBaits={takenModalHandlers.open}
        onSubmit={async (id, values) => {
          if (!trainingId || !id) return
          try {
            await updateCatch({ id, input: {
              fish_kind_id: values.fish_kind_id ?? null,
              bait_id: values.bait_id ?? null,
              bait_name: null,
              weight_g: values.weight_g ?? null,
              length_cm: values.length_cm ?? null,
              lat: values.point ? values.point.lat : null,
              lng: values.point ? values.point.lng : null,
              caught_at: values.caught_at,
              released: values.released,
              notes: values.notes ?? null,
            }, trainingId })
            notifications.show({ color: 'green', message: 'Поимка обновлена' })
            setEditing(null)
          } catch (e: any) {
            notifications.show({ color: 'red', message: e?.message ?? 'Не удалось обновить поимку' })
          }
        }}
      />

      <ManageTakenBaitsModal
        opened={takenModalOpened}
        onClose={takenModalHandlers.close}
        baits={baits?.map(b => ({ id: b.id, label: `${b.brand} ${b.name}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}` })) || []}
        selectedIds={new Set((takenBaitsTop ?? []).map((tb: any) => tb.bait_id))}
        onSave={async (ids) => {
          if (!trainingId || !user) return
          await setTakenBaits({ trainingId, userId: user.id, baitIds: ids })
          notifications.show({ color: 'green', message: 'Список приманок обновлён' })
          takenModalHandlers.close()
        }}
      />
    </Container>
  )
}

type AddCatchForm = {
  fish_kind_id?: string
  bait_name?: string
  bait_id?: string
  weight_g?: number
  length_cm?: number
  caught_at: string
  released: boolean
  notes?: string
  point?: { lat: number; lng: number } | null
}

function AddCatchModal({ opened, onClose, onSubmit, initialBait, onOpenManageBaits }: { opened: boolean; onClose: () => void; onSubmit: (data: AddCatchForm) => Promise<void>; initialBait?: string; onOpenManageBaits: () => void }) {
  const { data: fishKinds } = useFishKinds()
  const { user } = useAuth()
  const { trainingId } = useParams<{ trainingId: string }>()
  const [fishKind, setFishKind] = useState<string | undefined>(undefined)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [length, setLength] = useState<number | undefined>(undefined)
  // Убираем текстовое добавление — оставляем только выбор из пула
  const [baitId, setBaitId] = useState<string | undefined>(undefined)
  const { data: takenBaitsInner } = useTrainingTakenBaits(trainingId, user?.id)
  const takenOptions = (takenBaitsInner ?? []).map((tb: any) => ({ id: tb.bait_id, label: `${tb.brand ?? ''} ${tb.name ?? ''}${tb.color ? ' ' + tb.color : ''}${tb.size ? ' ' + tb.size : ''}`.trim() }))
  const [caughtAt, setCaughtAt] = useState<Date | null>(new Date())
  const [released, setReleased] = useState<boolean>(true)
  const [notes, setNotes] = useState<string>('')
  const [point, setPoint] = useState<L.LatLng | null>(null)
  useEffect(() => {
    if (opened && initialBait && !baitId) {
      const found = takenOptions.find((o: any) => o.label.toLowerCase() === initialBait.toLowerCase())
      if (found) setBaitId(found.id)
    }
  }, [opened, initialBait])
  return (
    <Modal opened={opened} onClose={onClose} title="Добавить поимку" size="lg">
      <Stack gap="md">
        <Group grow>
          <Select label="Вид рыбы" placeholder="Выберите" data={(fishKinds ?? []).map(f => ({ value: f.id, label: f.name }))} value={fishKind} onChange={(v) => setFishKind(v || undefined)} searchable clearable />
          <DateTimePicker label="Время поимки" value={caughtAt as any} onChange={(v) => setCaughtAt(v as unknown as Date | null)} required popoverProps={{ withinPortal: true }} />
        </Group>
        <Group grow>
          <NumberInput label="Вес (г)" value={weight} onChange={(v) => setWeight(v as number | undefined)} min={0} step={10} />
          <NumberInput label="Длина (см)" value={length} onChange={(v) => setLength(v as number | undefined)} min={0} step={1} />
        </Group>
        <Select
          label="Приманка"
          placeholder={takenBaitsInner && takenBaitsInner.length > 0 ? 'Выберите приманку' : 'Сначала добавьте свои приманки'}
          data={takenOptions.map((o: any) => ({ value: o.id, label: o.label }))}
          value={baitId}
          onChange={(v) => setBaitId(v || undefined)}
          searchable
          clearable={false}
          disabled={!takenBaitsInner || takenBaitsInner.length === 0}
          comboboxProps={{ withinPortal: true }}
        />
        <Switch label="Отпущена" checked={released} onChange={(e) => setReleased(e.currentTarget.checked)} />
        <Textarea label="Заметка" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} minRows={2} />
        <Stack>
          <Text size="sm" c="dimmed">Клик — поставить точку поимки. Двойной клик — очистить.</Text>
          <div style={{ height: 260 }}>
            <MapContainer center={[53.9, 27.5667]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CatchClick setPoint={setPoint} />
              {point && <Marker position={point} icon={new L.Icon({ iconUrl, shadowUrl: iconShadowUrl, iconSize: [25,41], iconAnchor:[12,41] })} />}
            </MapContainer>
          </div>
        </Stack>
        <Group justify="space-between">
          <Button variant="light" onClick={onOpenManageBaits}>Управлять моими приманками</Button>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onSubmit({
            fish_kind_id: fishKind,
            bait_id: baitId,
            bait_name: undefined,
            weight_g: weight,
            length_cm: length,
            caught_at: caughtAt ? caughtAt.toISOString() : new Date().toISOString(),
            released,
            notes: notes.trim() || undefined,
            point: point ? { lat: point.lat, lng: point.lng } : null,
          })}>Сохранить</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function EditCatchModal({ opened, onClose, initial, onSubmit, onOpenManageBaits }: { opened: boolean; onClose: () => void; initial: TrainingCatch | null; onSubmit: (id: string, data: AddCatchForm) => Promise<void>; onOpenManageBaits: () => void }) {
  const { data: fishKinds } = useFishKinds()
  const [fishKind, setFishKind] = useState<string | undefined>(initial?.fish_kind_id || undefined)
  const [weight, setWeight] = useState<number | undefined>(initial?.weight_g || undefined)
  const [length, setLength] = useState<number | undefined>(initial?.length_cm || undefined)
  const initialDictLabel = ''
  const { user } = useAuth()
  const { trainingId } = useParams<{ trainingId: string }>()
  const { data: takenBaitsInner } = useTrainingTakenBaits(trainingId, user?.id)
  const takenOptions = (takenBaitsInner ?? []).map((tb: any) => ({ id: tb.bait_id, label: `${tb.brand ?? ''} ${tb.name ?? ''}${tb.color ? ' ' + tb.color : ''}${tb.size ? ' ' + tb.size : ''}`.trim() }))
  const [baitId, setBaitId] = useState<string | undefined>(initial?.bait_id || undefined)
  const [caughtAt, setCaughtAt] = useState<Date | null>(initial ? new Date(initial.caught_at) : new Date())
  const [released, setReleased] = useState<boolean>(initial?.released ?? true)
  const [notes, setNotes] = useState<string>(initial?.notes || '')
  const [point, setPoint] = useState<L.LatLng | null>(initial?.lat && initial?.lng ? new L.LatLng(initial.lat, initial.lng) : null)

  useEffect(() => {
    if (initial) {
      setFishKind(initial.fish_kind_id || undefined)
      setWeight(initial.weight_g || undefined)
      setLength(initial.length_cm || undefined)
      setBaitId(initial.bait_id || undefined)
      // если bait_id отсутствует, попробуем сопоставить по словарной строке с пулом
      if (!initial.bait_id && (initial as any).dict_baits) {
        // при наличии словарной строки ниже сопоставим с пулом
      }
      setCaughtAt(new Date(initial.caught_at))
      setReleased(initial.released ?? true)
      setNotes(initial.notes || '')
      setPoint(initial.lat && initial.lng ? new L.LatLng(initial.lat, initial.lng) : null)
    }
    if (!initial?.bait_id && initialDictLabel) {
      const found = takenOptions.find((o: any) => o.label === initialDictLabel)
      if (found) setBaitId(found.id)
    }
  }, [initial, initialDictLabel, JSON.stringify(takenOptions)])

  return (
    <Modal opened={opened} onClose={onClose} title="Редактировать поимку" size="lg">
      <Stack gap="md">
        <Group grow>
          <Select label="Вид рыбы" placeholder="Выберите" data={(fishKinds ?? []).map(f => ({ value: f.id, label: f.name }))} value={fishKind} onChange={(v) => setFishKind(v || undefined)} searchable clearable />
          <DateTimePicker label="Время поимки" value={caughtAt as any} onChange={(v) => setCaughtAt(v as unknown as Date | null)} required popoverProps={{ withinPortal: true }} />
        </Group>
        <Group grow>
          <NumberInput label="Вес (г)" value={weight} onChange={(v) => setWeight(v as number | undefined)} min={0} step={10} />
          <NumberInput label="Длина (см)" value={length} onChange={(v) => setLength(v as number | undefined)} min={0} step={1} />
        </Group>
        <Select
          label="Приманка"
          placeholder={takenBaitsInner && takenBaitsInner.length > 0 ? 'Выберите приманку' : 'Сначала добавьте свои приманки'}
          data={(() => {
            const base = takenOptions.map((o: any) => ({ value: o.id, label: o.label }))
            if (initial?.bait_id && !base.some((o: any) => o.value === initial.bait_id)) {
              const d = (initial as any)?.dict_baits
              const label = d ? `${d.brand ?? ''} ${d.name ?? ''}${d.color ? ' ' + d.color : ''}${d.size ? ' ' + d.size : ''}`.trim() : 'Текущая приманка'
              base.unshift({ value: initial.bait_id, label })
            }
            return base
          })()}
          value={baitId}
          onChange={(v) => setBaitId(v || undefined)}
          searchable
          clearable={false}
          disabled={(takenBaitsInner?.length ?? 0) === 0 && !initial?.bait_id}
        />
        <Switch label="Отпущена" checked={released} onChange={(e) => setReleased(e.currentTarget.checked)} />
        <Textarea label="Заметка" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} minRows={2} />
        <Stack>
          <Text size="sm" c="dimmed">Клик — переместить точку поимки. Двойной клик — очистить.</Text>
          <div style={{ height: 260 }}>
            <MapContainer center={point ? [point.lat, point.lng] : [53.9, 27.5667]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CatchClick setPoint={setPoint} />
              {point && <Marker position={point} icon={new L.Icon({ iconUrl, shadowUrl: iconShadowUrl, iconSize: [25,41], iconAnchor:[12,41] })} />}
            </MapContainer>
          </div>
        </Stack>
        <Group justify="space-between">
          <Button variant="light" onClick={onOpenManageBaits}>Управлять моими приманками</Button>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => initial && onSubmit(initial.id, {
            fish_kind_id: fishKind,
            bait_id: baitId ?? undefined,
            bait_name: undefined,
            weight_g: weight,
            length_cm: length,
            caught_at: caughtAt ? caughtAt.toISOString() : new Date().toISOString(),
            released,
            notes: notes.trim() || undefined,
            point: point ? { lat: point.lat, lng: point.lng } : null,
          })} disabled={!baitId}>Сохранить</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function ManageTakenBaitsModal({ opened, onClose, baits, selectedIds, onSave }: { opened: boolean; onClose: () => void; baits: { id: string; label: string }[]; selectedIds: Set<string>; onSave: (ids: string[]) => Promise<void> }) {
  const [query, setQuery] = useState('')
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedIds))

  useEffect(() => { setChecked(new Set(selectedIds)) }, [opened, selectedIds])

  const filtered = baits.filter(b => b.label.toLowerCase().includes(query.toLowerCase()))
  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id); else next.add(id)
    setChecked(next)
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Мои приманки" size="lg">
      <Stack>
        <TextInput placeholder="Поиск" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
        <Divider />
        <ScrollArea style={{ height: 360 }}>
          <Stack>
            {filtered.map(b => (
              <Checkbox key={b.id} label={b.label} checked={checked.has(b.id)} onChange={() => toggle(b.id)} />
            ))}
            {filtered.length === 0 && <Text c="dimmed">Ничего не найдено</Text>}
          </Stack>
        </ScrollArea>
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onSave(Array.from(checked))}>Сохранить</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function CatchClick({ setPoint }: { setPoint: (p: L.LatLng | null) => void }) {
  useMapEvents({
    click(e) { setPoint(e.latlng) },
    dblclick() { setPoint(null) }
  })
  const map = useMap()
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0)
  }, [map])
  return null
}

function MapVisibilityFix() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const invalidate = () => {
      setTimeout(() => map.invalidateSize(), 0)
      setTimeout(() => map.invalidateSize(), 200)
    }
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) invalidate()
    }, { threshold: [0, 0.1, 0.5, 1] })
    io.observe(container)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(container)
    invalidate()
    return () => { io.disconnect(); ro.disconnect() }
  }, [map])
  return null
}

function FlyToActiveSegment({ segments, activeSegmentId }: { segments: any[]; activeSegmentId?: string }) {
  const map = useMap()
  useEffect(() => {
    if (!activeSegmentId) return
    const s = (segments || []).find((x) => x.id === activeSegmentId)
    const ring = s?.area_geojson?.coordinates?.[0] || []
    if (!ring.length) return
    const latlngs = ring.map((p: [number, number]) => [p[1], p[0]]) as any
    try {
      const bounds = L.latLngBounds(latlngs)
      map.fitBounds(bounds.pad(0.2))
    } catch {}
  }, [activeSegmentId, segments, map])
  return null
}

function TrainingPlanTab({ trainingId }: { trainingId: string }) {
  const { data: plan } = useTrainingPlan(trainingId)
  const { data: segments } = useTrainingSegments(trainingId)
  const { data: tasks } = useTrainingTasks(trainingId)
  const { mutateAsync: savePlan } = useUpsertTrainingPlan()
  const { mutateAsync: createSegment } = useCreateTrainingSegment()
  const { mutateAsync: deleteSegment } = useDeleteTrainingSegment()
  const { mutateAsync: createTask } = useCreateTrainingTask()
  const { mutateAsync: updateTask } = useUpdateTrainingTask()
  const { mutateAsync: deleteTask } = useDeleteTrainingTask()
  const { data: fishKinds } = useFishKinds()

  const [goal, setGoal] = useState(plan?.goal || '')
  const [notes, setNotes] = useState(plan?.notes || '')
  useEffect(() => { setGoal(plan?.goal || ''); setNotes(plan?.notes || '') }, [plan?.goal, plan?.notes])

  // Segment creation state
  const [segName, setSegName] = useState('')
  const [segPolygon, setSegPolygon] = useState<L.LatLng[]>([])

  function SegmentDraw() {
    useMapEvents({
      contextmenu(e) { setSegPolygon((prev) => [...prev, e.latlng]) },
      dblclick() { setSegPolygon([]) },
    })
    return null
  }

  // Task creation state
  const [taskTitle, setTaskTitle] = useState('')
  const [taskStart, setTaskStart] = useState<Date | null>(new Date())
  const [taskEnd, setTaskEnd] = useState<Date | null>(null)
  const [taskSegmentId, setTaskSegmentId] = useState<string | undefined>(undefined)
  const [taskFishKind, setTaskFishKind] = useState<string | undefined>(undefined)
  const [taskNotes, setTaskNotes] = useState('')

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Title order={5} mb="xs">Цель и заметки</Title>
        <Stack>
          <TextInput label="Цель тренировки" value={goal} onChange={(e) => setGoal(e.currentTarget.value)} placeholder="Например: проверить косы на джиг, цель – судак" />
          <Textarea label="Заметки" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} minRows={2} />
          <Group justify="flex-end">
            <Button onClick={async () => { await savePlan({ training_id: trainingId, goal: goal.trim() || null, notes: notes.trim() || null }); notifications.show({ color: 'green', message: 'План сохранён' }) }}>Сохранить план</Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">Сегменты (зоны)</Title>
        <Group align="flex-start" grow>
          <Stack style={{ flex: 1 }}>
            <TextInput label="Название сегмента" value={segName} onChange={(e) => setSegName(e.currentTarget.value)} />
            <Text size="sm" c="dimmed">Правый клик — добавить вершину полигона, двойной клик — очистить.</Text>
            <div style={{ height: 260 }}>
              <MapContainer center={[53.9, 27.5667]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapVisibilityFix />
                <SegmentDraw />
                {segPolygon.length >= 2 && (
                  <RLPolygon positions={segPolygon as any} pathOptions={{ color: 'teal' }} />
                )}
              </MapContainer>
            </div>
            <Group justify="flex-end">
              <Button onClick={async () => {
                if (!segName.trim() || segPolygon.length < 3) return
                await createSegment({ training_id: trainingId, name: segName.trim(), area_points: segPolygon.map(p => [p.lng, p.lat]) as [number, number][] })
                setSegName(''); setSegPolygon([])
                notifications.show({ color: 'green', message: 'Сегмент добавлен' })
              }}>Добавить сегмент</Button>
            </Group>
          </Stack>
          <Stack style={{ flex: 1 }}>
            <Stack gap={6}>
              {(segments ?? []).length === 0 && <Text c="dimmed">Сегментов нет</Text>}
              {(segments ?? []).map((s) => (
                <Group key={s.id} justify="space-between">
                  <Text>{s.name}</Text>
                  <Button size="xs" color="red" variant="light" onClick={async () => { await deleteSegment({ id: s.id, trainingId }); notifications.show({ color: 'gray', message: 'Сегмент удалён' }) }}>Удалить</Button>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Group>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">Задачи (таймбоксы)</Title>
        <Stack>
          <Group grow>
            <TextInput label="Название" value={taskTitle} onChange={(e) => setTaskTitle(e.currentTarget.value)} />
            <Select label="Сегмент" placeholder="—" data={(segments ?? []).map(s => ({ value: s.id, label: s.name }))} value={taskSegmentId} onChange={(v) => setTaskSegmentId(v || undefined)} clearable />
          </Group>
          <Group grow>
            <DateTimePicker label="Начало" value={taskStart as any} onChange={(v) => setTaskStart(v as unknown as Date | null)} required />
            <DateTimePicker label="Окончание" value={taskEnd as any} onChange={(v) => setTaskEnd(v as unknown as Date | null)} />
          </Group>
          <Group grow>
            <Select label="Целевая рыба" placeholder="—" data={(fishKinds ?? []).map(f => ({ value: f.id, label: f.name }))} value={taskFishKind} onChange={(v) => setTaskFishKind(v || undefined)} clearable searchable />
            <TextInput label="Заметки" value={taskNotes} onChange={(e) => setTaskNotes(e.currentTarget.value)} />
          </Group>
          <Group justify="flex-end">
            <Button onClick={async () => {
              if (!taskTitle.trim() || !taskStart) return
              await createTask({ training_id: trainingId, title: taskTitle.trim(), starts_at: taskStart.toISOString(), ends_at: taskEnd ? taskEnd.toISOString() : null, segment_id: taskSegmentId || null, target_fish_kind_id: taskFishKind || null, notes: taskNotes.trim() || null })
              setTaskTitle(''); setTaskStart(new Date()); setTaskEnd(null); setTaskSegmentId(undefined); setTaskFishKind(undefined); setTaskNotes('')
              notifications.show({ color: 'green', message: 'Задача добавлена' })
            }}>Добавить задачу</Button>
          </Group>
        </Stack>
        <Divider my="sm" />
        <Stack gap={6}>
          {(tasks ?? []).length === 0 && <Text c="dimmed">Задач нет</Text>}
          {(tasks ?? []).map((t) => (
            <Card key={t.id} withBorder>
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Text fw={500}>{t.title}</Text>
                  <Text size="sm" c="dimmed">{new Date(t.starts_at).toLocaleString('ru-RU')} {t.ends_at ? `— ${new Date(t.ends_at).toLocaleString('ru-RU')}` : ''}</Text>
                  <Text size="sm" c="dimmed">Сегмент: {(segments ?? []).find(s => s.id === t.segment_id)?.name || '—'}{t.target_fish_kind_id ? ` • Цель: ${(fishKinds ?? []).find(f => f.id === t.target_fish_kind_id)?.name}` : ''}</Text>
                  {t.notes && <Text size="sm" c="dimmed">{t.notes}</Text>}
                </Stack>
                <Group gap="xs">
                  <Button size="xs" variant="light" onClick={async () => {
                    await updateTask({ id: t.id, input: { notes: (t.notes || '') + ' ✓' }, trainingId })
                    notifications.show({ color: 'green', message: 'Отмечено' })
                  }}>Отметить</Button>
                  <Button size="xs" color="red" variant="light" onClick={async () => { await deleteTask({ id: t.id, trainingId }); notifications.show({ color: 'gray', message: 'Задача удалена' }) }}>Удалить</Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}

