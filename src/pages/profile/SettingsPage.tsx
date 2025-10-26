import { useState, useEffect } from 'react'
import { Paper, Stack, Title, Text, Button, Group, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useAuth } from '@/features/auth/hooks'
import { supabase } from '@/lib/supabaseClient'
import { AvatarUploader } from '@/components/ImageUploader'

export default function SettingsPage() {
  const { user } = useAuth()
  
  const [editFirstName, setEditFirstName] = useState(user?.user_metadata?.first_name || '')
  const [editLastName, setEditLastName] = useState(user?.user_metadata?.last_name || '')
  const [editBirthDate, setEditBirthDate] = useState<string | null>(user?.user_metadata?.birth_date || null)
  const [editPhone, setEditPhone] = useState(user?.user_metadata?.phone || '')
  const [editAvatar, setEditAvatar] = useState<string | null>(user?.user_metadata?.avatar || null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Обновляем состояния при изменении user
  useEffect(() => {
    if (user) {
      setEditFirstName(user.user_metadata?.first_name || '')
      setEditLastName(user.user_metadata?.last_name || '')
      setEditBirthDate(user.user_metadata?.birth_date || null)
      setEditPhone(user.user_metadata?.phone || '')
      setEditAvatar(user.user_metadata?.avatar || null)
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    try {
      setIsSavingProfile(true)
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: editFirstName.trim() || undefined,
          last_name: editLastName.trim() || undefined,
          birth_date: editBirthDate || undefined,
          phone: editPhone.trim() || undefined,
          avatar: editAvatar || undefined,
        }
      })
      if (error) throw error
      notifications.show({ color: 'green', message: 'Профиль обновлен' })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка обновления профиля' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <Paper p="xl" withBorder>
      <Stack gap="md">
        <Title order={2}>Базовые настройки</Title>
        <Text c="dimmed">
          Измените свои персональные данные. Email изменить нельзя.
        </Text>
        
        {/* Загрузка аватара */}
        {user?.id && (
          <AvatarUploader
            userId={user.id}
            currentAvatar={editAvatar || undefined}
            onAvatarChange={(url) => setEditAvatar(url)}
            size={100}
          />
        )}
        
        <Stack gap="sm">
          <TextInput
            label="Email"
            value={user?.email || ''}
            disabled
            description="Email нельзя изменить"
          />
          <TextInput
            label="Имя"
            value={editFirstName}
            onChange={(e) => setEditFirstName(e.currentTarget.value)}
            placeholder="Введите имя"
          />
          <TextInput
            label="Фамилия"
            value={editLastName}
            onChange={(e) => setEditLastName(e.currentTarget.value)}
            placeholder="Введите фамилию"
          />
          <DateInput
            label="Дата рождения"
            value={editBirthDate}
            onChange={setEditBirthDate}
            placeholder="Выберите дату"
            maxDate={new Date()}
          />
          <TextInput
            label="Телефон"
            value={editPhone}
            onChange={(e) => setEditPhone(e.currentTarget.value)}
            placeholder="+7XXXXXXXXXX"
          />
        </Stack>
        <Group justify="flex-end">
          <Button
            onClick={handleSaveProfile}
            loading={isSavingProfile}
          >
            Сохранить изменения
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}
