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
  Checkbox,
} from '@mantine/core'
import { IconUserPlus, IconCrown, IconInfoCircle, IconTrophy } from '@tabler/icons-react'
import { useCompetitionTeams, useTeams, useRegisterTeamForCompetition, useTeamMembers, useCreateTeamInvitation, useUserTeamRoles, useUpdateTeamParticipationStatus, useRegisterSoloForCompetition, useSoloParticipants, useUpdateSoloParticipationStatus } from './hooks'
import { useCompetition } from '../competitions/hooks'
import { useTeamSizes } from '../dicts/teamSizes/hooks'
import { notifications } from '@mantine/notifications'
import type { Team } from './types'
import { useTeamMembers as useTeamMembersHook } from './hooks'

type Props = {
  competitionId: string
  userId?: string
}

export function TeamsTab({ competitionId, userId }: Props) {
  const { data: competition } = useCompetition(competitionId)
  const { data: teamSizes } = useTeamSizes()
  const { data: competitionTeams, isLoading: competitionTeamsLoading } = useCompetitionTeams(competitionId)
  const { data: soloParticipants } = useSoloParticipants(competitionId)
  const { data: allTeams, isLoading: allTeamsLoading } = useTeams()
  const { mutateAsync: registerTeam, isPending: isRegistering } = useRegisterTeamForCompetition()
  const { mutateAsync: updateParticipationStatus, isPending: isUpdatingParticipation } = useUpdateTeamParticipationStatus()
  const { mutateAsync: createInvitation, isPending: isInviting } = useCreateTeamInvitation()
  const { mutateAsync: registerSolo } = useRegisterSoloForCompetition()
  const { mutateAsync: updateSoloStatus, isPending: isUpdatingSolo } = useUpdateSoloParticipationStatus()

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isSelectParticipantsOpen, setIsSelectParticipantsOpen] = useState(false)
  const [participantsTeamId, setParticipantsTeamId] = useState<string | null>(null)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  const handleInviteUser = async (values: { email: string }) => {
    if (!selectedTeam || !userId) return
    try {
      await createInvitation({
        team_id: selectedTeam.id,
        invited_user_email: values.email.trim(),
        invited_by: userId, // Добавляем ID текущего пользователя
        role: 'member',
      })
      notifications.show({ color: 'green', message: 'Приглашение отправлено' })
      setIsInviteModalOpen(false)
      setSelectedTeam(null)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка отправки приглашения' })
    }
  }

  const teamSizeLimit = teamSizes?.find(s => s.id === competition?.team_size_id)?.size

  const handleRegisterTeam = async (teamId: string) => {
    try {
      if (teamSizeLimit && teamSizeLimit > 1) {
        setParticipantsTeamId(teamId)
        setSelectedParticipants([])
        setIsSelectParticipantsOpen(true)
        return
      }
      await registerTeam({ team_id: teamId, competition_id: competitionId, participant_user_ids: userId ? [userId] : [] })
      notifications.show({ color: 'green', message: 'Команда зарегистрирована в соревновании' })
      setIsRegisterModalOpen(false)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка регистрации команды' })
    }
  }

  const teamIds = competitionTeams?.map(t => t.id) || []
  const { data: userRolesMap } = useUserTeamRoles(userId, teamIds)

  const isLoading = competitionTeamsLoading || allTeamsLoading

  if (isLoading) return <Text>Загрузка команд...</Text>

  // Получаем команды пользователя для проверки возможности регистрации
  const userTeams = allTeams?.filter(team => team.created_by === userId) || []
  const registeredTeamIds = competitionTeams?.map(team => team.id) || []

  const isSolo = teamSizeLimit === 1
  const isUserSoloRegistered = !!(isSolo && userId && soloParticipants?.some(p => p.user_id === userId && (p.status === 'registered' || p.status === 'confirmed')))
  const capacity = competition?.max_slots ?? null
  const currentSoloCount = (soloParticipants ?? []).filter(p => p.status === 'registered' || p.status === 'confirmed').length
  const currentTeamCount = (competitionTeams ?? []).length
  const isFull = capacity != null ? (isSolo ? currentSoloCount >= capacity : currentTeamCount >= capacity) : false

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4}>{isSolo ? 'Участники соревнования' : 'Команды соревнования'}</Title>
        <Group gap="xs">
          {isSolo && !isUserSoloRegistered && !isFull && (
            <Button 
              leftSection={<IconTrophy size={16} />} 
              variant="light"
              size="sm"
              onClick={async () => {
                if (!userId) return
                try {
                  await registerSolo({ user_id: userId, competition_id: competitionId })
                  notifications.show({ color: 'green', message: 'Вы зарегистрированы (соло)' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка регистрации' })
                }
              }}
            >
              Зарегистрироваться (соло)
            </Button>
          )}
          {isSolo && isUserSoloRegistered && userId && (
            <Button
              variant="outline"
              color="red"
              size="sm"
              onClick={async () => {
                try {
                  await updateSoloStatus({ user_id: userId, competition_id: competitionId, status: 'rejected' })
                  notifications.show({ color: 'green', message: 'Вы сняты с регистрации' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка снятия с регистрации' })
                }
              }}
              loading={isUpdatingSolo}
            >
              Снять себя с регистрации
            </Button>
          )}
          {teamSizeLimit !== 1 && !isFull && (
            <Button 
              leftSection={<IconTrophy size={16} />} 
              variant="light"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              disabled={userTeams.length === 0}
            >
              Зарегистрировать команду
            </Button>
          )}
        </Group>
      </Group>

      {teamSizeLimit !== 1 && (
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            Здесь вы можете просматривать команды, участвующие в соревновании, и регистрировать свои команды. 
            Для создания команды перейдите в профиль пользователя.
          </Text>
        </Alert>
      )}

      {isSolo && (
        <Stack gap="md">
          {(soloParticipants && soloParticipants.length > 0) ? (
            soloParticipants.map((p) => (
              <Paper key={p.user_id} p="md" withBorder>
                <Group justify="space-between">
                  <Stack gap={4}>
                    <Text fw={500}>{p.user_nickname || p.user_email || p.user_id}</Text>
                    <Text size="xs" c="dimmed">Статус: {p.status === 'registered' ? 'Зарегистрирован' : p.status === 'confirmed' ? 'Подтверждён' : 'Снят'}</Text>
                  </Stack>
                </Group>
              </Paper>
            ))
          ) : (
            <Text c="dimmed" ta="center" py="xl">Пока нет участников. Зарегистрируйтесь первым!</Text>
          )}
          {capacity != null && (
            <Text size="sm" c="dimmed" ta="center">{`Зарегистрировано: ${currentSoloCount}${capacity != null ? ` / ${capacity}` : ''}`}</Text>
          )}
        </Stack>
      )}

      {teamSizeLimit !== 1 && (
        (competitionTeams && competitionTeams.length > 0 ? (
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
                    {(team.created_by === userId || userRolesMap?.[team.id] === 'captain' || userRolesMap?.[team.id] === 'creator') && (
                      <Button 
                        size="xs"
                        variant="outline"
                        color="red"
                        onClick={() => updateParticipationStatus({ teamId: team.id, competitionId, input: { status: 'rejected' } })}
                        loading={isUpdatingParticipation}
                      >
                        Снять с регистрации
                      </Button>
                    )}
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
        ))
      )}
      {teamSizeLimit !== 1 && capacity != null && (
        <Text size="sm" c="dimmed" ta="center">{`Зарегистрировано команд: ${currentTeamCount}${capacity != null ? ` / ${capacity}` : ''}`}</Text>
      )}

      {/* Register Team Modal */}
      <Modal opened={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Зарегистрировать команду">
        <RegisterTeamForm 
          userTeams={userTeams.filter(team => !registeredTeamIds.includes(team.id))}
          onRegister={handleRegisterTeam}
          isSubmitting={isRegistering}
        />
      </Modal>

      {/* Select Participants Modal */}
      <Modal opened={isSelectParticipantsOpen} onClose={() => setIsSelectParticipantsOpen(false)} title="Выбор участников">
        {participantsTeamId && (
          <SelectParticipantsForm
            teamId={participantsTeamId}
            maxParticipants={teamSizes?.find(s => s.id === competition?.team_size_id)?.size ?? 2}
            selected={selectedParticipants}
            onChangeSelected={setSelectedParticipants}
            onSubmit={async () => {
              try {
                if (selectedParticipants.length === 0) {
                  notifications.show({ color: 'red', message: 'Выберите участников' })
                  return
                }
                await registerTeam({ team_id: participantsTeamId, competition_id: competitionId, participant_user_ids: selectedParticipants })
                notifications.show({ color: 'green', message: 'Команда зарегистрирована' })
                setIsSelectParticipantsOpen(false)
                setIsRegisterModalOpen(false)
              } catch (e: any) {
                notifications.show({ color: 'red', message: e?.message ?? 'Ошибка регистрации' })
              }
            }}
            submitting={isRegistering}
          />
        )}
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

function SelectParticipantsForm({
  teamId,
  maxParticipants,
  selected,
  onChangeSelected,
  onSubmit,
  submitting,
}: {
  teamId: string
  maxParticipants: number
  selected: string[]
  onChangeSelected: (ids: string[]) => void
  onSubmit: () => void
  submitting: boolean
}) {
  const { data: members, isLoading } = useTeamMembersHook(teamId)

  if (isLoading) return <Text size="sm">Загрузка участников...</Text>

  const toggle = (id: string) => {
    if (selected.includes(id)) onChangeSelected(selected.filter(i => i !== id))
    else if (selected.length < maxParticipants) onChangeSelected([...selected, id])
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">Выберите до {maxParticipants} участников:</Text>
      {members?.map(m => (
        <Checkbox
          key={m.user_id}
          label={m.user_nickname || m.user_email || m.user_id}
          checked={selected.includes(m.user_id)}
          onChange={() => toggle(m.user_id)}
        />
      ))}
      <Group justify="flex-end">
        <Button onClick={onSubmit} loading={submitting}>Подтвердить</Button>
      </Group>
    </Stack>
  )
}
