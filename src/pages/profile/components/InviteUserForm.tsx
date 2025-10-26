import { useState } from 'react'
import { Stack, TextInput, Button, Group, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'

interface InviteUserFormProps {
  onSubmit: (values: { email: string }) => void
  isSubmitting: boolean
  teamName: string
}

export default function InviteUserForm({ onSubmit, isSubmitting, teamName }: InviteUserFormProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      notifications.show({ color: 'red', message: 'Введите email пользователя' })
      return
    }
    onSubmit({ email })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Пригласить пользователя в команду "{teamName}"
        </Text>
        <TextInput
          label="Email пользователя"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Отправить приглашение
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
