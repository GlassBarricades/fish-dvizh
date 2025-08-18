import { useState } from 'react'
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  Badge, 
  Group, 
  Stack, 
  Button, 
  Tabs, 
  Modal,
  TextInput,
  Textarea
} from '@mantine/core'
import { IconPlus, IconUserPlus, IconCrown, IconUsers } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useAuth } from '../features/auth/hooks'
import { useUserTeams, useCreateTeam, useDeleteTeam, useCreateTeamInvitation, useUserInvitations, useAcceptTeamInvitation } from '../features/teams/hooks'
import type { Team } from '../features/teams/types'
import { useNavigate } from 'react-router-dom'
import { useUserJudgeInvitations, useRespondJudgeInvitation } from '../features/judges/hooks'

export default function ProfilePage() {
  const { user } = useAuth()
  const { data: userTeams, isLoading: teamsLoading } = useUserTeams(user?.id || '')
  const { data: userInvitations, isLoading: invitationsLoading } = useUserInvitations(user?.id || '')
  const { mutateAsync: deleteTeam } = useDeleteTeam()
  const { mutateAsync: createTeam, isPending: isCreating } = useCreateTeam()
  const { mutateAsync: createInvitation, isPending: isInviting } = useCreateTeamInvitation()
  const { mutateAsync: acceptInvitation } = useAcceptTeamInvitation()
  const { data: judgeInvites } = useUserJudgeInvitations(user?.id)
  const { mutateAsync: respondJudgeInvite } = useRespondJudgeInvitation()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const navigate = useNavigate()

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Text ta="center" c="dimmed">
          Необходимо авторизоваться для просмотра профиля
        </Text>
      </Container>
    )
  }

  const handleCreateTeam = async (values: { name: string; description: string }) => {
    try {
      await createTeam({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        created_by: user.id,
      })
      notifications.show({ color: 'green', message: 'Команда создана' })
      setIsCreateModalOpen(false)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка создания команды' })
    }
  }

  const handleDeleteTeam = (team: Team) => {
    deleteTeam(team.id)
  }

  const handleInviteUser = async (values: { email: string }) => {
    if (!selectedTeam) return
    try {
      await createInvitation({
        team_id: selectedTeam.id,
        invited_user_email: values.email.trim(),
        invited_by: user.id,
        role: 'member',
      })
      notifications.show({ color: 'green', message: 'Приглашение отправлено' })
      setIsInviteModalOpen(false)
      setSelectedTeam(null)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка отправки приглашения' })
    }
  }

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    try {
      await acceptInvitation({ invitation_id: invitationId, accept })
      notifications.show({ 
        color: 'green', 
        message: accept ? 'Приглашение принято' : 'Приглашение отклонено' 
      })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка обработки приглашения' })
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* User Info */}
        <Paper p="xl" withBorder>
          <Stack gap="md">
            <Title order={2}>Профиль пользователя</Title>
            <Group gap="md">
              <Badge variant="light" color="blue" size="lg">
                {user.user_metadata?.role || 'user'}
              </Badge>
              <Text size="lg">
                <strong>Email:</strong> {user.email}
              </Text>
              {user.user_metadata?.nickname && (
                <Text size="lg">
                  <strong>Никнейм:</strong> {user.user_metadata.nickname}
                </Text>
              )}
              {user.user_metadata?.phone && (
                <Text size="lg">
                  <strong>Телефон:</strong> {user.user_metadata.phone}
                </Text>
              )}
            </Group>
          </Stack>
        </Paper>

        {/* Teams Management */}
        <Paper p="xl" withBorder>
          <Tabs defaultValue="my-teams">
            <Tabs.List>
              <Tabs.Tab value="my-teams" leftSection={<IconUsers size={16} />}>
                Мои команды
              </Tabs.Tab>
              <Tabs.Tab value="invitations" leftSection={<IconUserPlus size={16} />}>
                Приглашения
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="my-teams" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>Мои команды</Title>
                  <Button 
                    leftSection={<IconPlus size={16} />} 
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Создать команду
                  </Button>
                </Group>

                {teamsLoading ? (
                  <Text>Загрузка команд...</Text>
                ) : userTeams && userTeams.length > 0 ? (
                  <Stack gap="md">
                    {userTeams.map((team) => (
                      <Paper key={team.id} p="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="xs" align="center">
                              <Title order={4}>{team.name}</Title>
                              <Badge variant="light" color="yellow" leftSection={<IconCrown size={12} />}>
                                {team.created_by === user.id ? 'Создатель' : 'Участник'}
                              </Badge>
                            </Group>
                            {team.description && (
                              <Text c="dimmed" size="sm">
                                {team.description}
                              </Text>
                            )}
                            <Text size="xs" c="dimmed">
                              Создана {new Date(team.created_at).toLocaleDateString('ru-RU')}
                            </Text>
                          </Stack>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconUserPlus size={14} />}
                              onClick={() => {
                                setSelectedTeam(team)
                                setIsInviteModalOpen(true)
                              }}
                            >
                              Пригласить
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              onClick={() => {
                                setSelectedTeam(team)
                                setIsDeleteModalOpen(true)
                              }}
                            >
                              Удалить
                            </Button>
                          </Group>
                        </Group>
                        <Button
                          variant="subtle"
                          size="xs"
                          mt="xs"
                          onClick={() => navigate(`/team/${team.id}`)}
                        >
                          Подробнее о команде
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    У вас пока нет команд. Создайте первую!
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="invitations" pt="md">
              <Stack gap="md">
                <Title order={3}>Приглашения в команды</Title>
                
                {invitationsLoading ? (
                  <Text>Загрузка приглашений...</Text>
                ) : userInvitations && userInvitations.length > 0 ? (
                  <Stack gap="md">
                    {userInvitations.map((invitation) => (
                      <Paper key={invitation.id} p="md" withBorder>
                        <Group justify="space-between" mb="xs">
                          <Stack gap="xs">
                            <Text fw={500}>
                              Приглашение в команду "{invitation.team_name || 'Неизвестная команда'}"
                            </Text>
                            {invitation.team_description && (
                              <Text size="sm" c="dimmed">
                                {invitation.team_description}
                              </Text>
                            )}
                            <Text size="sm" c="dimmed">
                              От: {invitation.invited_by_nickname || invitation.invited_by_email || 'Неизвестный пользователь'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Приглашение отправлено {new Date(invitation.created_at).toLocaleDateString('ru-RU')}
                            </Text>
                          </Stack>
                          <Group gap="xs">
                            <Button 
                              size="sm" 
                              variant="light" 
                              color="green"
                              onClick={() => handleInvitationResponse(invitation.id, true)}
                            >
                              Принять
                            </Button>
                            <Button 
                              size="sm" 
                              variant="light" 
                              color="red"
                              onClick={() => handleInvitationResponse(invitation.id, false)}
                            >
                              Отклонить
                            </Button>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    У вас нет активных приглашений
                  </Text>
                )}
                <Title order={3}>Приглашения судьи</Title>
                <Stack gap="md">
                  {(judgeInvites ?? []).length === 0 && (
                    <Text c="dimmed">Приглашений нет</Text>
                  )}
                  {(judgeInvites ?? []).map((inv) => (
                    <Paper key={inv.id} p="md" withBorder>
                      <Group justify="space-between">
                        <Stack gap={4}>
                          <Text>Турнир: {inv.competition_title || inv.competition_id}</Text>
                          <Text size="sm" c="dimmed">Статус: {inv.status}</Text>
                        </Stack>
                        {inv.status === 'pending' && (
                          <Group gap="xs">
                            <Button size="sm" color="green" variant="light" onClick={async () => {
                              await respondJudgeInvite({ invitation_id: inv.id, accept: true, userId: user.id })
                              notifications.show({ color: 'green', message: 'Вы приняли приглашение судьи' })
                            }}>Принять</Button>
                            <Button size="sm" color="red" variant="light" onClick={async () => {
                              await respondJudgeInvite({ invitation_id: inv.id, accept: false, userId: user.id })
                              notifications.show({ color: 'gray', message: 'Вы отклонили приглашение' })
                            }}>Отклонить</Button>
                          </Group>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>

      {/* Create Team Modal */}
      <Modal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Новая команда">
        <CreateTeamForm onSubmit={handleCreateTeam} isSubmitting={isCreating} />
      </Modal>

      {/* Invite User Modal */}
      <Modal opened={isInviteModalOpen} onClose={() => {
        setIsInviteModalOpen(false)
        setSelectedTeam(null)
      }} title="Пригласить участника">
        {selectedTeam && (
          <InviteUserForm onSubmit={handleInviteUser} isSubmitting={isInviting} teamName={selectedTeam.name} />
        )}
      </Modal>

      {/* Delete Team Modal */}
      <Modal opened={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Удаление команды">
        {selectedTeam && (
          <Text>Вы уверены, что хотите удалить команду "{selectedTeam.name}"? Это действие необратимо.</Text>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Отмена</Button>
          <Button color="red" onClick={() => {
            if (selectedTeam) {
              handleDeleteTeam(selectedTeam)
              setIsDeleteModalOpen(false)
            }
          }}>Удалить</Button>
        </Group>
      </Modal>
    </Container>
  )
}

function CreateTeamForm({ onSubmit, isSubmitting }: { 
  onSubmit: (values: { name: string; description: string }) => void
  isSubmitting: boolean 
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notifications.show({ color: 'red', message: 'Введите название команды' })
      return
    }
    onSubmit({ name, description })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Название команды"
          placeholder="Введите название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Описание"
          placeholder="Описание команды (опционально)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Создать
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

function InviteUserForm({ onSubmit, isSubmitting, teamName }: { 
  onSubmit: (values: { email: string }) => void
  isSubmitting: boolean
  teamName: string
}) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      notifications.show({ color: 'red', message: 'Введите email пользователя' })
      return
    }
    onSubmit({ email })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Пригласить пользователя в команду "{teamName}"
        </Text>
        <TextInput
          label="Email пользователя"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Отправить приглашение
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
