import { Anchor, Badge, Button, Card, Container, Group, Paper, Skeleton, Stack, Text, Title, SegmentedControl } from '@mantine/core'
import { Link } from 'react-router-dom'
import { IconDownload } from '@tabler/icons-react'
import { useState, useMemo } from 'react'
import { useCompetitions } from '@/features/competitions/hooks'
import { useExportCompetitionResults } from '@/features/export/hooks'

export default function CompetitionsPage() {
  const { data, isLoading } = useCompetitions()
  const exportCompetitionResults = useExportCompetitionResults()
  
  // Фильтр по статусу соревнований
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  
  // Фильтрация соревнований
  const filteredCompetitions = useMemo(() => {
    if (!data) return []
    
    const now = new Date().getTime()
    
    switch (filter) {
      case 'upcoming':
        return data.filter(c => new Date(c.starts_at).getTime() > now)
      case 'past':
        return data.filter(c => new Date(c.starts_at).getTime() <= now)
      case 'all':
      default:
        return data
    }
  }, [data, filter])

  const handleExportResults = async (competitionId: string) => {
    await exportCompetitionResults.mutateAsync({
      competitionId,
      config: {
        format: 'csv',
        includeHeaders: true
      },
      includeFishDetails: true,
      includeZoneDetails: false
    })
  }

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>Соревнования</Title>
          <Button component={Link} to="/map" variant="light">Открыть карту</Button>
        </Group>

        {/* Фильтр */}
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="sm" fw={500}>Фильтр соревнований:</Text>
            <SegmentedControl
              value={filter}
              onChange={(value) => setFilter(value as 'upcoming' | 'past' | 'all')}
              data={[
                { label: 'Предстоящие', value: 'upcoming' },
                { label: 'Прошедшие', value: 'past' },
                { label: 'Все', value: 'all' },
              ]}
            />
            <Text size="xs" c="dimmed">
              Найдено: {filteredCompetitions.length}
            </Text>
          </Group>
        </Paper>

        {isLoading && (
          <Stack>
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </Stack>
        )}

        {!isLoading && (!filteredCompetitions || filteredCompetitions.length === 0) && (
          <Text c="dimmed">Пока нет соревнований.</Text>
        )}

        <Stack>
          {filteredCompetitions?.map((c) => (
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
                  <Group gap="xs">
                    <Button size="sm" component={Link} to={`/competition/${c.id}`}>
                      Открыть
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      leftSection={<IconDownload size={14} />}
                      onClick={() => handleExportResults(c.id)}
                      loading={exportCompetitionResults.isPending}
                    >
                      Экспорт
                    </Button>
                  </Group>
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


