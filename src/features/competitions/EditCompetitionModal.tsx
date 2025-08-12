import { useState } from 'react'
import { Button, Group, Stack, TextInput, Textarea } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useDeleteCompetition, useUpdateCompetition } from './hooks'

type Props = {
  id: string
  title: string
  description?: string | null
  starts_at: string
  lat: number
  lng: number
  onClose: () => void
}

export function EditCompetitionModal(props: Props) {
  const [title, setTitle] = useState(props.title)
  const [description, setDescription] = useState(props.description ?? '')
  const [startsAt, setStartsAt] = useState<string | null>(props.starts_at)
  const { mutateAsync: update, isPending } = useUpdateCompetition()
  const { mutateAsync: del, isPending: deleting } = useDeleteCompetition()

  async function handleSave() {
    if (!title.trim() || !startsAt) return
    await update({ id: props.id, input: { title: title.trim(), description: description || undefined, starts_at: startsAt } })
    props.onClose()
  }

  async function handleDelete() {
    await del(props.id)
    props.onClose()
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
      <Group justify="space-between">
        <Button color="red" variant="light" onClick={handleDelete} loading={deleting}>
          Удалить
        </Button>
        <Group>
          <Button variant="subtle" onClick={props.onClose}>Отмена</Button>
          <Button onClick={handleSave} loading={isPending}>Сохранить</Button>
        </Group>
      </Group>
    </Stack>
  )
}


