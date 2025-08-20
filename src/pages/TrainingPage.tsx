import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button, Card, Container, Group, Loader, Modal, Paper, Stack, Text, Title, Tabs, Badge, Textarea, Select, NumberInput, Switch, TextInput, Autocomplete, Checkbox, ScrollArea, Divider } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useAuth } from '../features/auth/hooks'
import { notifications } from '@mantine/notifications'
import { useTraining, useTrainingCatches, useCreateCatch, useDeleteCatch, useUpdateCatch, useTrainingTakenBaits, useSetTrainingTakenBaits } from '../features/trainings/hooks'
import { useFishKinds } from '../features/dicts/fish/hooks'
import { useBaits } from '../features/dicts/baits/hooks'
import type { TrainingCatch } from '../features/trainings/api'

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

  const lastUserBait = (() => {
    if (!user) return ''
    const own = (catches ?? []).filter((c) => c.user_id === user.id && (c.bait_name || c.bait_id))
    if (own.length === 0) return ''
    own.sort((a,b) => new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime())
    const last = own[0] as any
    return last.dict_baits ? `${last.dict_baits.brand ?? ''} ${last.dict_baits.name ?? ''} ${last.dict_baits.color ?? ''} ${last.dict_baits.size ?? ''}`.trim() : (last.bait_name || '')
  })()

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
            <Button component={Link} to="/competitions" variant="light">К списку</Button>
          </Group>
        </Group>

        <Tabs defaultValue="catches">
          <Tabs.List>
            <Tabs.Tab value="catches">Поимки ({catches?.length ?? 0})</Tabs.Tab>
            <Tabs.Tab value="map" disabled>Карта (скоро)</Tabs.Tab>
            <Tabs.Tab value="stats" disabled>Статистика (скоро)</Tabs.Tab>
            <Tabs.Tab value="baits" disabled>Приманки (скоро)</Tabs.Tab>
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
                        {(c.bait_id || c.bait_name) && (
                          <Text size="sm" c="dimmed">
                            Приманка: {((c as any).dict_baits ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`.trim() : c.bait_name) || '—'}
                          </Text>
                        )}
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
        </Tabs>
      </Stack>
      <AddCatchModal
        opened={opened}
        onClose={handlers.close}
        initialBait={lastUserBait}
        onSubmit={async (values) => {
          if (!user || !trainingId) return
          try {
            await createCatch({
              training_id: trainingId,
              user_id: user.id,
              fish_kind_id: values.fish_kind_id || null,
              weight_g: values.weight_g ?? null,
              length_cm: values.length_cm ?? null,
              lat: values.point?.lat ?? null,
              lng: values.point?.lng ?? null,
              caught_at: values.caught_at,
              released: values.released,
              notes: values.notes || undefined,
              bait_name: values.bait_name || undefined,
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
        onSubmit={async (id, values) => {
          if (!trainingId || !id) return
          try {
            await updateCatch({ id, input: {
              fish_kind_id: values.fish_kind_id ?? null,
              bait_name: values.bait_name ?? null,
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

function AddCatchModal({ opened, onClose, onSubmit, initialBait }: { opened: boolean; onClose: () => void; onSubmit: (data: AddCatchForm) => Promise<void>; initialBait?: string }) {
  const { data: fishKinds } = useFishKinds()
  const { user } = useAuth()
  const { trainingId } = useParams<{ trainingId: string }>()
  const [fishKind, setFishKind] = useState<string | undefined>(undefined)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [length, setLength] = useState<number | undefined>(undefined)
  const [bait, setBait] = useState<string>('')
  const [baitId, setBaitId] = useState<string | undefined>(undefined)
  const { data: takenBaitsInner } = useTrainingTakenBaits(trainingId, user?.id)
  const takenOptions = (takenBaitsInner ?? []).map((tb: any) => ({ id: tb.bait_id, label: `${tb.brand ?? ''} ${tb.name ?? ''}${tb.color ? ' ' + tb.color : ''}${tb.size ? ' ' + tb.size : ''}`.trim() }))
  const [caughtAt, setCaughtAt] = useState<Date | null>(new Date())
  const [released, setReleased] = useState<boolean>(true)
  const [notes, setNotes] = useState<string>('')
  const [point, setPoint] = useState<L.LatLng | null>(null)
  useEffect(() => {
    if (opened && initialBait && !bait) {
      setBait(initialBait)
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
        <Autocomplete
          label="Приманка (из моих взятых)"
          placeholder={takenBaitsInner && takenBaitsInner.length > 0 ? 'Выберите приманку' : 'Сначала добавьте свои приманки'}
          data={takenOptions.map((o: any) => o.label)}
          value={bait}
          onChange={(val) => {
            setBait(val)
            const found = takenOptions.find((o: any) => o.label === val)
            setBaitId(found?.id)
          }}
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
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onSubmit({
            fish_kind_id: fishKind,
            bait_id: baitId,
            bait_name: baitId ? undefined : (bait.trim() || undefined),
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

function EditCatchModal({ opened, onClose, initial, onSubmit }: { opened: boolean; onClose: () => void; initial: TrainingCatch | null; onSubmit: (id: string, data: AddCatchForm) => Promise<void> }) {
  const { data: fishKinds } = useFishKinds()
  const [fishKind, setFishKind] = useState<string | undefined>(initial?.fish_kind_id || undefined)
  const [weight, setWeight] = useState<number | undefined>(initial?.weight_g || undefined)
  const [length, setLength] = useState<number | undefined>(initial?.length_cm || undefined)
  const [bait, setBait] = useState<string>(initial?.bait_name || '')
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
      setBait(initial.bait_name || '')
      setCaughtAt(new Date(initial.caught_at))
      setReleased(initial.released ?? true)
      setNotes(initial.notes || '')
      setPoint(initial.lat && initial.lng ? new L.LatLng(initial.lat, initial.lng) : null)
    }
  }, [initial])

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
        <TextInput label="Приманка" value={bait} onChange={(e) => { setBait(e.currentTarget.value); setBaitId(undefined) }} />
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
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => initial && onSubmit(initial.id, {
            fish_kind_id: fishKind,
            bait_id: baitId ?? undefined,
            bait_name: baitId ? undefined : (bait.trim() || undefined),
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


