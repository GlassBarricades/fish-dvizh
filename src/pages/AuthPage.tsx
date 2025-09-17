import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button, Container, Group, Paper, PasswordInput, Stack, Text, TextInput, Title, Tabs } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate, useLocation } from 'react-router-dom'

export default function AuthPage() {
  // sign in
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // sign up
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<'organizer' | 'user'>('user')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as any

  async function handleSignIn() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      notifications.show({ color: 'green', message: 'Успешный вход' })
      navigate(location.state?.from?.pathname ?? '/')
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message ?? 'Ошибка входа' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    try {
      setLoading(true)
      if (!nickname.trim()) throw new Error('Укажите никнейм')
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            nickname: nickname.trim(),
            phone: phone.trim() || undefined,
            role,
          },
        },
      })
      if (error) throw error
      navigate('/check-email', { state: { email: regEmail } })
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message ?? 'Ошибка регистрации' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    notifications.show({ color: 'green', message: 'Вы вышли из аккаунта' })
  }

  return (
    <Container size="xs" py="xl" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper p="lg" withBorder radius="md" w="100%">
        <Stack>
          <Title order={3}>Аутентификация</Title>
          <Tabs defaultValue="sign-in">
            <Tabs.List>
              <Tabs.Tab value="sign-in">Вход</Tabs.Tab>
              <Tabs.Tab value="sign-up">Регистрация</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="sign-in" pt="md">
              <Stack>
                <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
                <PasswordInput label="Пароль" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
                <Group>
                  <Button onClick={handleSignIn} loading={loading}>
                    Войти
                  </Button>
                  <Button variant="subtle" color="red" onClick={handleSignOut}>
                    Выйти
                  </Button>
                </Group>
              </Stack>
            </Tabs.Panel>
            <Tabs.Panel value="sign-up" pt="md">
              <Stack>
                <TextInput label="Никнейм" value={nickname} onChange={(e) => setNickname(e.currentTarget.value)} required />
                <TextInput label="Телефон (опционально)" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
                <TextInput label="Email" value={regEmail} onChange={(e) => setRegEmail(e.currentTarget.value)} />
                <PasswordInput label="Пароль" value={regPassword} onChange={(e) => setRegPassword(e.currentTarget.value)} />
                <Text size="sm" c="dimmed">Роль (по умолчанию «user», «organizer» для организаторов)</Text>
                <Group>
                  <Button size="xs" variant={role === 'user' ? 'filled' : 'light'} onClick={() => setRole('user')}>user</Button>
                  <Button size="xs" variant={role === 'organizer' ? 'filled' : 'light'} onClick={() => setRole('organizer')}>organizer</Button>
                </Group>
                <Group>
                  <Button variant="light" onClick={handleSignUp} loading={loading}>
                    Регистрация
                  </Button>
                </Group>
                <Text c="dimmed" size="sm">
                  После регистрации подтвердите e-mail, затем войдите.
                </Text>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Paper>
    </Container>
  )
}


