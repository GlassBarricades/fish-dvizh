import { Avatar, Badge, Button, Card, Container, Group, Image, Paper, Progress, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { useUpcomingCompetitions } from '@/features/competitions/model/hooks'
import { useAggregatedStandings } from '@/features/results/hooks'
import { useAuth } from '@/features/auth/hooks'
import dayjs from 'dayjs'

export default function HomePage() {
  const { user } = useAuth()
  const upcoming = useUpcomingCompetitions(6)
  // Для рейтинга нужен competitionId. Если глобального нет, покажем подсказку.
  // В дальнейшем можно сделать агрегированный кросс-соревновательный рейтинг.
  const someCompetitionId = undefined as unknown as string | undefined
  const standings = useAggregatedStandings(someCompetitionId as any)

  // Фейковые данные рейтинга (временно)
  const fakeRows: Array<{ userId: string; totalWeight: number; totalCount: number }> = [
    { userId: 'athlete_ivanov', totalWeight: 15890, totalCount: 47 },
    { userId: 'athlete_petrov', totalWeight: 14210, totalCount: 39 },
    { userId: 'athlete_sidorov', totalWeight: 13550, totalCount: 36 },
    { userId: 'athlete_kozlov', totalWeight: 12030, totalCount: 31 },
    { userId: 'athlete_markov', totalWeight: 11010, totalCount: 29 },
    { userId: 'athlete_egorov', totalWeight: 10320, totalCount: 27 },
    { userId: 'athlete_lebedev', totalWeight: 9800, totalCount: 24 },
    { userId: 'athlete_orlov', totalWeight: 9150, totalCount: 22 },
    { userId: 'athlete_fedorov', totalWeight: 8740, totalCount: 20 },
    { userId: 'athlete_kuznetsov', totalWeight: 8320, totalCount: 19 },
  ]

  const baseRows = (standings.data && standings.data.length > 0) ? standings.data as any[] : fakeRows
  const ratingRows = (() => {
    if (user?.id && !baseRows.some((r) => r.userId === user.id)) {
      // Добавим текущего пользователя со средними показателями, затем отсортируем
      const withUser = [...baseRows, { userId: user.id, totalWeight: 9600, totalCount: 21 }]
      withUser.sort((a, b) => b.totalWeight - a.totalWeight || b.totalCount - a.totalCount)
      return withUser
    }
    return baseRows
  })()

  const userPlace = (() => {
    const idx = ratingRows.findIndex((r: any) => r.userId === user?.id)
    return idx >= 0 ? idx + 1 : null
  })()

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <Stack>
            <Title order={2}>Добро пожаловать в FishDvizh</Title>
            <Text c="dimmed">Следите за соревнованиями, рейтингами и прогрессом спортсменов.</Text>
          </Stack>
        </Paper>

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={3}>Предстоящие соревнования</Title>
            <Button variant="subtle" component="a" href="/competitions">Все соревнования</Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {(upcoming.data ?? []).map((c) => (
              <Card key={c.id} withBorder radius="md" p="sm">
                <Card.Section>
                  <Image src="/placeholder-competition.jpg" alt={c.title} h={140} fallbackSrc="/vite.svg" />
                </Card.Section>
                <Stack gap={6} mt="sm">
                  <Group justify="space-between">
                    <Title order={5}>{c.title}</Title>
                    <Badge variant="light" color="blue">{dayjs(c.starts_at).format('DD.MM.YYYY')}</Badge>
                  </Group>
                  {c.description && (
                    <Text size="sm" c="dimmed" lineClamp={2}>{c.description}</Text>
                  )}
                  <Group justify="flex-end">
                    <Button size="xs" variant="light" component="a" href={`/competition/${c.id}`}>Подробнее</Button>
                  </Group>
                </Stack>
              </Card>
            ))}
            {upcoming.isLoading && (
              <Card withBorder radius="md" p="lg"><Text c="dimmed">Загрузка...</Text></Card>
            )}
            {upcoming.data && upcoming.data.length === 0 && (
              <Card withBorder radius="md" p="lg"><Text c="dimmed">Пока нет предстоящих соревнований</Text></Card>
            )}
          </SimpleGrid>
        </Stack>

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={3}>Рейтинг спортсменов</Title>
            {user && (
              <Badge variant="light" color="teal">
                {userPlace ? `Ваше место: ${userPlace}` : 'Вы ещё не в рейтинге'}
              </Badge>
            )}
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Левая колонка: топ-лист */}
            <Stack gap="sm">
              <Text c="dimmed">Топ спортсменов по сумме очков. Сравните свой прогресс с лидерами.</Text>
              <Stack gap={10}>
                {ratingRows.slice(0, 3).map((r: any, i: number) => {
                  const bg = i === 0 ? 'rgba(255, 215, 0, 0.15)' : i === 1 ? 'rgba(192,192,192,0.15)' : 'rgba(205,127,50,0.15)'
                  return (
                    <Paper key={r.userId} withBorder radius="md" p="md" style={{ background: bg }}>
                      <Group justify="space-between">
                        <Group>
                          <ThemeIcon radius="xl" color={i === 0 ? 'yellow' : i === 1 ? 'gray' : 'orange'} variant="light">{i + 1}</ThemeIcon>
                          <Avatar src="/placeholder-user.jpg" alt="athlete" radius="xl" size={36} />
                          <Stack gap={2}>
                            <Text fw={600}>{r.userId}</Text>
                            <Text size="xs" c="dimmed">спортсмен</Text>
                          </Stack>
                        </Group>
                        <Stack gap={2} align="flex-end">
                          <Text fw={700}>{Math.round(r.totalWeight)} pts</Text>
                          <Text size="xs" c="dimmed">{r.totalCount} поимок</Text>
                        </Stack>
                      </Group>
                    </Paper>
                  )
                })}
              </Stack>
              <Group>
                <Button variant="light" component="a" href="/leaderboard">Посмотреть весь рейтинг</Button>
              </Group>
            </Stack>

            {/* Правая колонка: карточка «Ваш рейтинг» */}
            <Paper withBorder radius="lg" p="lg" style={{ background: 'linear-gradient(135deg, rgba(0,128,255,0.05) 0%, rgba(0,200,170,0.05) 100%)' }}>
              <Stack align="center" gap={8}>
                <Title order={4}>Ваш рейтинг</Title>
                <Text size="sm" c="dimmed">Текущий турнирный сезон</Text>
                <Title order={1} style={{ fontSize: 48, lineHeight: 1, marginTop: 8 }}>#{userPlace ?? '—'}</Title>
                <Text c="dimmed">{Math.round((ratingRows.find((x: any) => x.userId === user?.id) || ratingRows[0])?.totalWeight)} points</Text>
                <Group gap={24} mt="xs">
                  <Stack align="center" gap={2}>
                    <Text fw={600}>5</Text>
                    <Text size="xs" c="dimmed">Турниров</Text>
                  </Stack>
                  <Stack align="center" gap={2}>
                    <Text fw={600}>2</Text>
                    <Text size="xs" c="dimmed">Победы</Text>
                  </Stack>
                  <Stack align="center" gap={2}>
                    <Text fw={600}>78%</Text>
                    <Text size="xs" c="dimmed">Успех</Text>
                  </Stack>
                </Group>
                {(() => {
                  const idx = ratingRows.findIndex((x: any) => x.userId === user?.id)
                  const current = (idx >= 0 ? ratingRows[idx] : ratingRows[0]) as any
                  const next = idx > 0 ? (ratingRows[idx - 1] as any) : null
                  const nextRankLabel = next ? `#${idx}` : 'Топ'
                  const need = next ? Math.max(0, Math.round(next.totalWeight - current.totalWeight)) : 0
                  const percent = next ? Math.min(100, Math.round((current.totalWeight / next.totalWeight) * 100)) : 100
                  return (
                    <Stack w="100%" gap={4} mt="sm">
                      <Text size="xs" c="dimmed">Следующее место: {nextRankLabel}</Text>
                      <Progress value={percent} size="sm" radius="xl" />
                      {next && <Text size="xs" c="dimmed" ta="right">нужно ещё {need} pts</Text>}
                    </Stack>
                  )
                })()}
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Stack>
    </Container>
  )
}


