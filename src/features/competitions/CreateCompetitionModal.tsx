import { useState } from 'react'
import { Button, Group, Stack, TextInput, Textarea } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import dayjs from 'dayjs'
import { useCreateCompetition } from './hooks'
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

  async function handleSubmit() {
    if (!title.trim() || !startsAt) {
      notifications.show({ color: 'red', message: 'Заполните название и дату/время' })
      return
    }
    try {
      await mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: startsAt,
        lat,
        lng,
      })
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
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} loading={isPending}>Создать</Button>
      </Group>
    </Stack>
  )
}


