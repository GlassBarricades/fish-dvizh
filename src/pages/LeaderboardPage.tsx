import { Avatar, Badge, Button, Container, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useAuth } from '@/features/auth/hooks'

export default function LeaderboardPage() {
  const { user } = useAuth()

  // Временные фейковые данные рейтинга
  const rows: Array<{ userId: string; totalWeight: number; totalCount: number }> = [
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
  const list = (() => {
    if (user?.id && !rows.some((r) => r.userId === user.id)) {
      const withUser = [...rows, { userId: user.id, totalWeight: 9600, totalCount: 21 }]
      withUser.sort((a, b) => b.totalWeight - a.totalWeight || b.totalCount - a.totalCount)
      return withUser
    }
    return rows
  })()
  const place = (() => {
    const idx = list.findIndex((r) => r.userId === user?.id)
    return idx >= 0 ? idx + 1 : null
  })()

  const current = (place ? list[place - 1] : list[0])
  const next = place && place > 1 ? list[place - 2] : null
  const nextLabel = place && place > 1 ? `#${place - 1}` : 'Топ'
  const need = next ? Math.max(0, Math.round(next.totalWeight - current.totalWeight)) : 0
  const percent = next ? Math.min(100, Math.round((current.totalWeight / next.totalWeight) * 100)) : 100

  function displayName(uid: string): string {
    if (user?.id && uid === user.id) return (user as any)?.user_metadata?.nickname || user.email || 'Вы'
    if (uid.startsWith('athlete_')) {
      const name = uid.replace('athlete_', '').replace(/_/g, ' ')
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    return `Атлет ${uid.slice(0, 6)}`
  }

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Глобальный рейтинг</Title>
          {place && <Badge variant="light" color="teal">Ваше место: {place}</Badge>}
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {/* Полный список слева */}
          <Paper withBorder radius="md" p="md">
            <Stack gap={0}>
              {list.map((r, i) => {
                const isMe = user?.id && r.userId === user.id
                return (
                  <Group
                    key={r.userId}
                    justify="space-between"
                    py={8}
                    style={{
                      borderBottom: i === list.length - 1 ? 'none' : '1px solid var(--mantine-color-default-border)',
                      background: isMe ? 'rgba(0, 200, 170, 0.12)' : undefined,
                      borderLeft: isMe ? '3px solid var(--mantine-color-teal-6)' : undefined,
                      borderRight: isMe ? '3px solid transparent' : undefined,
                      borderRadius: isMe ? 6 : 0,
                    }}
                  >
                    <Group>
                      <Badge variant="light" color={isMe ? 'teal' : 'gray'} w={36} ta="center">{i + 1}</Badge>
                      <Avatar src="/placeholder-user.jpg" radius="xl" />
                      <Group gap={8}>
                        <Text fw={isMe ? 700 : 400}>{displayName(r.userId)}</Text>
                        {isMe && <Badge size="xs" variant="light" color="teal">Вы</Badge>}
                      </Group>
                    </Group>
                    <Group gap={12}>
                      <Badge variant="light">{Math.round(r.totalWeight)} pts</Badge>
                      <Badge variant="light" color="gray">{r.totalCount} поимок</Badge>
                    </Group>
                  </Group>
                )
              })}
            </Stack>
          </Paper>

          {/* Правая колонка: карточка + лучшие поимки/выступления */}
          <Stack gap="lg">
            <Paper withBorder radius="lg" p="lg" style={{ background: 'linear-gradient(135deg, rgba(0,128,255,0.05) 0%, rgba(0,200,170,0.05) 100%)' }}>
              <Stack align="center" gap={8}>
                <Title order={4}>Ваш рейтинг</Title>
                <Title order={1} style={{ fontSize: 48, lineHeight: 1, marginTop: 8 }}>#{place ?? '—'}</Title>
                <Text c="dimmed">{Math.round(current.totalWeight)} points</Text>
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
                <Stack w="100%" gap={4} mt="sm">
                  <Text size="xs" c="dimmed">Следующее место: {nextLabel}</Text>
                  <Progress value={percent} size="sm" radius="xl" />
                  {next && <Text size="xs" c="dimmed" ta="right">нужно ещё {need} pts</Text>}
                </Stack>
                <Group mt="md">
                  <Button variant="light" component="a" href="/">На главную</Button>
                </Group>
              </Stack>
            </Paper>

            {(() => {
              // Только фейковые лучшие поимки текущего пользователя
              const me = user?.id || 'me'
              const bestCatches: Array<{ fish: string; weight: number; competition: string; date: string }> = [
                { fish: 'Карп', weight: 9320, competition: 'Кубок Весны', date: '2025-03-21' },
                { fish: 'Щука', weight: 7840, competition: 'Чемпионат Города', date: '2025-04-18' },
                { fish: 'Судак', weight: 6510, competition: 'Лига Север', date: '2025-06-02' },
                { fish: 'Окунь', weight: 1920, competition: 'Открытый турнир', date: '2025-02-10' },
              ]
              return (
                <Paper withBorder radius="md" p="md">
                  <Stack gap={8}>
                    <Title order={5}>Ваши лучшие поимки</Title>
                    {bestCatches.map((c, i) => (
                      <Group key={`${c.fish}-${i}`} justify="space-between" py={6} style={{ borderBottom: i === bestCatches.length - 1 ? 'none' : '1px solid var(--mantine-color-default-border)' }}>
                        <Group>
                          <Avatar src="/placeholder-fish.jpg" radius="xl" />
                          <Stack gap={0}>
                            <Text fw={600}>{c.fish}</Text>
                            <Text size="xs" c="dimmed">{displayName(me)} • {c.competition}</Text>
                          </Stack>
                        </Group>
                        <Group gap={12}>
                          <Badge variant="light" color="blue">{Math.round(c.weight)} г</Badge>
                          <Badge variant="light" color="gray">{new Date(c.date).toLocaleDateString('ru-RU')}</Badge>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              )
            })()}
          </Stack>
        </SimpleGrid>
      </Stack>
    </Container>
  )
}


