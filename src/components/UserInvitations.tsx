// Компонент для отображения приглашений пользователя
// Создайте файл src/components/UserInvitations.tsx

import { useState } from 'react'
import {
  Paper,
  Stack,
  Text,
  Button,
  Group,
  Badge,
  Table,
  ActionIcon,
  Tooltip,
  Modal,
  Alert,
  Title,
  Box
} from '@mantine/core'
import {
  IconMail,
  IconCheck,
  IconX,
  IconClock,
  IconAlertCircle,
  IconExternalLink
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useAuth } from '@/features/auth/hooks'
import { useLeagueInvitations } from '@/features/leagues/model/hooks'
import dayjs from 'dayjs'

interface UserInvitationsProps {
  leagueId?: string
  showAll?: boolean
}

export function UserInvitations({ leagueId, showAll = false }: UserInvitationsProps) {
  const { user } = useAuth()
  const [opened, setOpened] = useState(false)
  
  // Получаем приглашения пользователя по email
  const { data: invitations, isLoading } = useLeagueInvitations(leagueId)

  // Фильтруем приглашения для текущего пользователя
  const userInvitations = invitations?.filter(invitation => 
    invitation.email === user?.email && invitation.status === 'pending'
  ) || []

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает ответа'
      case 'accepted': return 'Принято'
      case 'declined': return 'Отклонено'
      case 'expired': return 'Истекло'
      default: return 'Неизвестно'
    }
  }

  const handleOpenInvitation = (token: string) => {
    // Открываем страницу приглашения в новом окне
    window.open(`/invitation/${token}`, '_blank')
  }

  if (!user) return null

  if (showAll) {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>Приглашения в лиги</Title>
            <Badge color="blue" variant="light">
              {userInvitations.length}
            </Badge>
          </Group>

          {isLoading ? (
            <Text c="dimmed">Загрузка приглашений...</Text>
          ) : userInvitations.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Лига</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Истекает</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userInvitations.map((invitation) => {
                  const isExpired = new Date(invitation.expires_at) < new Date()
                  
                  return (
                    <Table.Tr key={invitation.id}>
                      <Table.Td>
                        <Text fw={500}>Лига #{invitation.league_id.slice(0, 8)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(invitation.status)}
                          leftSection={getStatusIcon(invitation.status)}
                        >
                          {getStatusText(invitation.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={isExpired ? 'red' : 'dimmed'}>
                          {dayjs(invitation.expires_at).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {invitation.status === 'pending' && !isExpired && (
                            <Tooltip label="Открыть приглашение">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => handleOpenInvitation(invitation.token)}
                              >
                                <IconExternalLink size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          ) : (
            <Alert icon={<IconMail size={16} />} color="blue">
              У вас нет активных приглашений в лиги
            </Alert>
          )}
        </Stack>
      </Paper>
    )
  }

  // Компактный вид для отображения в других местах
  if (userInvitations.length === 0) return null

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconMail size={16} />}
        onClick={() => setOpened(true)}
        color="blue"
      >
        Приглашения ({userInvitations.length})
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Приглашения в лиги"
        size="lg"
      >
        <Stack gap="md">
          {userInvitations.map((invitation) => {
            const isExpired = new Date(invitation.expires_at) < new Date()
            
            return (
              <Paper key={invitation.id} withBorder p="md" radius="md">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={500}>Лига #{invitation.league_id.slice(0, 8)}</Text>
                    <Badge
                      color={getStatusColor(invitation.status)}
                      leftSection={getStatusIcon(invitation.status)}
                    >
                      {getStatusText(invitation.status)}
                    </Badge>
                  </Group>
                  
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Истекает:</Text>
                    <Text size="sm" c={isExpired ? 'red' : 'dimmed'}>
                      {dayjs(invitation.expires_at).format('DD.MM.YYYY HH:mm')}
                    </Text>
                  </Group>
                  
                  {invitation.status === 'pending' && !isExpired && (
                    <Button
                      fullWidth
                      leftSection={<IconExternalLink size={16} />}
                      onClick={() => handleOpenInvitation(invitation.token)}
                    >
                      Открыть приглашение
                    </Button>
                  )}
                  
                  {isExpired && (
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      color="red"
                      size="sm"
                    >
                      Приглашение истекло
                    </Alert>
                  )}
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      </Modal>
    </>
  )
}
