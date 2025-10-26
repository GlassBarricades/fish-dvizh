import { useState } from 'react'
import { Stack, TextInput, Textarea, Button, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'

interface CreateTeamFormProps {
  onSubmit: (values: { name: string; description: string }) => void
  isSubmitting: boolean
}

export default function CreateTeamForm({ onSubmit, isSubmitting }: CreateTeamFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notifications.show({ color: 'red', message: 'Введите название команды' })
      return
    }
    onSubmit({ name, description })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Название команды"
          placeholder="Введите название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Описание"
          placeholder="Описание команды (опционально)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Создать
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
