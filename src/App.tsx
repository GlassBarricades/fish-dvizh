import { AppShell, Container, Title, Text } from '@mantine/core'
import './App.css'

function App() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container size="lg" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Title order={3}>FishDvizh</Title>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">
          <Title order={2} mb="sm">
            Добро пожаловать в FishDvizh
          </Title>
          <Text c="dimmed">
            Стартовая конфигурация: React 18 + Vite + TypeScript, Mantine UI, Redux Toolkit, TanStack Query, PWA, Supabase, Router.
          </Text>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
