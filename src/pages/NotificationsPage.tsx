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
  Switch,
  Divider,
  ScrollArea,
  Card,
  ThemeIcon,
  Tabs,
  Grid
} from '@mantine/core'
import { IconBell, IconBellOff, IconCheck, IconTrash, IconSettings, IconTrophy, IconTrendingUp, IconUsers, IconTarget } from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { 
  useNotifications, 
  useNotificationStats,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useUnreadNotificationsCount,
  useRecentNotifications
} from '@/features/notifications/hooks'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [settingsModalOpened, setSettingsModalOpened] = useState(false)

  const { data: notifications } = useNotifications(user?.id, { limit: 50 })
  const { data: stats } = useNotificationStats(user?.id)
  const { data: settings } = useNotificationSettings(user?.id)
  const { count: unreadCount } = useUnreadNotificationsCount(user?.id)
  const { notifications: recentNotifications } = useRecentNotifications(user?.id, 5)

  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()
  const updateSettings = useUpdateNotificationSettings()

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
    await markAsRead.mutateAsync(notificationId)
  }

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification.mutateAsync(notificationId)
  }

  const handleUpdateSettings = async (input: any) => {
    if (!user?.id) return
    await updateSettings.mutateAsync({ userId: user.id, input })
  }

  const filteredNotifications = notifications?.filter(notification => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !notification.is_read
    return notification.type === activeTab
  }) || []

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        {/* Заголовок */}
        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="center">
            <Group>
              <ThemeIcon size={48} radius="xl" variant="light" color="blue">
                <IconBell size={24} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={2}>Уведомления</Title>
                <Text c="dimmed">
                  {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
                </Text>
              </Stack>
            </Group>
            <Group>
              {unreadCount > 0 && (
                <Button 
                  variant="light" 
                  leftSection={<IconCheck size={16} />}
                  onClick={() => markAllAsRead.mutateAsync(user!.id)}
                  loading={markAllAsRead.isPending}
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
        </Paper>

        {/* Статистика */}
        {stats && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder radius="md" p="md">
                <Stack align="center" gap="sm">
                  <ThemeIcon size={40} radius="xl" variant="light" color="blue">
                    <IconBell size={20} />
                  </ThemeIcon>
                  <Stack align="center" gap={2}>
                    <Text fw={600} size="xl">{stats.total}</Text>
                    <Text size="sm" c="dimmed">Всего</Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder radius="md" p="md">
                <Stack align="center" gap="sm">
                  <ThemeIcon size={40} radius="xl" variant="light" color="red">
                    <IconBellOff size={20} />
                  </ThemeIcon>
                  <Stack align="center" gap={2}>
                    <Text fw={600} size="xl">{stats.unread}</Text>
                    <Text size="sm" c="dimmed">Непрочитанных</Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder radius="md" p="md">
                <Stack align="center" gap="sm">
                  <ThemeIcon size={40} radius="xl" variant="light" color="green">
                    <IconTrophy size={20} />
                  </ThemeIcon>
                  <Stack align="center" gap={2}>
                    <Text fw={600} size="xl">{stats.by_type.achievement || 0}</Text>
                    <Text size="sm" c="dimmed">Достижений</Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder radius="md" p="md">
                <Stack align="center" gap="sm">
                  <ThemeIcon size={40} radius="xl" variant="light" color="orange">
                    <IconTrendingUp size={20} />
                  </ThemeIcon>
                  <Stack align="center" gap={2}>
                    <Text fw={600} size="xl">{stats.recent_count}</Text>
                    <Text size="sm" c="dimmed">За неделю</Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        )}

        {/* Табы */}
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'all')}>
          <Tabs.List>
            <Tabs.Tab value="all">Все</Tabs.Tab>
            <Tabs.Tab value="unread">Непрочитанные ({unreadCount})</Tabs.Tab>
            <Tabs.Tab value="achievement">Достижения</Tabs.Tab>
            <Tabs.Tab value="rating_change">Рейтинг</Tabs.Tab>
            <Tabs.Tab value="league_update">Лиги</Tabs.Tab>
            <Tabs.Tab value="competition_result">Соревнования</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            <ScrollArea h={600}>
              <Stack gap="sm">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <Paper 
                      key={notification.id} 
                      withBorder 
                      radius="md" 
                      p="md"
                      style={{ 
                        opacity: notification.is_read ? 0.7 : 1,
                        background: notification.is_read ? 'rgba(0,0,0,0.02)' : 'white'
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
                              {!notification.is_read && (
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
                          {!notification.is_read && (
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
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Paper withBorder radius="md" p="lg">
                    <Stack align="center" gap="md">
                      <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                        <IconBell size={32} />
                      </ThemeIcon>
                      <Stack align="center" gap="xs">
                        <Title order={4}>Нет уведомлений</Title>
                        <Text c="dimmed" ta="center">
                          {activeTab === 'unread' 
                            ? 'Все уведомления прочитаны'
                            : 'Пока нет уведомлений этого типа'
                          }
                        </Text>
                      </Stack>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Модальное окно настроек */}
      <Modal
        opened={settingsModalOpened}
        onClose={() => setSettingsModalOpened(false)}
        title="Настройки уведомлений"
        size="md"
        centered
      >
        {settings && (
          <Stack gap="md">
            <Switch
              label="Email уведомления"
              description="Получать уведомления на email"
              checked={settings.email_notifications}
              onChange={(e) => handleUpdateSettings({ email_notifications: e.currentTarget.checked })}
            />
            <Switch
              label="Push уведомления"
              description="Получать push уведомления в браузере"
              checked={settings.push_notifications}
              onChange={(e) => handleUpdateSettings({ push_notifications: e.currentTarget.checked })}
            />
            
            <Divider />
            
            <Text fw={500}>Типы уведомлений</Text>
            
            <Switch
              label="Достижения"
              description="Уведомления о получении достижений"
              checked={settings.achievement_notifications}
              onChange={(e) => handleUpdateSettings({ achievement_notifications: e.currentTarget.checked })}
            />
            <Switch
              label="Изменения рейтинга"
              description="Уведомления об изменениях в рейтинге лиги"
              checked={settings.rating_change_notifications}
              onChange={(e) => handleUpdateSettings({ rating_change_notifications: e.currentTarget.checked })}
            />
            <Switch
              label="Обновления лиги"
              description="Уведомления об изменениях в лиге"
              checked={settings.league_update_notifications}
              onChange={(e) => handleUpdateSettings({ league_update_notifications: e.currentTarget.checked })}
            />
            <Switch
              label="Результаты соревнований"
              description="Уведомления о результатах соревнований"
              checked={settings.competition_result_notifications}
              onChange={(e) => handleUpdateSettings({ competition_result_notifications: e.currentTarget.checked })}
            />
            <Switch
              label="Награды"
              description="Уведомления о получении наград"
              checked={settings.reward_notifications}
              onChange={(e) => handleUpdateSettings({ reward_notifications: e.currentTarget.checked })}
            />
            <Switch
              label="Системные сообщения"
              description="Важные системные уведомления"
              checked={settings.system_notifications}
              onChange={(e) => handleUpdateSettings({ system_notifications: e.currentTarget.checked })}
            />
          </Stack>
        )}
      </Modal>
    </Container>
  )
}
