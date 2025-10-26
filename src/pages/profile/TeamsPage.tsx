import { useState } from 'react'
import { Paper, Stack, Title, Text, Button, Group, Badge, Modal } from '@mantine/core'
import { IconPlus, IconUserPlus, IconCrown } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { useProfilePageVM } from '@/features/profile/model/useProfilePageVM'
import type { Team } from '@/features/teams/types'
import CreateTeamForm from './components/CreateTeamForm'
import InviteUserForm from './components/InviteUserForm'

export default function TeamsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const {
    userTeams,
    teamsLoading,
    createTeam,
    deleteTeam,
    createInvitation,
    isCreatingTeam: isCreating,
    isInvitingTeamMate: isInviting,
  } = useProfilePageVM(user?.id)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const handleCreateTeam = async (values: { name: string; description: string }) => {
    if (!user) return
    try {
      await createTeam({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        created_by: user.id,
      })
      setIsCreateModalOpen(false)
    } catch (e: any) {
      // Error handled in VM
    }
  }

  const handleDeleteTeam = (team: Team) => {
    if (team) {
      deleteTeam(team.id)
      setIsDeleteModalOpen(false)
    }
  }

  const handleInviteUser = async (values: { email: string }) => {
    if (!selectedTeam || !user) return
    try {
      await createInvitation({
        team_id: selectedTeam.id,
        invited_user_email: values.email.trim(),
        invited_by: user.id,
        role: 'member',
      })
      setIsInviteModalOpen(false)
      setSelectedTeam(null)
    } catch (e: any) {
      // Error handled in VM
    }
  }

  return (
    <>
      <Paper p="xl" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={2}>Мои команды</Title>
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
                          {team.created_by === user?.id ? 'Создатель' : 'Участник'}
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
      </Paper>

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
          <>
            <Text>Вы уверены, что хотите удалить команду "{selectedTeam.name}"? Это действие необратимо.</Text>
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Отмена</Button>
              <Button color="red" onClick={() => handleDeleteTeam(selectedTeam)}>Удалить</Button>
            </Group>
          </>
        )}
      </Modal>
    </>
  )
}
