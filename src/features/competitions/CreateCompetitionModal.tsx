import { useState } from 'react'
import { Button, Group, MultiSelect, Stack, TextInput, Textarea } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import dayjs from 'dayjs'
import { useCreateCompetition, useSetCompetitionFishKinds } from './hooks'
import { useFishKinds } from '../dicts/fish/hooks'
import { notifications } from '@mantine/notifications'

type Props = {
  lat: number
  lng: number
  onClose: () => void
}

export function CreateCompetitionModal({ lat, lng, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState<string | null>(dayjs().toISOString())
  const { mutateAsync, isPending } = useCreateCompetition()
  const { mutateAsync: setFishKinds } = useSetCompetitionFishKinds()
  const { data: fishKinds } = useFishKinds()
  const [fishKindIds, setFishKindIds] = useState<string[]>([])

  async function handleSubmit() {
    if (!title.trim() || !startsAt || fishKindIds.length === 0) {
      notifications.show({ color: 'red', message: 'Заполните название, дату/время и выберите виды рыбы' })
      return
    }
    try {
      const created = await mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: startsAt,
        lat,
        lng,
      })
      await setFishKinds({ competitionId: created.id, fishKindIds })
      notifications.show({ color: 'green', message: 'Соревнование создано' })
      onClose()
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка создания' })
    }
  }

  return (
    <Stack>
      <TextInput label="Название" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
      <DateTimePicker
        label="Дата и время"
        value={startsAt}
        onChange={setStartsAt}
        required
        popoverProps={{ zIndex: 10001, withinPortal: true }}
      />
      <Textarea label="Описание" value={description} onChange={(e) => setDescription(e.currentTarget.value)} minRows={3} />
      <MultiSelect
        label="Целевая рыба"
        placeholder="Выберите виды"
        data={(fishKinds ?? []).map((f) => ({ value: f.id, label: f.name }))}
        value={fishKindIds}
        onChange={setFishKindIds}
        searchable
        nothingFoundMessage="Нет данных"
        required
      />
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} loading={isPending}>Создать</Button>
      </Group>
    </Stack>
  )
}


