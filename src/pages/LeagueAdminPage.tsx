import { useState } from 'react'
import { useParams } from 'react-router-dom'
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
  Progress,
  Select,
  Grid,
  Card,
  ActionIcon,
  Tooltip,
  Modal,
  TextInput,
  Textarea,
  NumberInput
} from '@mantine/core'
import { IconTrophy, IconMedal, IconCrown, IconUsers, IconCalendar, IconSettings, IconPlus, IconEdit, IconDownload, IconTrash, IconMail, IconBell } from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { useLeague, useLeagueRating, useJoinLeague, useLeaveLeague, useIsUserInLeague, useLinkCompetitionsToLeague, useUpdateLeague, useDeleteLeague, useRatingConfigs } from '@/features/leagues/hooks'
import { useExportLeagueRating } from '@/features/export/hooks'
import { useCompetitions, useUpdateCompetition } from '@/features/competitions/hooks'
import { LeagueImageUploader } from '@/components/ImageUploader'
import { InvitationManagement } from '@/features/leagues/components/InvitationManagement'
import { NotificationManagement } from '@/features/notifications/components/NotificationManagement'
import dayjs from 'dayjs'

export default function LeaguePage() {
  const { leagueId } = useParams()
  const { user, role } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('rating')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [joinModalOpened, setJoinModalOpened] = useState(false)
  const [selectedPlayerClass, setSelectedPlayerClass] = useState<'novice' | 'amateur' | 'professional'>('amateur')
  const [linkModalOpened, setLinkModalOpened] = useState(false)
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([])
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false)
  const [invitationModalOpened, setInvitationModalOpened] = useState(false)
  const [notificationModalOpened, setNotificationModalOpened] = useState(false)
  const [editingLeague, setEditingLeague] = useState({
    name: '',
    description: '',
    season: '',
    start_date: '',
    end_date: '',
    rating_config_id: '',
    image_url: ''
  })

  const { data: league, isLoading: leagueLoading } = useLeague(leagueId)
  const { data: ratingConfig } = useRatingConfigs()
  const { data: rating, isLoading: ratingLoading } = useLeagueRating({ 
    league_id: leagueId!,
    class: selectedClass as any
  })
  const { isParticipating, participation } = useIsUserInLeague(leagueId, user?.id)
  
  const joinLeague = useJoinLeague()
  const leaveLeague = useLeaveLeague()
  const exportLeagueRating = useExportLeagueRating()
  const linkCompetitions = useLinkCompetitionsToLeague()
  const updateLeague = useUpdateLeague()
  const deleteLeague = useDeleteLeague()
  const { data: competitions } = useCompetitions()
  const { data: ratingConfigs } = useRatingConfigs()

  const handleExportRating = async () => {
    if (!leagueId) return
    await exportLeagueRating.mutateAsync({
      leagueId,
      config: {
        format: 'csv',
        includeHeaders: true
      },
      includeUserDetails: true,
      includeStatistics: true
    })
  }

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

  const handleEditLeague = () => {
    console.log('handleEditLeague called', { league, user, role })
    if (!league) return
    setEditingLeague({
      name: league.name,
      description: league.description || '',
      season: league.season,
      start_date: league.start_date,
      end_date: league.end_date,
      rating_config_id: league.rating_config_id,
      image_url: league.image_url || ''
    })
    setEditModalOpened(true)
  }

  const handleUpdateLeague = async () => {
    if (!leagueId) return
    await updateLeague.mutateAsync({
      leagueId,
      input: editingLeague
    })
    setEditModalOpened(false)
  }

  const handleDeleteLeague = async () => {
    if (!leagueId) return
    await deleteLeague.mutateAsync(leagueId)
    setDeleteConfirmOpened(false)
    // Перенаправляем на страницу лиг после удаления
    window.location.href = '/leagues'
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
      <Container size="lg" py="md">
        <Text>Загрузка лиги...</Text>
      </Container>
    )
  }

  if (!league) {
    return (
      <Container size="lg" py="md">
        <Text>Лига не найдена</Text>
      </Container>
    )
  }

  const userStats = rating?.find(stats => stats.user_id === user?.id)
  const userRank = rating?.findIndex(stats => stats.user_id === user?.id) + 1

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        {/* Заголовок лиги */}
        <Paper withBorder radius="md" p="lg">
          <Stack>
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Title order={2}>{league.name}</Title>
                {league.description && (
                  <Text c="dimmed">{league.description}</Text>
                )}
                <Group gap="sm">
                  <Badge variant="light" color="blue">
                    {league.season}
                  </Badge>
                  <Badge variant="light" color={
                    league.status === 'active' ? 'green' : 
                    league.status === 'upcoming' ? 'yellow' : 'gray'
                  }>
                    {league.status === 'active' ? 'Активна' : 
                     league.status === 'upcoming' ? 'Предстоящая' : 'Завершена'}
                  </Badge>
                  <Badge variant="light" color="teal">
                    {dayjs(league.start_date).format('DD.MM.YYYY')} - {dayjs(league.end_date).format('DD.MM.YYYY')}
                  </Badge>
                </Group>
              </Stack>
              
              <Group>
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportRating}
                  loading={exportLeagueRating.isPending}
                >
                  Экспорт рейтинга
                </Button>
                {user && (role === 'admin' || role === 'organizer') && (
                  <>
                    <Button 
                      variant="light"
                      leftSection={<IconEdit size={16} />}
                      onClick={handleEditLeague}
                    >
                      Редактировать
                    </Button>
                    <Button 
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => setDeleteConfirmOpened(true)}
                    >
                      Удалить
                    </Button>
                    <Button 
                      variant="light"
                      leftSection={<IconEdit size={16} />}
                      onClick={() => setLinkModalOpened(true)}
                    >
                      Привязать соревнования
                    </Button>
                    <Button 
                      variant="light"
                      leftSection={<IconMail size={16} />}
                      onClick={() => setInvitationModalOpened(true)}
                    >
                      Пригласить участников
                    </Button>
                    <Button 
                      variant="light"
                      leftSection={<IconBell size={16} />}
                      onClick={() => setNotificationModalOpened(true)}
                    >
                      Уведомления
                    </Button>
                  </>
                )}
                {user && !isParticipating && league.status === 'active' && (
                  <Button 
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setJoinModalOpened(true)}
                  >
                    Присоединиться
                  </Button>
                )}
                {user && isParticipating && (
                  <Button 
                    variant="light" 
                    color="red"
                    onClick={handleLeaveLeague}
                    loading={leaveLeague.isPending}
                  >
                    Покинуть лигу
                  </Button>
                )}
              </Group>
            </Group>

            {/* Статистика пользователя */}
            {user && userStats && (
              <Paper withBorder radius="md" p="md" style={{ 
                background: 'linear-gradient(135deg, rgba(0,128,255,0.05) 0%, rgba(0,200,170,0.05) 100%)' 
              }}>
                <Group justify="space-between">
                  <Group>
                    <Avatar src="/placeholder-user.jpg" alt="user" radius="xl" size={48} />
                    <Stack gap={2}>
                      <Text fw={600} size="lg">
                        {userStats.user_nickname || userStats.user_email || 'Вы'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {getClassLabel(userStats.class)}
                      </Text>
                    </Stack>
                  </Group>
                  <Group gap="xl">
                    <Stack align="center" gap={2}>
                      <Title order={1} style={{ fontSize: 36, lineHeight: 1 }}>#{userRank}</Title>
                      <Text size="sm" c="dimmed">Место в рейтинге</Text>
                    </Stack>
                    <Stack align="center" gap={2}>
                      <Text fw={700} size="xl">{userStats.current_rating}</Text>
                      <Text size="sm" c="dimmed">Очков</Text>
                    </Stack>
                    <Stack align="center" gap={2}>
                      <Text fw={600}>{userStats.competitions_count}</Text>
                      <Text size="sm" c="dimmed">Соревнований</Text>
                    </Stack>
                    <Stack align="center" gap={2}>
                      <Badge color={getFormColor(userStats.recent_form)} variant="light">
                        {getFormLabel(userStats.recent_form)}
                      </Badge>
                      <Text size="sm" c="dimmed">Форма</Text>
                    </Stack>
                  </Group>
                </Group>
              </Paper>
            )}
          </Stack>
        </Paper>

        {/* Табы */}
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'rating')}>
          <Tabs.List>
            <Tabs.Tab value="rating">Рейтинг</Tabs.Tab>
            <Tabs.Tab value="stats">Статистика</Tabs.Tab>
            <Tabs.Tab value="rules">Правила</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="rating" pt="md">
            <Stack gap="md">
              {/* Фильтры */}
              <Group justify="space-between">
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
                  />
                </Group>
                <Text size="sm" c="dimmed">
                  Участников: {rating?.length || 0}
                </Text>
              </Group>

              {/* Таблица рейтинга */}
              <Paper withBorder radius="md" p="md">
                {ratingLoading ? (
                  <Text>Загрузка рейтинга...</Text>
                ) : (
                  <Table>
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
                              {index === 0 && <IconCrown size={16} color="gold" />}
                              {index === 1 && <IconMedal size={16} color="silver" />}
                              {index === 2 && <IconTrophy size={16} color="bronze" />}
                              <Text fw={index < 3 ? 600 : 400}>
                                {index + 1}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar src="/placeholder-user.jpg" alt="user" radius="xl" size={32} />
                              <Stack gap={2}>
                                <Text fw={500}>
                                  {player.user_nickname || player.user_email || player.user_id}
                                </Text>
                                {player.user_id === user?.id && (
                                  <Badge size="xs" variant="light" color="blue">Вы</Badge>
                                )}
                              </Stack>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color={getClassColor(player.class)}>
                              {getClassLabel(player.class)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600}>{player.current_rating}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{player.competitions_count}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{player.best_place}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color={getFormColor(player.recent_form)}>
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

          <Tabs.Panel value="stats" pt="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" p="md">
                  <Stack gap="sm">
                    <Title order={4}>Общая статистика</Title>
                    <Group justify="space-between">
                      <Text>Всего участников:</Text>
                      <Text fw={600}>{rating?.length || 0}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text>Новичков:</Text>
                      <Text fw={600}>{rating?.filter(p => p.class === 'novice').length || 0}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text>Любителей:</Text>
                      <Text fw={600}>{rating?.filter(p => p.class === 'amateur').length || 0}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text>Профессионалов:</Text>
                      <Text fw={600}>{rating?.filter(p => p.class === 'professional').length || 0}</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" p="md">
                  <Stack gap="sm">
                    <Title order={4}>Топ-3 лидеры</Title>
                    {rating?.slice(0, 3).map((player, index) => (
                      <Group key={player.user_id} justify="space-between">
                        <Group gap="sm">
                          <ThemeIcon 
                            radius="xl" 
                            color={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}
                            variant="light"
                          >
                            {index + 1}
                          </ThemeIcon>
                          <Text fw={500}>
                            {player.user_nickname || player.user_email || player.user_id}
                          </Text>
                        </Group>
                        <Text fw={600}>{player.current_rating}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="rules" pt="md">
            <Paper withBorder radius="md" p="md">
              <Stack gap="md">
                <Title order={4}>Правила лиги</Title>
                {league && (() => {
                  const config = ratingConfigs?.find(c => c.id === league.rating_config_id)
                  return config ? (
                    <Stack gap="sm">
                      <Text><strong>Система очков:</strong></Text>
                      <Text size="sm" c="dimmed">
                        За места в соревнованиях начисляются очки: {config.points_per_place.slice(0, 10).join(', ')}...
                      </Text>
                      <Text><strong>Минимальное количество соревнований:</strong> {config.min_competitions}</Text>
                      <Text><strong>Период затухания результатов:</strong> {config.decay_period_months} месяцев</Text>
                    </Stack>
                  ) : null
                })()}
                <Text size="sm" c="dimmed">
                  Подробные правила соревнований указаны в описании каждого турнира.
                </Text>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>

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

      {/* Модальное окно привязки соревнований */}
      <Modal
        opened={linkModalOpened}
        onClose={() => setLinkModalOpened(false)}
        title="Привязать соревнования к лиге"
        centered
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">Выберите соревнования, которые нужно привязать к этой лиге.</Text>
          <Select
            data={(competitions || [])
              .filter((c) => !c.league_id || c.league_id === league.id)
              .map((c) => ({ value: c.id, label: `${c.title} — ${dayjs(c.starts_at).format('DD.MM.YYYY')}` }))}
            value={null}
            onChange={(val) => {
              if (val && !selectedCompetitions.includes(val)) {
                setSelectedCompetitions((prev) => [...prev, val])
              }
            }}
            searchable
            placeholder="Добавить соревнование"
          />

          {selectedCompetitions.length > 0 && (
            <Paper withBorder radius="md" p="sm">
              <Stack gap={4}>
                {selectedCompetitions.map((id) => {
                  const comp = (competitions || []).find((c) => c.id === id)
                  return (
                    <Group key={id} justify="space-between">
                      <Text size="sm">{comp?.title || id}</Text>
                      <ActionIcon variant="light" color="red" onClick={() => setSelectedCompetitions((prev) => prev.filter((x) => x !== id))}>
                        ✕
                      </ActionIcon>
                    </Group>
                  )
                })}
              </Stack>
            </Paper>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setLinkModalOpened(false)}>Отмена</Button>
            <Button 
              onClick={async () => {
                if (!leagueId || selectedCompetitions.length === 0) return
                await linkCompetitions.mutateAsync({ leagueId, competitionIds: selectedCompetitions })
                setSelectedCompetitions([])
                setLinkModalOpened(false)
              }}
              loading={linkCompetitions.isPending}
              disabled={selectedCompetitions.length === 0}
            >
              Привязать
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно редактирования лиги */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Редактировать лигу"
        size="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Название лиги"
            placeholder="Весенняя лига 2024"
            value={editingLeague.name}
            onChange={(e) => setEditingLeague({ ...editingLeague, name: e.target.value })}
            required
          />

          <Textarea
            label="Описание"
            placeholder="Описание лиги и правил участия"
            value={editingLeague.description}
            onChange={(e) => setEditingLeague({ ...editingLeague, description: e.target.value })}
            minRows={3}
          />

          <Select
            label="Сезон"
            placeholder="Выберите сезон"
            data={[
              { value: '2024-spring', label: 'Весна 2024' },
              { value: '2024-summer', label: 'Лето 2024' },
              { value: '2024-autumn', label: 'Осень 2024' },
              { value: '2024-winter', label: 'Зима 2024' }
            ]}
            value={editingLeague.season}
            onChange={(value) => setEditingLeague({ ...editingLeague, season: value || '' })}
            required
          />

          <Group grow>
            <TextInput
              label="Дата начала"
              type="date"
              value={editingLeague.start_date}
              onChange={(e) => setEditingLeague({ ...editingLeague, start_date: e.target.value })}
              required
            />
            <TextInput
              label="Дата окончания"
              type="date"
              value={editingLeague.end_date}
              onChange={(e) => setEditingLeague({ ...editingLeague, end_date: e.target.value })}
              required
            />
          </Group>

          <Select
            label="Система рейтинга"
            placeholder="Выберите конфигурацию рейтинга"
            data={(ratingConfigs ?? []).map(config => ({
              value: config.id,
              label: config.name
            }))}
            value={editingLeague.rating_config_id}
            onChange={(value) => setEditingLeague({ ...editingLeague, rating_config_id: value || '' })}
            required
          />

          <LeagueImageUploader
            leagueId={leagueId || 'new'}
            currentImage={editingLeague.image_url}
            onImageChange={(url) => setEditingLeague({ ...editingLeague, image_url: url })}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setEditModalOpened(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleUpdateLeague}
              loading={updateLeague.isPending}
              disabled={!editingLeague.name || !editingLeague.season || !editingLeague.start_date || !editingLeague.end_date || !editingLeague.rating_config_id}
            >
              Сохранить изменения
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        opened={deleteConfirmOpened}
        onClose={() => setDeleteConfirmOpened(false)}
        title="Подтверждение удаления"
        centered
      >
        <Stack gap="md">
          <Text>
            Вы уверены, что хотите удалить лигу "{league?.name}"? Это действие нельзя отменить.
          </Text>
          <Text size="sm" c="red">
            Внимание: При удалении лиги также будут удалены все связанные данные (участия, результаты, рейтинги).
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setDeleteConfirmOpened(false)}>
              Отмена
            </Button>
            <Button 
              color="red"
              onClick={handleDeleteLeague}
              loading={deleteLeague.isPending}
            >
              Удалить лигу
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно управления приглашениями */}
      <InvitationManagement
        leagueId={leagueId!}
        opened={invitationModalOpened}
        onClose={() => setInvitationModalOpened(false)}
      />

      {/* Модальное окно управления уведомлениями */}
      <NotificationManagement
        leagueId={leagueId!}
        opened={notificationModalOpened}
        onClose={() => setNotificationModalOpened(false)}
      />
    </Container>
  )
}
