import { useState, useEffect } from 'react'
import { Stack, Title, TextInput, Textarea, Button, Group, MultiSelect } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useFishKinds } from '@/features/dicts/fish/hooks'

interface EditSoloTrainingFormProps {
  training: any
  onEdit: (values: any) => void | Promise<void>
  isSubmitting: boolean
}

export default function EditSoloTrainingForm({ training, onEdit, isSubmitting }: EditSoloTrainingFormProps) {
  const [title, setTitle] = useState(training?.title || '')
  const [description, setDescription] = useState(training?.description || '')
  const [startsAt, setStartsAt] = useState<Date>(training?.starts_at ? new Date(training.starts_at) : new Date())
  const [endsAt, setEndsAt] = useState<Date | null>(training?.ends_at ? new Date(training.ends_at) : null)
  const [targetFishKinds, setTargetFishKinds] = useState<string[]>(training?.target_fish_kinds || [])
  
  const { data: fishKinds } = useFishKinds()

  useEffect(() => {
    if (training) {
      setTitle(training.title || '')
      setDescription(training.description || '')
      setStartsAt(training.starts_at ? new Date(training.starts_at) : new Date())
      setEndsAt(training.ends_at ? new Date(training.ends_at) : null)
      setTargetFishKinds(training.target_fish_kinds || [])
    }
  }, [training])

  return (
    <Stack gap="sm">
      <Title order={5}>Редактировать личную тренировку</Title>
      <TextInput 
        label="Название" 
        value={title} 
        onChange={(e) => setTitle(e.currentTarget.value)} 
        required 
      />
      <Textarea 
        label="Описание" 
        value={description} 
        onChange={(e) => setDescription(e.currentTarget.value)} 
        rows={3} 
      />
      
      <MultiSelect
        label="Целевая рыба"
        placeholder="Выберите виды рыбы для тренировки"
        data={fishKinds?.map(fish => ({ value: fish.id, label: fish.name })) || []}
        value={targetFishKinds}
        onChange={setTargetFishKinds}
        searchable
        clearable
        description="Можно выбрать несколько видов рыбы"
      />
      
      <Group grow>
        <DateTimePicker 
          label="Начало" 
          value={startsAt} 
          onChange={(v: Date | string | null) => {
            if (v instanceof Date) {
              setStartsAt(v)
            } else if (typeof v === 'string') {
              setStartsAt(new Date(v))
            }
          }} 
          required 
          popoverProps={{ withinPortal: true, zIndex: 10000 }}
        />
        <DateTimePicker 
          label="Окончание" 
          value={endsAt} 
          onChange={(v: Date | string | null) => {
            if (v instanceof Date) {
              setEndsAt(v)
            } else if (typeof v === 'string') {
              setEndsAt(new Date(v))
            } else {
              setEndsAt(null)
            }
          }} 
          popoverProps={{ withinPortal: true, zIndex: 10000 }}
        />
      </Group>
      
      <Group justify="flex-end">
        <Button 
          disabled={!title.trim() || !startsAt} 
          loading={isSubmitting} 
          onClick={async () => {
            await onEdit({
              title: title.trim(),
              description: description.trim() || undefined,
              starts_at: startsAt.toISOString(),
              ends_at: endsAt ? endsAt.toISOString() : undefined,
              lat: null,
              lng: null,
              area_points: null,
              target_fish_kinds: targetFishKinds.length > 0 ? targetFishKinds : null,
            })
          }}
        >
          Сохранить изменения
        </Button>
      </Group>
    </Stack>
  )
}
