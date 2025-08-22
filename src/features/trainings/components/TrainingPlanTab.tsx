import { useState, useEffect } from 'react'
import { Stack, Card, Title, TextInput, Textarea, Button, Group, Divider } from '@mantine/core'
import { MapContainer, TileLayer, Polygon as RLPolygon, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useTrainingPlan, useTrainingSegments, useTrainingTasks, useUpsertTrainingPlan, useCreateTrainingSegment, useDeleteTrainingSegment, useCreateTrainingTask, useUpdateTrainingTask, useDeleteTrainingTask } from '../hooks'
import { useFishKinds } from '../../dicts/fish/hooks'
import { notifications } from '@mantine/notifications'
import { MapVisibilityFix } from './MapVisibilityFix'
import { DateTimePicker } from '@mantine/dates'
import { Select } from '@mantine/core'

interface TrainingPlanTabProps {
  trainingId: string
}

export function TrainingPlanTab({ trainingId }: TrainingPlanTabProps) {
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

  useEffect(() => { 
    setGoal(plan?.goal || ''); 
    setNotes(plan?.notes || '') 
  }, [plan?.goal, plan?.notes])

  // Segment creation state
  const [segName, setSegName] = useState('')
  const [segPolygon, setSegPolygon] = useState<L.LatLng[]>([])

  function SegmentDraw() {
    useMapEvents({
      contextmenu(e: any) { setSegPolygon((prev) => [...prev, e.latlng]) },
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

  const handleSavePlan = async () => {
    await savePlan({ 
      training_id: trainingId, 
      goal: goal.trim() || null, 
      notes: notes.trim() || null 
    })
    notifications.show({ color: 'green', message: 'План сохранён' })
  }

  const handleCreateSegment = async () => {
    if (!segName.trim() || segPolygon.length < 3) return
    await createSegment({ 
      training_id: trainingId, 
      name: segName.trim(), 
      area_points: segPolygon.map(p => [p.lng, p.lat]) as [number, number][] 
    })
    setSegName('')
    setSegPolygon([])
    notifications.show({ color: 'green', message: 'Сегмент добавлен' })
  }

  const handleDeleteSegment = async (id: string) => {
    await deleteSegment({ id, trainingId })
    notifications.show({ color: 'gray', message: 'Сегмент удалён' })
  }

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskStart) return
    await createTask({ 
      training_id: trainingId, 
      title: taskTitle.trim(), 
      starts_at: taskStart.toISOString(), 
      ends_at: taskEnd ? taskEnd.toISOString() : null, 
      segment_id: taskSegmentId || null, 
      target_fish_kind_id: taskFishKind || null, 
      notes: taskNotes.trim() || null 
    })
    setTaskTitle('')
    setTaskStart(new Date())
    setTaskEnd(null)
    setTaskSegmentId(undefined)
    setTaskFishKind(undefined)
    setTaskNotes('')
    notifications.show({ color: 'green', message: 'Задача добавлена' })
  }

  const handleUpdateTask = async (id: string) => {
    await updateTask({ 
      id, 
      input: { notes: (tasks?.find(t => t.id === id)?.notes || '') + ' ✓' }, 
      trainingId 
    })
    notifications.show({ color: 'green', message: 'Отмечено' })
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask({ id, trainingId })
    notifications.show({ color: 'gray', message: 'Задача удалена' })
  }

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Title order={5} mb="xs">Цель и заметки</Title>
        <Stack>
          <TextInput 
            label="Цель тренировки" 
            value={goal} 
            onChange={(e) => setGoal(e.currentTarget.value)} 
            placeholder="Например: проверить косы на джиг, цель – судак" 
          />
          <Textarea 
            label="Заметки" 
            value={notes} 
            onChange={(e) => setNotes(e.currentTarget.value)} 
            minRows={2} 
          />
          <Group justify="flex-end">
            <Button onClick={handleSavePlan}>Сохранить план</Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">Сегменты (зоны)</Title>
        <Group align="flex-start" grow>
          <Stack style={{ flex: 1 }}>
            <TextInput 
              label="Название сегмента" 
              value={segName} 
              onChange={(e) => setSegName(e.currentTarget.value)} 
            />
            <div style={{ fontSize: '14px', color: 'gray' }}>
              Правый клик — добавить вершину полигона, двойной клик — очистить.
            </div>
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
              <Button onClick={handleCreateSegment}>Добавить сегмент</Button>
            </Group>
          </Stack>
          <Stack style={{ flex: 1 }}>
            <Stack gap={6}>
              {(segments ?? []).length === 0 && <div style={{ color: 'gray' }}>Сегментов нет</div>}
              {(segments ?? []).map((s) => (
                <Group key={s.id} justify="space-between">
                  <div>{s.name}</div>
                  <Button 
                    size="xs" 
                    color="red" 
                    variant="light" 
                    onClick={() => handleDeleteSegment(s.id)}
                  >
                    Удалить
                  </Button>
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
            <TextInput 
              label="Название" 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.currentTarget.value)} 
            />
            <Select 
              label="Сегмент" 
              placeholder="—" 
              data={(segments ?? []).map(s => ({ value: s.id, label: s.name }))} 
              value={taskSegmentId} 
              onChange={(v) => setTaskSegmentId(v || undefined)} 
              clearable 
            />
          </Group>
          <Group grow>
            <DateTimePicker 
              label="Начало" 
              value={taskStart as any} 
              onChange={(v) => setTaskStart(v as unknown as Date | null)} 
              required 
            />
            <DateTimePicker 
              label="Окончание" 
              value={taskEnd as any} 
              onChange={(v) => setTaskEnd(v as unknown as Date | null)} 
            />
          </Group>
          <Group grow>
            <Select 
              label="Целевая рыба" 
              placeholder="—" 
              data={(fishKinds ?? []).map(f => ({ value: f.id, label: f.name }))} 
              value={taskFishKind} 
              onChange={(v) => setTaskFishKind(v || undefined)} 
              clearable 
              searchable 
            />
            <TextInput 
              label="Заметки" 
              value={taskNotes} 
              onChange={(e) => setTaskNotes(e.currentTarget.value)} 
            />
          </Group>
          <Group justify="flex-end">
            <Button onClick={handleCreateTask}>Добавить задачу</Button>
          </Group>
        </Stack>
        <Divider my="sm" />
        <Stack gap={6}>
          {(tasks ?? []).length === 0 && <div style={{ color: 'gray' }}>Задач нет</div>}
          {(tasks ?? []).map((t) => (
            <Card key={t.id} withBorder>
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <div style={{ fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: '14px', color: 'gray' }}>
                    {new Date(t.starts_at).toLocaleString('ru-RU')} 
                    {t.ends_at ? ` — ${new Date(t.ends_at).toLocaleString('ru-RU')}` : ''}
                  </div>
                  <div style={{ fontSize: '14px', color: 'gray' }}>
                    Сегмент: {(segments ?? []).find(s => s.id === t.segment_id)?.name || '—'}
                    {t.target_fish_kind_id ? ` • Цель: ${(fishKinds ?? []).find(f => f.id === t.target_fish_kind_id)?.name}` : ''}
                  </div>
                  {t.notes && <div style={{ fontSize: '14px', color: 'gray' }}>{t.notes}</div>}
                </Stack>
                <Group gap="xs">
                  <Button 
                    size="xs" 
                    variant="light" 
                    onClick={() => handleUpdateTask(t.id)}
                  >
                    Отметить
                  </Button>
                  <Button 
                    size="xs" 
                    color="red" 
                    variant="light" 
                    onClick={() => handleDeleteTask(t.id)}
                  >
                    Удалить
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}
