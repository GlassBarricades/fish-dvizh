import { useState } from 'react'
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  Badge,
  Divider,
  Paper,
  Alert,
} from '@mantine/core'
import { IconUserPlus, IconCrown, IconInfoCircle, IconTrophy } from '@tabler/icons-react'
import { useCompetitionTeams, useTeams, useRegisterTeamForCompetition, useTeamMembers, useCreateTeamInvitation } from './hooks'
import { notifications } from '@mantine/notifications'
import type { Team } from './types'

type Props = {
  competitionId: string
  userId?: string
}

export function TeamsTab({ competitionId, userId }: Props) {
  const { data: competitionTeams, isLoading: competitionTeamsLoading } = useCompetitionTeams(competitionId)
  const { data: allTeams, isLoading: allTeamsLoading } = useTeams()
  const { mutateAsync: registerTeam, isPending: isRegistering } = useRegisterTeamForCompetition()
  const { mutateAsync: createInvitation, isPending: isInviting } = useCreateTeamInvitation()

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  const handleInviteUser = async (values: { email: string }) => {
    if (!selectedTeam || !userId) return
    try {
      await createInvitation({
        team_id: selectedTeam.id,
        invited_user_email: values.email.trim(),
        invited_by: userId, // Добавляем ID текущего пользователя
      })
      notifications.show({ color: 'green', message: 'Приглашение отправлено' })
      setIsInviteModalOpen(false)
      setSelectedTeam(null)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка отправки приглашения' })
    }
  }

  const handleRegisterTeam = async (teamId: string) => {
    try {
      await registerTeam({
        team_id: teamId,
        competition_id: competitionId,
      })
      notifications.show({ color: 'green', message: 'Команда зарегистрирована в соревновании' })
      setIsRegisterModalOpen(false)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка регистрации команды' })
    }
  }

  const isLoading = competitionTeamsLoading || allTeamsLoading

  if (isLoading) return <Text>Загрузка команд...</Text>

  // Получаем команды пользователя для проверки возможности регистрации
  const userTeams = allTeams?.filter(team => team.created_by === userId) || []
  const registeredTeamIds = competitionTeams?.map(team => team.id) || []

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4}>Команды соревнования</Title>
        <Button 
          leftSection={<IconTrophy size={16} />} 
          variant="light"
          size="sm"
          onClick={() => setIsRegisterModalOpen(true)}
          disabled={userTeams.length === 0}
        >
          Зарегистрировать команду
        </Button>
      </Group>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <Text size="sm">
          Здесь вы можете просматривать команды, участвующие в соревновании, и регистрировать свои команды. 
          Для создания команды перейдите в профиль пользователя.
        </Text>
      </Alert>

      {competitionTeams && competitionTeams.length > 0 ? (
        <Stack gap="md">
          {competitionTeams.map((team: Team) => (
            <Paper key={team.id} p="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Text fw={500}>{team.name}</Text>
                  {team.created_by === userId && (
                    <Badge variant="light" color="blue" size="sm">
                      <IconCrown size={12} style={{ marginRight: 4 }} />
                      Ваша команда
                    </Badge>
                  )}
                </Group>
                <Group gap="xs">
                  {team.created_by === userId && (
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
                  )}
                </Group>
              </Group>
              
              {team.description && (
                <Text size="sm" c="dimmed" mb="xs">
                  {team.description}
                </Text>
              )}
              
              <TeamMembersList teamId={team.id} />
            </Paper>
          ))}
        </Stack>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          Пока нет команд в соревновании. Зарегистрируйте свою команду!
        </Text>
      )}

      {/* Register Team Modal */}
      <Modal opened={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Зарегистрировать команду">
        <RegisterTeamForm 
          userTeams={userTeams.filter(team => !registeredTeamIds.includes(team.id))}
          onRegister={handleRegisterTeam}
          isSubmitting={isRegistering}
        />
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
    </Stack>
  )
}

function RegisterTeamForm({ 
  userTeams, 
  onRegister, 
  isSubmitting 
}: { 
  userTeams: Team[]
  onRegister: (teamId: string) => void
  isSubmitting: boolean 
}) {
  if (userTeams.length === 0) {
    return (
      <Stack gap="md">
        <Text c="dimmed" ta="center">
          У вас нет команд для регистрации или все команды уже зарегистрированы
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Создайте команду в профиле пользователя
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Выберите команду для регистрации в соревновании:
      </Text>
      {userTeams.map((team: Team) => (
        <Paper key={team.id} p="md" withBorder>
          <Group justify="space-between">
            <Stack gap="xs">
              <Text fw={500}>{team.name}</Text>
              {team.description && (
                <Text size="sm" c="dimmed">{team.description}</Text>
              )}
            </Stack>
            <Button 
              size="sm" 
              variant="light" 
              color="blue"
              onClick={() => onRegister(team.id)}
              loading={isSubmitting}
            >
              Зарегистрировать
            </Button>
          </Group>
        </Paper>
      ))}
    </Stack>
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

function TeamMembersList({ teamId }: { teamId: string }) {
  const { data: members, isLoading } = useTeamMembers(teamId)

  if (isLoading) return <Text size="sm">Загрузка участников...</Text>

  if (!members || members.length === 0) {
    return <Text size="sm" c="dimmed">Нет участников</Text>
  }

  return (
    <Stack gap="xs">
      <Divider />
      <Text size="sm" fw={500}>Участники:</Text>
      {members.map((member) => (
        <Group key={member.id} gap="xs">
          <Badge 
            variant="light" 
            color={member.role === 'captain' ? 'blue' : 'gray'}
            size="sm"
          >
            {member.role === 'captain' ? 'Капитан' : 'Участник'}
          </Badge>
          <Text size="sm">
            {member.user_nickname || member.user_email || 'Неизвестный пользователь'}
          </Text>
        </Group>
      ))}
    </Stack>
  )
}
