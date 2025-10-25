// Компоненты для управления приглашениями в лиги
// Создайте файл src/features/leagues/components/InvitationManagement.tsx

import { useState } from 'react'
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Table,
  ActionIcon,
  Tooltip,
  Textarea,
  Alert,
  Divider,
  Paper,
  Title,
  Box
} from '@mantine/core'
import {
  IconMail,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  useLeagueInvitations,
  useCreateLeagueInvitation,
  useRevokeLeagueInvitation,
  useResendLeagueInvitation,
  useCreateBulkLeagueInvitations
} from '../model/hooks'
import dayjs from 'dayjs'

interface InvitationManagementProps {
  leagueId: string
  opened: boolean
  onClose: () => void
}

export function InvitationManagement({ leagueId, opened, onClose }: InvitationManagementProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  
  const { data: invitations, isLoading } = useLeagueInvitations(leagueId)
  const createInvitation = useCreateLeagueInvitation()
  const revokeInvitation = useRevokeLeagueInvitation()
  const resendInvitation = useResendLeagueInvitation()
  const createBulkInvitations = useCreateBulkLeagueInvitations()

  // Форма для одиночного приглашения
  const singleForm = useForm({
    initialValues: {
      email: '',
      expiresInDays: 7
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email обязателен'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email'
        return null
      }
    }
  })

  // Форма для массовых приглашений
  const bulkForm = useForm({
    initialValues: {
      emails: ''
    },
    validate: {
      emails: (value) => {
        if (!value.trim()) return 'Список email обязателен'
        const emails = value.split('\n').map(e => e.trim()).filter(e => e)
        if (emails.length === 0) return 'Добавьте хотя бы один email'
        
        const invalidEmails = emails.filter(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        if (invalidEmails.length > 0) {
          return `Некорректные email: ${invalidEmails.join(', ')}`
        }
        return null
      }
    }
  })

  const handleSingleInvitation = async (values: typeof singleForm.values) => {
    try {
      await createInvitation.mutateAsync({
        league_id: leagueId,
        email: values.email,
        invited_by: 'current-user-id', // TODO: получить из контекста
        expires_in_days: values.expiresInDays
      })
      singleForm.reset()
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleBulkInvitations = async (values: typeof bulkForm.values) => {
    const emails = values.emails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e)
      .map(e => e.toLowerCase())

    try {
      await createBulkInvitations.mutateAsync({
        leagueId,
        emails,
        invitedBy: 'current-user-id' // TODO: получить из контекста
      })
      bulkForm.reset()
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow'
      case 'accepted': return 'green'
      case 'declined': return 'red'
      case 'expired': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <IconClock size={14} />
      case 'accepted': return <IconCheck size={14} />
      case 'declined': return <IconX size={14} />
      case 'expired': return <IconAlertCircle size={14} />
      default: return null
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Управление приглашениями"
      size="xl"
    >
      <Stack gap="lg">
        {/* Табы */}
        <Group gap="xs">
          <Button
            variant={activeTab === 'single' ? 'filled' : 'light'}
            onClick={() => setActiveTab('single')}
            leftSection={<IconMail size={16} />}
          >
            Одиночное приглашение
          </Button>
          <Button
            variant={activeTab === 'bulk' ? 'filled' : 'light'}
            onClick={() => setActiveTab('bulk')}
            leftSection={<IconPlus size={16} />}
          >
            Массовые приглашения
          </Button>
        </Group>

        {/* Форма одиночного приглашения */}
        {activeTab === 'single' && (
          <Paper withBorder p="md">
            <form onSubmit={singleForm.onSubmit(handleSingleInvitation)}>
              <Stack gap="md">
                <TextInput
                  label="Email участника"
                  placeholder="participant@example.com"
                  required
                  {...singleForm.getInputProps('email')}
                />
                
                <TextInput
                  label="Срок действия (дни)"
                  type="number"
                  min={1}
                  max={30}
                  {...singleForm.getInputProps('expiresInDays')}
                />

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    loading={createInvitation.isPending}
                    leftSection={<IconMail size={16} />}
                  >
                    Отправить приглашение
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}

        {/* Форма массовых приглашений */}
        {activeTab === 'bulk' && (
          <Paper withBorder p="md">
            <form onSubmit={bulkForm.onSubmit(handleBulkInvitations)}>
              <Stack gap="md">
                <Textarea
                  label="Список email (по одному на строку)"
                  placeholder="participant1@example.com&#10;participant2@example.com&#10;participant3@example.com"
                  minRows={5}
                  required
                  {...bulkForm.getInputProps('emails')}
                />

                <Alert icon={<IconAlertCircle size={16} />} color="blue">
                  Приглашения будут действительны в течение 7 дней
                </Alert>

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    loading={createBulkInvitations.isPending}
                    leftSection={<IconPlus size={16} />}
                  >
                    Отправить приглашения
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}

        <Divider />

        {/* Список приглашений */}
        <Box>
          <Title order={4} mb="md">Текущие приглашения</Title>
          
          {isLoading ? (
            <Text c="dimmed">Загрузка...</Text>
          ) : invitations && invitations.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Отправлено</Table.Th>
                  <Table.Th>Истекает</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invitations.map((invitation) => (
                  <Table.Tr key={invitation.id}>
                    <Table.Td>{invitation.email}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(invitation.status)}
                        leftSection={getStatusIcon(invitation.status)}
                      >
                        {invitation.status === 'pending' && 'Ожидает'}
                        {invitation.status === 'accepted' && 'Принято'}
                        {invitation.status === 'declined' && 'Отклонено'}
                        {invitation.status === 'expired' && 'Истекло'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {dayjs(invitation.created_at).format('DD.MM.YYYY HH:mm')}
                    </Table.Td>
                    <Table.Td>
                      {dayjs(invitation.expires_at).format('DD.MM.YYYY HH:mm')}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {invitation.status === 'pending' && (
                          <>
                            <Tooltip label="Переотправить">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => resendInvitation.mutate(invitation.id)}
                                loading={resendInvitation.isPending}
                              >
                                <IconRefresh size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Отозвать">
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => revokeInvitation.mutate(invitation.id)}
                                loading={revokeInvitation.isPending}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text c="dimmed">Приглашения не отправлялись</Text>
          )}
        </Box>
      </Stack>
    </Modal>
  )
}
