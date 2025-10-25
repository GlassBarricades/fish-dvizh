import { useState } from 'react'
import {
  Container,
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  ActionIcon,
  Modal,
  ScrollArea,
  Card,
  ThemeIcon,
  Tabs,
  Grid
} from '@mantine/core'
import { IconBell, IconBellOff, IconCheck, IconTrash, IconSettings, IconTrophy, IconTrendingUp, IconUsers, IconTarget } from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { 
  useUserNotifications, 
  useNotificationStats,
  useUpdateNotificationStatus,
  useUnreadNotificationsCount
} from '@/features/notifications/model/hooks'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [settingsModalOpened, setSettingsModalOpened] = useState(false)

  const { data: notifications } = useUserNotifications(user?.id || '')
  const { data: stats } = useNotificationStats()
  const { data: unreadData } = useUnreadNotificationsCount(user?.id)
  const unreadCount = unreadData?.count || 0

  const markAsRead = useUpdateNotificationStatus()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <IconTrophy size={20} />
      case 'rating_change': return <IconTrendingUp size={20} />
      case 'league_update': return <IconUsers size={20} />
      case 'competition_result': return <IconTarget size={20} />
      case 'reward': return <IconTrophy size={20} />
      case 'system': return <IconBell size={20} />
      default: return <IconBell size={20} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'yellow'
      case 'rating_change': return 'blue'
      case 'league_update': return 'green'
      case 'competition_result': return 'orange'
      case 'reward': return 'purple'
      case 'system': return 'gray'
      default: return 'gray'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'achievement': return 'Достижения'
      case 'rating_change': return 'Изменения рейтинга'
      case 'league_update': return 'Обновления лиги'
      case 'competition_result': return 'Результаты соревнований'
      case 'reward': return 'Награды'
      case 'system': return 'Системные'
      default: return 'Неизвестно'
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync({ notificationId, status: 'sent' })
  }

  const filteredNotifications = notifications?.filter((notification: any) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return notification.status === 'pending'
    return notification.type === activeTab
  }) || []

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        {/* Заголовок */}
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={1}>Уведомления</Title>
            <Text c="dimmed">
              Управляйте своими уведомлениями и настройками
            </Text>
          </Stack>
          <Group>
            {unreadCount > 0 && (
              <Button 
                variant="light" 
                leftSection={<IconCheck size={16} />}
                onClick={() => {/* TODO: Implement mark all as read */}}
                loading={false}
              >
                Отметить все как прочитанные
              </Button>
            )}
            <Button 
              variant="light" 
              leftSection={<IconSettings size={16} />}
              onClick={() => setSettingsModalOpened(true)}
            >
              Настройки
            </Button>
          </Group>
        </Group>

        {/* Статистика */}
        <Grid>
          <Grid.Col span={3}>
            <Card withBorder>
              <Stack align="center" gap="sm">
                <ThemeIcon size={40} radius="xl" variant="light" color="blue">
                  <IconBell size={20} />
                </ThemeIcon>
                <Stack align="center" gap={2}>
                  <Text fw={600} size="xl">{stats?.total || 0}</Text>
                  <Text size="sm" c="dimmed">Всего</Text>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder>
              <Stack align="center" gap="sm">
                <ThemeIcon size={40} radius="xl" variant="light" color="red">
                  <IconBellOff size={20} />
                </ThemeIcon>
                <Stack align="center" gap={2}>
                  <Text fw={600} size="xl">{unreadCount}</Text>
                  <Text size="sm" c="dimmed">Непрочитанных</Text>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder>
              <Stack align="center" gap="sm">
                <ThemeIcon size={40} radius="xl" variant="light" color="green">
                  <IconTrophy size={20} />
                </ThemeIcon>
                <Stack align="center" gap={2}>
                  <Text fw={600} size="xl">{stats?.pending || 0}</Text>
                  <Text size="sm" c="dimmed">Достижений</Text>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder>
              <Stack align="center" gap="sm">
                <ThemeIcon size={40} radius="xl" variant="light" color="orange">
                  <IconTrendingUp size={20} />
                </ThemeIcon>
                <Stack align="center" gap={2}>
                  <Text fw={600} size="xl">{stats?.sent || 0}</Text>
                  <Text size="sm" c="dimmed">За неделю</Text>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Фильтры */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
          <Tabs.List>
            <Tabs.Tab value="all">Все</Tabs.Tab>
            <Tabs.Tab value="unread">Непрочитанные</Tabs.Tab>
            <Tabs.Tab value="achievement">Достижения</Tabs.Tab>
            <Tabs.Tab value="rating_change">Рейтинг</Tabs.Tab>
            <Tabs.Tab value="league_update">Лиги</Tabs.Tab>
            <Tabs.Tab value="competition_result">Соревнования</Tabs.Tab>
            <Tabs.Tab value="reward">Награды</Tabs.Tab>
            <Tabs.Tab value="system">Системные</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            <ScrollArea h={600}>
              <Stack gap="md">
                {filteredNotifications.length === 0 ? (
                  <Paper p="xl" withBorder>
                    <Stack align="center" gap="md">
                      <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                        <IconBell size={30} />
                      </ThemeIcon>
                      <Stack align="center" gap={4}>
                        <Text fw={500} size="lg">Нет уведомлений</Text>
                        <Text c="dimmed" ta="center">
                          {activeTab === 'unread' 
                            ? 'У вас нет непрочитанных уведомлений'
                            : 'Уведомления по выбранному фильтру не найдены'
                          }
                        </Text>
                      </Stack>
                    </Stack>
                  </Paper>
                ) : (
                  filteredNotifications.map((notification: any) => (
                    <Paper 
                      key={notification.id} 
                      withBorder 
                      radius="md" 
                      p="md"
                      style={{
                        opacity: notification.status === 'sent' ? 0.7 : 1,
                        background: notification.status === 'sent' ? 'rgba(0,0,0,0.02)' : 'white'
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Group gap="sm" style={{ flex: 1 }}>
                          <ThemeIcon 
                            radius="xl" 
                            color={getNotificationColor(notification.type)}
                            variant="light"
                          >
                            {getNotificationIcon(notification.type)}
                          </ThemeIcon>
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Group gap="xs">
                              <Text fw={500}>{notification.title}</Text>
                              {notification.status === 'pending' && (
                                <Badge size="xs" color="red">Новое</Badge>
                              )}
                              <Badge size="xs" variant="light" color={getNotificationColor(notification.type)}>
                                {getTypeLabel(notification.type)}
                              </Badge>
                            </Group>
                            <Text size="sm" c="dimmed">{notification.message}</Text>
                            <Text size="xs" c="dimmed">
                              {new Date(notification.created_at).toLocaleString()}
                            </Text>
                          </Stack>
                        </Group>
                        <Group gap="xs">
                          {notification.status === 'pending' && (
                            <ActionIcon 
                              variant="light" 
                              color="green"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <IconCheck size={16} />
                            </ActionIcon>
                          )}
                          <ActionIcon 
                            variant="light" 
                            color="red"
                            onClick={() => {/* TODO: Implement delete notification */}}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))
                )}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>

        {/* Модальное окно настроек */}
        <Modal
          opened={settingsModalOpened}
          onClose={() => setSettingsModalOpened(false)}
          title="Настройки уведомлений"
          size="md"
          centered
        >
          <Stack gap="md">
            <Text c="dimmed">Функция настроек уведомлений будет добавлена в следующих версиях.</Text>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}