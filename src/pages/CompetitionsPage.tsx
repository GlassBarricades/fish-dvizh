import { Anchor, Badge, Button, Card, Container, Group, Skeleton, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useCompetitions } from '../features/competitions/hooks'

export default function CompetitionsPage() {
  const { data, isLoading } = useCompetitions()

  return (
    <Container size="lg" py="md">
      <Stack>
        <Group justify="space-between" align="center">
          <Title order={2}>Соревнования</Title>
          <Button component={Link} to="/map" variant="light">Открыть карту</Button>
        </Group>

        {isLoading && (
          <Stack>
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </Stack>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <Text c="dimmed">Пока нет соревнований.</Text>
        )}

        <Stack>
          {data?.map((c) => (
            <Card key={c.id} withBorder radius="md" p="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Group gap="xs">
                    <Title order={4} style={{ lineHeight: 1.2 }}>{c.title}</Title>
                    <Badge variant="light" color="gray">
                      {new Date(c.starts_at).toLocaleString('ru-RU')}
                    </Badge>
                  </Group>
                  {c.description && <Text size="sm" c="dimmed">{c.description}</Text>}
                  <Text size="sm" c="dimmed">Координаты: {c.lat.toFixed(5)}, {c.lng.toFixed(5)}</Text>
                </Stack>
                <Stack gap={8} align="flex-end">
                  <Button size="sm" component={Link} to={`/competition/${c.id}`}>
                    Открыть
                  </Button>
                  <Anchor size="sm" component={Link} to="/map">Открыть на карте</Anchor>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  )
}


