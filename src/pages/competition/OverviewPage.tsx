import { useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { Paper, Stack, Title, Text, Badge, Group, Select, TextInput, Button } from '@mantine/core'
import { useState } from 'react'
import { useCompetition, useCompetitionFishKinds } from '@/features/competitions/hooks'
import { useCompetitionLeagues } from '@/features/leagues/hooks'
import { useTeamSizes } from '@/features/dicts/teamSizes/hooks'
import { useCompetitionFormats } from '@/features/dicts/formats/hooks'
import { useCompetitionRoles, useAssignCompetitionRole, useRemoveCompetitionRole } from '@/features/competitionRoles/hooks'
import { notifications } from '@mantine/notifications'

export default function OverviewPage() {
  const { competitionId } = useParams()
  const { user, role } = useAuth()
  const { data: competition } = useCompetition(competitionId!)
  const { data: competitionLeagues } = useCompetitionLeagues(competitionId!)
  const { data: teamSizes } = useTeamSizes()
  const { data: formats } = useCompetitionFormats()
  const { data: fishKindIds } = useCompetitionFishKinds(competitionId!)
  const { data: roles } = useCompetitionRoles(competitionId!)
  
  // Проверка прав на редактирование
  const canEdit = !!(
    user?.id && (
      role === 'admin' || 
      user.id === competition?.created_by
    )
  )

  const assign = useAssignCompetitionRole()
  const remove = useRemoveCompetitionRole(competitionId!)
  const [roleType, setRoleType] = useState<'organizer' | 'chief_judge' | 'secretary' | 'zone_judge'>('organizer')
  const [email, setEmail] = useState('')

  return (
    <Stack gap="md">
      <Paper p={{ base: 'md', md: 'xl' }} withBorder>
        <Stack gap="md">
          <Title order={{ base: 3, md: 2 }}>Информация о соревновании</Title>
          
          {competition?.starts_at && (
            <Group gap="xs">
              <Text size="sm" fw={600}>Дата:</Text>
              <Text size="sm">{new Date(competition.starts_at).toLocaleString('ru-RU')}</Text>
            </Group>
          )}
          
          {competition?.description && (
            <Group gap="xs" align="flex-start">
              <Text size="sm" fw={600}>Описание:</Text>
              <Text size="sm" style={{ flex: 1 }}>{competition.description}</Text>
            </Group>
          )}
          
          {competition?.format_id && (
            <Group gap="xs">
              <Text size="sm" fw={600}>Формат:</Text>
              <Text size="sm">{formats?.find(f => f.id === competition.format_id)?.name || competition.format_id}</Text>
            </Group>
          )}
          
          {competition?.team_size_id && (
            <Group gap="xs">
              <Text size="sm" fw={600}>Размер команды:</Text>
              <Text size="sm">{teamSizes?.find(s => s.id === competition.team_size_id)?.name || competition.team_size_id}</Text>
            </Group>
          )}
          
          {fishKindIds && fishKindIds.length > 0 && (
            <Group gap="xs" align="flex-start">
              <Text size="sm" fw={600}>Целевая рыба:</Text>
              <Text size="sm">{fishKindIds.join(', ')}</Text>
            </Group>
          )}
          
          {competitionLeagues && competitionLeagues.length > 0 && (
            <Group gap="xs" align="flex-start">
              <Text size="sm" fw={600}>Лиги:</Text>
              <Group gap="xs">
                {competitionLeagues.map((league) => (
                  <Badge key={league.id} variant="light" color="blue" size="sm">
                    {league.name}
                  </Badge>
                ))}
              </Group>
            </Group>
          )}
          
          {typeof competition?.lat === 'number' && typeof competition?.lng === 'number' && (
            <Group gap="xs">
              <Text size="sm" fw={600}>Координаты:</Text>
              <Text size="sm">{competition.lat.toFixed(6)}, {competition.lng.toFixed(6)}</Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {canEdit && (
        <Paper p={{ base: 'md', md: 'xl' }} withBorder>
          <Stack>
            <Title order={{ base: 4, md: 3 }}>Роли в соревновании</Title>
            <Stack gap="sm">
              <Select
                label="Роль"
                value={roleType}
                onChange={(v) => setRoleType((v as any) || 'organizer')}
                data={[
                  { value: 'organizer', label: 'Организатор' },
                  { value: 'chief_judge', label: 'Главный судья' },
                  { value: 'secretary', label: 'Секретарь' },
                  { value: 'zone_judge', label: 'Судья зоны' },
                ]}
              />
              <TextInput
                label="Email пользователя"
                placeholder="user@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <Button
                fullWidth
                onClick={async () => {
                  if (!email.trim()) return
                  try {
                    await assign.mutateAsync({ competition_id: competitionId!, email: email.trim(), role: roleType })
                    setEmail('')
                    notifications.show({ color: 'green', message: 'Роль назначена' })
                  } catch (e: any) {
                    notifications.show({ color: 'red', message: e?.message ?? 'Ошибка назначения роли' })
                  }
                }}
              >
                Назначить
              </Button>
            </Stack>
            <Stack gap="xs" mt="md">
              {(roles ?? []).map((r: any) => (
                <Group key={r.user_id + r.role} justify="space-between" p="xs" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 8 }}>
                  <Text size="sm">{r.user_nickname || r.user_email || r.user_id} — {r.role}</Text>
                  <Button size="xs" variant="light" color="red" onClick={() => remove.mutate({ user_id: r.user_id, role: r.role })}>
                    Удалить
                  </Button>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
