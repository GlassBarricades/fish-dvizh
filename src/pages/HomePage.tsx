import { Container, Title, Text, Paper, Stack } from '@mantine/core'

export default function HomePage() {
  return (
    <Container size="lg" py="md">
      <Paper withBorder radius="md" p="lg">
        <Stack>
          <Title order={2}>Добро пожаловать в FishDvizh</Title>
          <Text c="dimmed">Главная страница приложения рыболовного спорта.</Text>
        </Stack>
      </Paper>
    </Container>
  )
}


