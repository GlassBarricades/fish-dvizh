import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Container,
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  Tabs,
  Table,
  Avatar,
  ThemeIcon,
  Select,
  Grid,
  Card,
  Image,
  Box,
  Center,
  Divider,
  SimpleGrid,
  Alert,
  Modal
} from '@mantine/core'
import { 
  IconTrophy, 
  IconMedal, 
  IconCrown, 
  IconUsers, 
  IconCalendar, 
  IconPlus, 
  IconStar,
  IconTrendingUp,
  IconAward,
  IconClock,
  IconFish,
  IconTarget,
  IconChartBar,
  IconFlame,
  IconShield,
  IconSword,
  IconDownload,
  IconSettings
} from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { useLeague, useLeagueRating, useJoinLeague, useLeaveLeague, useIsUserInLeague, useRatingConfigs, useLeagueCompetitions } from '@/features/leagues/hooks'
import { useExportLeagueRating } from '@/features/export/hooks'
import { useCompetitions } from '@/features/competitions/hooks'
import dayjs from 'dayjs'

export default function LeaguePage() {
  const { leagueId } = useParams()
  const { user, role } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('rating')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [joinModalOpened, setJoinModalOpened] = useState(false)
  const [selectedPlayerClass, setSelectedPlayerClass] = useState<'novice' | 'amateur' | 'professional'>('amateur')

  const { data: league, isLoading: leagueLoading } = useLeague(leagueId)
  const { data: ratingConfigs } = useRatingConfigs()
  const { data: rating, isLoading: ratingLoading } = useLeagueRating({ 
    league_id: leagueId!,
    class: selectedClass as any
  })
  const { isParticipating } = useIsUserInLeague(leagueId, user?.id)
  const { data: leagueCompetitions, isLoading: competitionsLoading } = useLeagueCompetitions(leagueId)
  
  const joinLeague = useJoinLeague()
  const leaveLeague = useLeaveLeague()
  const exportLeagueRating = useExportLeagueRating()
  const { data: competitions } = useCompetitions()

  const handleJoinLeague = async () => {
    if (!leagueId || !user?.id) return
    await joinLeague.mutateAsync({
      league_id: leagueId,
      user_id: user.id,
      class: selectedPlayerClass
    })
    setJoinModalOpened(false)
  }

  const handleLeaveLeague = async () => {
    if (!leagueId || !user?.id) return
    await leaveLeague.mutateAsync({
      leagueId,
      userId: user.id
    })
  }

  const getClassColor = (playerClass: string) => {
    switch (playerClass) {
      case 'novice': return 'blue'
      case 'amateur': return 'green'
      case 'professional': return 'red'
      default: return 'gray'
    }
  }

  const getClassLabel = (playerClass: string) => {
    switch (playerClass) {
      case 'novice': return 'Новичок'
      case 'amateur': return 'Любитель'
      case 'professional': return 'Профессионал'
      default: return 'Неизвестно'
    }
  }

  const getFormColor = (form: string) => {
    switch (form) {
      case 'excellent': return 'green'
      case 'good': return 'blue'
      case 'average': return 'yellow'
      case 'poor': return 'red'
      default: return 'gray'
    }
  }

  const getFormLabel = (form: string) => {
    switch (form) {
      case 'excellent': return 'Отлично'
      case 'good': return 'Хорошо'
      case 'average': return 'Средне'
      case 'poor': return 'Плохо'
      default: return 'Неизвестно'
    }
  }

  if (leagueLoading) {
    return (
      <Container size="lg" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={60} radius="xl" variant="light" color="blue">
              <IconTrophy size={30} />
            </ThemeIcon>
            <Text size="lg" c="dimmed">Загрузка лиги...</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  if (!league) {
    return (
      <Container size="lg" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={60} radius="xl" variant="light" color="red">
              <IconShield size={30} />
            </ThemeIcon>
            <Title order={3}>Лига не найдена</Title>
            <Text c="dimmed">Проверьте правильность ссылки</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  const userStats = rating?.find(stats => stats.user_id === user?.id)
  const userRank = user?.id && rating ? (rating.findIndex(stats => stats.user_id === user.id) + 1) : 0

  return (
    <Box>
      {/* Героический баннер */}
      <Paper withBorder radius="lg" p="xl" mb="xl">
        <Container size="lg" py="xl">
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="lg">
                {/* Заголовок и статус */}
                <Group gap="md" align="flex-start">
                  <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    <IconTrophy size={32} />
                  </ThemeIcon>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Title order={1} size="h1" fw={800}>
                      {league.name}
                    </Title>
                    <Group gap="sm" justify="space-between" align="center">
                      <Group gap="sm">
                        <Badge 
                          size="lg" 
                          variant="gradient" 
                          gradient={{ from: 'blue', to: 'cyan' }}
                          leftSection={<IconCalendar size={14} />}
                        >
                          {league.season}
                        </Badge>
                        <Badge 
                          size="lg" 
                          variant="gradient" 
                          gradient={
                            league.status === 'active' ? { from: 'green', to: 'teal' } :
                            league.status === 'upcoming' ? { from: 'yellow', to: 'orange' } : 
                            { from: 'gray', to: 'dark' }
                          }
                          leftSection={
                            league.status === 'active' ? <IconFlame size={14} /> :
                            league.status === 'upcoming' ? <IconClock size={14} /> :
                            <IconShield size={14} />
                          }
                        >
                          {league.status === 'active' ? 'Активна' : 
                           league.status === 'upcoming' ? 'Предстоящая' : 'Завершена'}
                        </Badge>
                      </Group>
                      
                      {/* Кнопка управления для админов */}
                      {user && (role === 'admin' || role === 'organizer') && (
                        <Button
                          size="sm"
                          variant="light"
                          color="blue"
                          leftSection={<IconSettings size={16} />}
                          component={Link}
                          to={`/admin/league/${leagueId}`}
                        >
                          Управление
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Group>

                {/* Описание */}
                {league.description && (
                  <Paper withBorder radius="md" p="md">
                    <Text size="lg" c="dimmed">
                      {league.description}
                    </Text>
                  </Paper>
                )}

                {/* Даты и статистика */}
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                  <Card withBorder radius="md" p="md">
                    <Group gap="sm">
                      <ThemeIcon size={40} radius="xl" variant="light" color="blue">
                        <IconCalendar size={20} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">Период проведения</Text>
                        <Text fw={600} size="sm">
                          {dayjs(league.start_date).format('DD.MM.YYYY')} - {dayjs(league.end_date).format('DD.MM.YYYY')}
                        </Text>
                      </Stack>
                    </Group>
                  </Card>

                  <Card withBorder radius="md" p="md">
                    <Group gap="sm">
                      <ThemeIcon size={40} radius="xl" variant="light" color="green">
                        <IconUsers size={20} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">Участников</Text>
                        <Text fw={600} size="lg">{rating?.length || 0}</Text>
                      </Stack>
                    </Group>
                  </Card>

                  <Card withBorder radius="md" p="md">
                    <Group gap="sm">
                      <ThemeIcon size={40} radius="xl" variant="light" color="orange">
                        <IconTarget size={20} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">Соревнований</Text>
                        <Text fw={600} size="lg">{competitions?.filter(c => c.league_id === league?.id).length || 0}</Text>
                      </Stack>
                    </Group>
                  </Card>
                </SimpleGrid>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                {/* Изображение лиги */}
                <Card withBorder radius="md" p={0}>
                  <Image 
                    src={league.image_url || "/placeholder-league.jpg"} 
                    alt={league.name}
                    h={300}
                    fallbackSrc="/vite.svg"
                  />
                </Card>

                {/* Кнопки действий */}
                <Stack gap="sm">
                  {user && !isParticipating && league.status === 'active' && (
                    <Button 
                      size="lg"
                      variant="gradient"
                      gradient={{ from: 'blue', to: 'cyan' }}
                      leftSection={<IconPlus size={20} />}
                      onClick={() => setJoinModalOpened(true)}
                      fullWidth
                    >
                      Присоединиться к лиге
                    </Button>
                  )}
                  
                  {user && isParticipating && (
                    <Button 
                      size="lg"
                      variant="light" 
                      color="red"
                      leftSection={<IconSword size={20} />}
                      onClick={handleLeaveLeague}
                      loading={leaveLeague.isPending}
                      fullWidth
                    >
                      Покинуть лигу
                    </Button>
                  )}

                  <Button
                    size="md"
                    variant="light"
                    leftSection={<IconDownload size={16} />}
                    onClick={() => {
                      if (!leagueId) return
                      exportLeagueRating.mutateAsync({
                        leagueId,
                        config: {
                          format: 'csv',
                          includeHeaders: true
                        },
                        includeUserDetails: true,
                        includeStatistics: true
                      })
                    }}
                    loading={exportLeagueRating.isPending}
                    fullWidth
                  >
                    Экспорт рейтинга
                  </Button>
                </Stack>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Paper>

      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Личная статистика пользователя */}
          {user && userStats && (
            <Paper withBorder radius="lg" p="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Group gap="md">
                    <Avatar src="/placeholder-user.jpg" alt="user" radius="xl" size={60} />
                    <Stack gap="xs">
                      <Title order={3} fw={700}>
                        {userStats.user_nickname || userStats.user_email || 'Вы'}
                      </Title>
                      <Group gap="sm">
                        <Badge variant="light" color={getClassColor(userStats.class)} size="lg">
                          {getClassLabel(userStats.class)}
                        </Badge>
                        <Badge variant="light" color={getFormColor(userStats.recent_form)} size="lg">
                          {getFormLabel(userStats.recent_form)}
                        </Badge>
                      </Group>
                    </Stack>
                  </Group>
                  
                  <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                    <IconCrown size={40} />
                  </ThemeIcon>
                </Group>

                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                  <Card withBorder radius="md" p="md">
                    <Stack gap="xs">
                      <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                        <Text fw={800} size="xl">#{userRank}</Text>
                      </ThemeIcon>
                      <Text size="sm" c="dimmed">Место в рейтинге</Text>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" p="md">
                    <Stack gap="xs">
                      <Text fw={800} size="2xl" c="blue">{userStats.current_rating}</Text>
                      <Text size="sm" c="dimmed">Очков</Text>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" p="md">
                    <Stack gap="xs">
                      <Text fw={800} size="2xl" c="green">{userStats.competitions_count}</Text>
                      <Text size="sm" c="dimmed">Соревнований</Text>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" p="md">
                    <Stack gap="xs">
                      <Text fw={800} size="2xl" c="red">{userStats.best_place}</Text>
                      <Text size="sm" c="dimmed">Лучшее место</Text>
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Stack>
            </Paper>
          )}

          {/* Табы */}
          <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'rating')}>
            <Tabs.List>
              <Tabs.Tab 
                value="rating" 
                leftSection={<IconChartBar size={16} />}
              >
                Рейтинг
              </Tabs.Tab>
              <Tabs.Tab 
                value="competitions" 
                leftSection={<IconTrophy size={16} />}
              >
                Соревнования
              </Tabs.Tab>
              <Tabs.Tab 
                value="stats" 
                leftSection={<IconTrendingUp size={16} />}
              >
                Статистика
              </Tabs.Tab>
              <Tabs.Tab 
                value="rules" 
                leftSection={<IconShield size={16} />}
              >
                Правила
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="rating" pt="xl">
              <Stack gap="lg">
                {/* Фильтры */}
                <Paper withBorder radius="lg" p="lg">
                  <Group justify="space-between" align="center">
                    <Group>
                      <Select
                        placeholder="Все классы"
                        data={[
                          { value: '', label: 'Все классы' },
                          { value: 'novice', label: 'Новички' },
                          { value: 'amateur', label: 'Любители' },
                          { value: 'professional', label: 'Профессионалы' }
                        ]}
                        value={selectedClass}
                        onChange={setSelectedClass}
                        clearable
                        leftSection={<IconUsers size={16} />}
                      />
                    </Group>
                    <Group gap="md">
                      <ThemeIcon size={40} radius="xl" variant="light" color="blue">
                        <IconUsers size={20} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">Участников</Text>
                        <Text fw={700} size="lg">{rating?.length || 0}</Text>
                      </Stack>
                    </Group>
                  </Group>
                </Paper>

                {/* Таблица рейтинга */}
                <Paper withBorder radius="md" p="md">
                  {ratingLoading ? (
                    <Center py="xl">
                      <Stack align="center" gap="md">
                        <ThemeIcon size={60} radius="xl" variant="light" color="blue">
                          <IconChartBar size={30} />
                        </ThemeIcon>
                        <Text size="lg" c="dimmed">Загрузка рейтинга...</Text>
                      </Stack>
                    </Center>
                  ) : (
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Место</Table.Th>
                          <Table.Th>Участник</Table.Th>
                          <Table.Th>Класс</Table.Th>
                          <Table.Th>Рейтинг</Table.Th>
                          <Table.Th>Соревнований</Table.Th>
                          <Table.Th>Лучшее место</Table.Th>
                          <Table.Th>Форма</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {rating?.map((player, index) => (
                          <Table.Tr key={player.user_id}>
                            <Table.Td>
                              <Group gap="xs">
                                {index === 0 && <IconCrown size={20} color="gold" />}
                                {index === 1 && <IconMedal size={20} color="silver" />}
                                {index === 2 && <IconTrophy size={20} color="bronze" />}
                                <Text fw={index < 3 ? 700 : 500} size={index < 3 ? "lg" : "md"}>
                                  {index + 1}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="sm">
                                <Avatar src="/placeholder-user.jpg" alt="user" radius="xl" size={40} />
                                <Stack gap={2}>
                                  <Text fw={600} size="md">
                                    {player.user_nickname || player.user_email || player.user_id}
                                  </Text>
                                  {player.user_id === user?.id && (
                                    <Badge size="sm" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                                      Вы
                                    </Badge>
                                  )}
                                </Stack>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color={getClassColor(player.class)} size="lg">
                                {getClassLabel(player.class)}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text fw={700} size="lg" c="blue">{player.current_rating}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text fw={600}>{player.competitions_count}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text fw={600}>{player.best_place}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color={getFormColor(player.recent_form)} size="lg">
                                {getFormLabel(player.recent_form)}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="stats" pt="xl">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {/* Общая статистика */}
                <Card withBorder radius="lg" p="lg">
                  <Stack gap="lg">
                    <Group gap="md">
                      <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        <IconChartBar size={25} />
                      </ThemeIcon>
                      <Title order={3} fw={700}>Общая статистика</Title>
                    </Group>
                    
                    <Stack gap="md">
                      <Paper withBorder radius="md" p="md">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon size={30} radius="xl" variant="light" color="blue">
                              <IconUsers size={16} />
                            </ThemeIcon>
                            <Text fw={600}>Всего участников:</Text>
                          </Group>
                          <Text fw={700} size="lg" c="blue">{rating?.length || 0}</Text>
                        </Group>
                      </Paper>
                      
                      <Paper withBorder radius="md" p="md">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon size={30} radius="xl" variant="light" color="green">
                              <IconStar size={16} />
                            </ThemeIcon>
                            <Text fw={600}>Новичков:</Text>
                          </Group>
                          <Text fw={700} size="lg" c="green">{rating?.filter(p => p.class === 'novice').length || 0}</Text>
                        </Group>
                      </Paper>
                      
                      <Paper withBorder radius="md" p="md">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon size={30} radius="xl" variant="light" color="orange">
                              <IconAward size={16} />
                            </ThemeIcon>
                            <Text fw={600}>Любителей:</Text>
                          </Group>
                          <Text fw={700} size="lg" c="orange">{rating?.filter(p => p.class === 'amateur').length || 0}</Text>
                        </Group>
                      </Paper>
                      
                      <Paper withBorder radius="md" p="md">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon size={30} radius="xl" variant="light" color="red">
                              <IconSword size={16} />
                            </ThemeIcon>
                            <Text fw={600}>Профессионалов:</Text>
                          </Group>
                          <Text fw={700} size="lg" c="red">{rating?.filter(p => p.class === 'professional').length || 0}</Text>
                        </Group>
                      </Paper>
                    </Stack>
                  </Stack>
                </Card>

                {/* Топ-3 лидеры */}
                <Card withBorder radius="lg" p="lg">
                  <Stack gap="lg">
                    <Group gap="md">
                      <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                        <IconCrown size={25} />
                      </ThemeIcon>
                      <Title order={3} fw={700}>Топ-3 лидеры</Title>
                    </Group>
                    
                    <Stack gap="md">
                      {rating?.slice(0, 3).map((player, index) => (
                        <Card key={player.user_id} withBorder radius="md" p="md">
                          <Group justify="space-between" align="center">
                            <Group gap="md">
                              <ThemeIcon 
                                size={50} 
                                radius="xl" 
                                variant="gradient"
                                gradient={index === 0 ? { from: 'yellow', to: 'orange' } : 
                                          index === 1 ? { from: 'gray', to: 'dark' } : 
                                          { from: 'orange', to: 'red' }}
                              >
                                {index === 0 ? <IconCrown size={25} /> :
                                 index === 1 ? <IconMedal size={25} /> :
                                 <IconTrophy size={25} />}
                              </ThemeIcon>
                              <Stack gap={2}>
                                <Text fw={700} size="lg">
                                  {player.user_nickname || player.user_email || player.user_id}
                                </Text>
                                <Badge variant="light" color={getClassColor(player.class)} size="sm">
                                  {getClassLabel(player.class)}
                                </Badge>
                              </Stack>
                            </Group>
                            <Stack align="center" gap={2}>
                              <Text fw={800} size="xl" c="blue">{player.current_rating}</Text>
                              <Text size="sm" c="dimmed">очков</Text>
                            </Stack>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="competitions" pt="xl">
              <Stack gap="lg">
                <Card withBorder radius="lg" p="lg">
                  <Stack gap="md">
                    <Group gap="md">
                      <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                        <IconTrophy size={25} />
                      </ThemeIcon>
                      <Title order={3} fw={700}>Соревнования лиги</Title>
                    </Group>
                    
                    {competitionsLoading ? (
                      <Center py="xl">
                        <Text c="dimmed">Загрузка соревнований...</Text>
                      </Center>
                    ) : leagueCompetitions && leagueCompetitions.length > 0 ? (
                      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                        {leagueCompetitions.map((competition) => (
                          <Card key={competition.id} withBorder radius="md" p="md" style={{ cursor: 'pointer' }}>
                            <Stack gap="sm">
                              <Group gap="sm" justify="space-between">
                                <Text fw={600} size="sm" lineClamp={2}>
                                  {competition.title}
                                </Text>
                                <Badge size="xs" variant="light" color="blue">
                                  {competition.competition_type || 'regular'}
                                </Badge>
                              </Group>
                              
                              <Group gap="xs">
                                <IconCalendar size={14} />
                                <Text size="xs" c="dimmed">
                                  {dayjs(competition.starts_at).format('DD.MM.YYYY HH:mm')}
                                </Text>
                              </Group>
                              
                              {competition.description && (
                                <Text size="xs" c="dimmed" lineClamp={2}>
                                  {competition.description}
                                </Text>
                              )}
                              
                              <Group gap="xs" justify="space-between">
                                <Group gap="xs">
                                  <IconUsers size={14} />
                                  <Text size="xs" c="dimmed">
                                    {competition.max_slots ? `до ${competition.max_slots}` : 'без ограничений'}
                                  </Text>
                                </Group>
                                <Button 
                                  size="xs" 
                                  variant="light" 
                                  component={Link}
                                  to={`/competition/${competition.id}`}
                                >
                                  Подробнее
                                </Button>
                              </Group>
                            </Stack>
                          </Card>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Center py="xl">
                        <Stack gap="md" align="center">
                          <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                            <IconTrophy size={30} />
                          </ThemeIcon>
                          <Text c="dimmed" ta="center">
                            К этой лиге пока не привязаны соревнования
                          </Text>
                        </Stack>
                      </Center>
                    )}
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="rules" pt="xl">
              <Card withBorder radius="lg" p="lg">
                <Stack gap="xl">
                  <Group gap="md">
                    <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                      <IconShield size={25} />
                    </ThemeIcon>
                    <Title order={3} fw={700}>Правила лиги</Title>
                  </Group>

                  {league && (() => {
                    const config = ratingConfigs?.find(c => c.id === league.rating_config_id)
                    return config ? (
                      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                        {/* Система очков */}
                        <Card withBorder radius="md" p="md">
                          <Stack gap="md">
                            <Group gap="sm">
                              <ThemeIcon size={40} radius="xl" variant="light" color="blue">
                                <IconTarget size={20} />
                              </ThemeIcon>
                              <Title order={4} fw={700}>Система очков</Title>
                            </Group>
                            <Text size="sm" c="dimmed">
                              За места в соревнованиях начисляются очки по следующей схеме:
                            </Text>
                            <Group gap="xs" wrap="wrap">
                              {config.points_per_place.slice(0, 10).map((points, index) => (
                                <Badge 
                                  key={index}
                                  variant="light" 
                                  color={index < 3 ? 'yellow' : index < 5 ? 'blue' : 'gray'}
                                  size="lg"
                                >
                                  {index + 1} место: {points} очков
                                </Badge>
                              ))}
                            </Group>
                          </Stack>
                        </Card>

                        {/* Требования */}
                        <Card withBorder radius="md" p="md">
                          <Stack gap="md">
                            <Group gap="sm">
                              <ThemeIcon size={40} radius="xl" variant="light" color="green">
                                <IconAward size={20} />
                              </ThemeIcon>
                              <Title order={4} fw={700}>Требования</Title>
                            </Group>
                            
                            <Stack gap="sm">
                              <Paper withBorder radius="md" p="sm">
                                <Group justify="space-between">
                                  <Text fw={600}>Минимальное количество соревнований:</Text>
                                  <Badge variant="light" color="blue" size="lg">{config.min_competitions}</Badge>
                                </Group>
                              </Paper>
                              
                              <Paper withBorder radius="md" p="sm">
                                <Group justify="space-between">
                                  <Text fw={600}>Период затухания результатов:</Text>
                                  <Badge variant="light" color="teal" size="lg">{config.decay_period_months} месяцев</Badge>
                                </Group>
                              </Paper>
                            </Stack>
                          </Stack>
                        </Card>
                      </SimpleGrid>
                    ) : (
                      <Alert color="blue" variant="light" radius="lg">
                        <Group gap="sm">
                          <IconShield size={20} />
                          <Text fw={600}>Информация о правилах загружается...</Text>
                        </Group>
                      </Alert>
                    )
                  })()}

                  <Divider />

                  <Card withBorder radius="md" p="md">
                    <Stack gap="md">
                      <Group gap="sm">
                        <ThemeIcon size={40} radius="xl" variant="light" color="orange">
                          <IconFish size={20} />
                        </ThemeIcon>
                        <Title order={4} fw={700}>Дополнительная информация</Title>
                      </Group>
                      <Text size="sm" c="dimmed">
                        Подробные правила соревнований указаны в описании каждого турнира. 
                        Участие в лиге означает согласие с общими правилами и условиями проведения соревнований.
                      </Text>
                    </Stack>
                  </Card>
                </Stack>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* Модальное окно присоединения к лиге */}
      <Modal
        opened={joinModalOpened}
        onClose={() => setJoinModalOpened(false)}
        title="Присоединиться к лиге"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Выберите свой класс для участия в лиге:
          </Text>
          <Select
            label="Класс участника"
            data={[
              { value: 'novice', label: 'Новичок' },
              { value: 'amateur', label: 'Любитель' },
              { value: 'professional', label: 'Профессионал' }
            ]}
            value={selectedPlayerClass}
            onChange={(value) => setSelectedPlayerClass(value as any)}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setJoinModalOpened(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleJoinLeague}
              loading={joinLeague.isPending}
            >
              Присоединиться
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
