// Компонент управления уведомлениями
// Создайте файл src/features/notifications/components/NotificationManagement.tsx

import { useState } from 'react'
import {
  Modal,
  Stack,
  Title,
  Group,
  Button,
  Text,
  Badge,
  Table,
  ActionIcon,
  Tooltip,
  Alert,
  Divider,
  Paper,
  Box,
  Tabs,
  TextInput,
  Textarea,
  Select,
  Switch,
  Card,
  SimpleGrid
} from '@mantine/core'
import {
  IconMail,
  IconSend,
  IconEye,
  IconTrash,
  IconRefresh,
  IconTemplate,
  IconChartBar,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useAuth } from '@/features/auth/hooks'
import {
  useLeagueNotifications,
  useCreateNotification,
  useEmailTemplates,
  useUpsertEmailTemplate,
  useSendEmail,
  useNotificationStats
} from '../model/hooks'
import dayjs from 'dayjs'

interface NotificationManagementProps {
  leagueId: string
  opened: boolean
  onClose: () => void
}

export function NotificationManagement({ leagueId, opened, onClose }: NotificationManagementProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history' | 'stats'>('send')
  const { user } = useAuth()
  
  const { data: leagueNotifications, isLoading } = useLeagueNotifications(leagueId)
  const { data: emailTemplates } = useEmailTemplates()
  const { data: stats } = useNotificationStats(leagueId)
  
  const createNotification = useCreateNotification()
  const upsertTemplate = useUpsertEmailTemplate()
  const sendEmail = useSendEmail()

  // Форма для отправки уведомления
  const notificationForm = useForm({
    initialValues: {
      title: '',
      message: '',
      type: 'custom' as const,
      email: '',
      sendToAll: false
    },
    validate: {
      title: (value) => (value.length > 0 ? null : 'Заголовок обязателен'),
      message: (value) => (value.length > 0 ? null : 'Сообщение обязательно'),
      email: (value, values) => 
        !values.sendToAll && value.length === 0 ? 'Email обязателен' : 
        !values.sendToAll && !/^\S+@\S+$/.test(value) ? 'Некорректный email' : null
    }
  })

  // Форма для создания шаблона
  const templateForm = useForm({
    initialValues: {
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      variables: '{}'
    },
    validate: {
      name: (value) => (value.length > 0 ? null : 'Название обязательно'),
      subject: (value) => (value.length > 0 ? null : 'Тема обязательна'),
      html_content: (value) => (value.length > 0 ? null : 'HTML содержимое обязательно')
    }
  })

  const handleSendNotification = async (values: typeof notificationForm.values) => {
    if (!user?.id) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Пользователь не авторизован'
      })
      return
    }

    try {
      if (values.sendToAll) {
        // Отправка всем участникам лиги (заглушка)
        notifications.show({
          color: 'blue',
          title: 'Функция в разработке',
          message: 'Отправка всем участникам будет доступна в следующей версии'
        })
      } else {
        await createNotification.mutateAsync({
          user_id: user.id, // В реальном проекте здесь будет поиск пользователя по email
          league_id: leagueId,
          type: values.type,
          title: values.title,
          message: values.message,
          email: values.email
        })
        notificationForm.reset()
      }
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleSaveTemplate = async (values: typeof templateForm.values) => {
    try {
      let variables = {}
      try {
        variables = JSON.parse(values.variables)
      } catch {
        notifications.show({
          color: 'red',
          title: 'Ошибка',
          message: 'Некорректный JSON в переменных'
        })
        return
      }

      await upsertTemplate.mutateAsync({
        name: values.name,
        subject: values.subject,
        html_content: values.html_content,
        text_content: values.text_content || undefined,
        variables
      })
      templateForm.reset()
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow'
      case 'sent': return 'green'
      case 'failed': return 'red'
      case 'delivered': return 'blue'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <IconClock size={14} />
      case 'sent': return <IconSend size={14} />
      case 'failed': return <IconX size={14} />
      case 'delivered': return <IconCheck size={14} />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает отправки'
      case 'sent': return 'Отправлено'
      case 'failed': return 'Ошибка отправки'
      case 'delivered': return 'Доставлено'
      default: return 'Неизвестно'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'invitation': return 'Приглашение'
      case 'league_update': return 'Обновление лиги'
      case 'competition_reminder': return 'Напоминание о соревновании'
      case 'results_available': return 'Результаты доступны'
      case 'custom': return 'Пользовательское'
      default: return 'Неизвестно'
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>Управление уведомлениями</Title>}
      size="xl"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack>
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
          <Tabs.List>
            <Tabs.Tab value="send" leftSection={<IconMail size={16} />}>
              Отправить
            </Tabs.Tab>
            <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
              Шаблоны
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconEye size={16} />}>
              История
            </Tabs.Tab>
            <Tabs.Tab value="stats" leftSection={<IconChartBar size={16} />}>
              Статистика
            </Tabs.Tab>
          </Tabs.List>

          {/* Отправка уведомления */}
          <Tabs.Panel value="send" pt="md">
            <form onSubmit={notificationForm.onSubmit(handleSendNotification)}>
              <Stack gap="md">
                <TextInput
                  label="Заголовок"
                  placeholder="Заголовок уведомления"
                  required
                  {...notificationForm.getInputProps('title')}
                />

                <Select
                  label="Тип уведомления"
                  data={[
                    { value: 'custom', label: 'Пользовательское' },
                    { value: 'league_update', label: 'Обновление лиги' },
                    { value: 'competition_reminder', label: 'Напоминание о соревновании' },
                    { value: 'results_available', label: 'Результаты доступны' }
                  ]}
                  {...notificationForm.getInputProps('type')}
                />

                <Textarea
                  label="Сообщение"
                  placeholder="Текст уведомления"
                  minRows={4}
                  required
                  {...notificationForm.getInputProps('message')}
                />

                <Switch
                  label="Отправить всем участникам лиги"
                  {...notificationForm.getInputProps('sendToAll', { type: 'checkbox' })}
                />

                {!notificationForm.values.sendToAll && (
                  <TextInput
                    label="Email получателя"
                    placeholder="recipient@example.com"
                    {...notificationForm.getInputProps('email')}
                  />
                )}

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    leftSection={<IconSend size={16} />}
                    loading={createNotification.isPending}
                  >
                    Отправить уведомление
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* Управление шаблонами */}
          <Tabs.Panel value="templates" pt="md">
            <Stack gap="md">
              <Title order={4}>Создать новый шаблон</Title>
              
              <form onSubmit={templateForm.onSubmit(handleSaveTemplate)}>
                <Stack gap="md">
                  <TextInput
                    label="Название шаблона"
                    placeholder="league_invitation"
                    required
                    {...templateForm.getInputProps('name')}
                  />

                  <TextInput
                    label="Тема письма"
                    placeholder="Приглашение в лигу {{league_name}}"
                    required
                    {...templateForm.getInputProps('subject')}
                  />

                  <Textarea
                    label="HTML содержимое"
                    placeholder="<html>...</html>"
                    minRows={8}
                    required
                    {...templateForm.getInputProps('html_content')}
                  />

                  <Textarea
                    label="Текстовая версия (опционально)"
                    placeholder="Текстовая версия письма"
                    minRows={4}
                    {...templateForm.getInputProps('text_content')}
                  />

                  <Textarea
                    label="Переменные (JSON)"
                    placeholder='{"league_name": "string", "user_name": "string"}'
                    minRows={3}
                    {...templateForm.getInputProps('variables')}
                  />

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      leftSection={<IconTemplate size={16} />}
                      loading={upsertTemplate.isPending}
                    >
                      Сохранить шаблон
                    </Button>
                  </Group>
                </Stack>
              </form>

              <Divider />

              <Title order={4}>Существующие шаблоны</Title>
              
              {emailTemplates && emailTemplates.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  {emailTemplates.map((template) => (
                    <Card key={template.id} withBorder p="md">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text fw={500}>{template.name}</Text>
                          <Badge variant="light">{template.subject}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {template.html_content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </Text>
                        <Text size="xs" c="dimmed">
                          Обновлен: {dayjs(template.updated_at).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Alert icon={<IconAlertCircle size={16} />} color="blue">
                  Шаблоны не найдены
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          {/* История уведомлений */}
          <Tabs.Panel value="history" pt="md">
            <Stack gap="md">
              <Title order={4}>История уведомлений</Title>
              
              {isLoading ? (
                <Text>Загрузка уведомлений...</Text>
              ) : leagueNotifications && leagueNotifications.length > 0 ? (
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Тип</Table.Th>
                      <Table.Th>Заголовок</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Статус</Table.Th>
                      <Table.Th>Дата</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {leagueNotifications.map((notification) => (
                      <Table.Tr key={notification.id}>
                        <Table.Td>
                          <Badge variant="light">
                            {getTypeText(notification.type)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {notification.title}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{notification.email || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor(notification.status)}
                            leftSection={getStatusIcon(notification.status)}
                          >
                            {getStatusText(notification.status)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {dayjs(notification.created_at).format('DD.MM.YYYY HH:mm')}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Alert icon={<IconAlertCircle size={16} />} color="blue">
                  Уведомления не найдены
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Статистика */}
          <Tabs.Panel value="stats" pt="md">
            <Stack gap="md">
              <Title order={4}>Статистика уведомлений</Title>
              
              {stats ? (
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                  <Card withBorder p="md" ta="center">
                    <Text size="xl" fw={700} c="blue">
                      {stats.total}
                    </Text>
                    <Text size="sm" c="dimmed">Всего</Text>
                  </Card>
                  <Card withBorder p="md" ta="center">
                    <Text size="xl" fw={700} c="green">
                      {stats.sent}
                    </Text>
                    <Text size="sm" c="dimmed">Отправлено</Text>
                  </Card>
                  <Card withBorder p="md" ta="center">
                    <Text size="xl" fw={700} c="yellow">
                      {stats.pending}
                    </Text>
                    <Text size="sm" c="dimmed">Ожидает</Text>
                  </Card>
                  <Card withBorder p="md" ta="center">
                    <Text size="xl" fw={700} c="red">
                      {stats.failed}
                    </Text>
                    <Text size="sm" c="dimmed">Ошибки</Text>
                  </Card>
                </SimpleGrid>
              ) : (
                <Text>Загрузка статистики...</Text>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  )
}
