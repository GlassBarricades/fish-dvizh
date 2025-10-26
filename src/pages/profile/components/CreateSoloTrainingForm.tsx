import { useState } from 'react'
import { Stack, Title, TextInput, Textarea, Button, Group, Select, MultiSelect } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useFishKinds } from '@/features/dicts/fish/hooks'

interface CreateSoloTrainingFormProps {
  onCreate: (values: any) => void | Promise<void>
  isSubmitting: boolean
}

export default function CreateSoloTrainingForm({ onCreate, isSubmitting }: CreateSoloTrainingFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState<Date | null>(new Date())
  const [endsAt, setEndsAt] = useState<Date | null>(null)
  const [targetFishKinds, setTargetFishKinds] = useState<string[]>([])
  
  const { data: fishKinds } = useFishKinds()

  return (
    <Stack gap="sm">
      <Title order={5}>Новая личная тренировка</Title>
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
          onChange={(value) => {
            if (value) {
              setStartsAt(new Date(value))
            } else {
              setStartsAt(null)
            }
          }} 
          required 
          popoverProps={{ withinPortal: true, zIndex: 10000 }}
        />
        <DateTimePicker 
          label="Окончание" 
          value={endsAt} 
          onChange={(value) => {
            if (value) {
              setEndsAt(new Date(value))
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
            const startDate = startsAt instanceof Date ? startsAt : new Date(startsAt || Date.now())
            const endDate = endsAt instanceof Date ? endsAt : (endsAt ? new Date(endsAt) : null)
            
            await onCreate({
              title: title.trim(),
              description: description.trim() || undefined,
              starts_at: startDate.toISOString(),
              ends_at: endDate ? endDate.toISOString() : undefined,
              lat: null,
              lng: null,
              area_points: null,
              target_fish_kinds: targetFishKinds.length > 0 ? targetFishKinds : null,
            })
            setTitle('')
            setDescription('')
            setEndsAt(null)
            setTargetFishKinds([])
          }}
        >
          Создать
        </Button>
      </Group>
    </Stack>
  )
}
