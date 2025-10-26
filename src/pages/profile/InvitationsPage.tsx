import { Paper, Stack, Title, Text, Button, Group, Badge } from '@mantine/core'
import { useAuth } from '@/features/auth/hooks'
import { useProfilePageVM } from '@/features/profile/model/useProfilePageVM'
import { useUserInvitations } from '@/features/leagues/model/hooks'
import { notifications } from '@mantine/notifications'

export default function InvitationsPage() {
  const { user } = useAuth()
  
  const {
    userInvitations,
    invitationsLoading,
    judgeInvites,
    acceptInvitation,
    respondJudgeInvite,
  } = useProfilePageVM(user?.id)

  // Приглашения в лиги
  const { data: leagueInvitations, isLoading: leagueInvitationsLoading } = useUserInvitations(user?.email)

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    try {
      await acceptInvitation({ invitation_id: invitationId, accept })
    } catch (e: any) {
      // Error handled in VM
    }
  }

  return (
    <Paper p="xl" withBorder>
      <Stack gap="md">
        <Title order={2}>Приглашения в команды</Title>
        
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
        
        <Title order={2}>Приглашения в лиги</Title>
        
        {leagueInvitationsLoading ? (
          <Text>Загрузка приглашений в лиги...</Text>
        ) : leagueInvitations && leagueInvitations.length > 0 ? (
          <Stack gap="md">
            {leagueInvitations.map((invitation) => {
              const isExpired = new Date(invitation.expires_at) < new Date()
              const league = (invitation as any).leagues
              
              return (
                <Paper key={invitation.id} p="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Stack gap="xs">
                      <Text fw={500}>
                        Приглашение в лигу "{league?.name || 'Неизвестная лига'}"
                      </Text>
                      {league?.description && (
                        <Text size="sm" c="dimmed">
                          {league.description}
                        </Text>
                      )}
                      <Text size="sm" c="dimmed">
                        Сезон: {league?.season || 'Не указан'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Приглашение отправлено {new Date(invitation.created_at).toLocaleDateString('ru-RU')}
                      </Text>
                      <Text size="xs" c={isExpired ? 'red' : 'dimmed'}>
                        Истекает: {new Date(invitation.expires_at).toLocaleDateString('ru-RU')}
                      </Text>
                    </Stack>
                    <Group gap="xs">
                      {invitation.status === 'pending' && !isExpired ? (
                        <Button 
                          size="sm" 
                          color="green"
                          onClick={() => window.open(`/invitation/${invitation.token}`, '_blank')}
                        >
                          Открыть приглашение
                        </Button>
                      ) : invitation.status === 'accepted' ? (
                        <Badge color="green">Принято</Badge>
                      ) : invitation.status === 'declined' ? (
                        <Badge color="red">Отклонено</Badge>
                      ) : isExpired ? (
                        <Badge color="gray">Истекло</Badge>
                      ) : null}
                    </Group>
                  </Group>
                </Paper>
              )
            })}
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            У вас нет приглашений в лиги
          </Text>
        )}
        
        <Title order={2}>Приглашения судьи</Title>
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
                      if (!user) return
                      await respondJudgeInvite({ invitation_id: inv.id, accept: true, userId: user.id })
                    }}>Принять</Button>
                    <Button size="sm" color="red" variant="light" onClick={async () => {
                      if (!user) return
                      await respondJudgeInvite({ invitation_id: inv.id, accept: false, userId: user.id })
                    }}>Отклонить</Button>
                  </Group>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}
