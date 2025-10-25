import { useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { Button, Group, Paper, Select, Stack, Tabs, Text, TextInput, NumberInput, Title, Badge } from '@mantine/core'
import { useState } from 'react'
import { useCompetition, useCompetitionFishKinds } from '@/features/competitions/hooks'
import { useCompetitionJudges, useCreateJudgeInvitation, useIsUserJudge } from '@/features/judges/hooks'
import { useCompetitionParticipants, useCreateResult, useResults, useUpdateResult, useDeleteResult } from '@/features/results/hooks'
import { useFishKinds } from '@/features/dicts/fish/hooks'
import { useCompetitionLeagues } from '@/features/leagues/hooks'
import { TeamsTab } from '@/features/teams/TeamsTab'
import { ZonesTab } from '@/features/zones/ZonesTab'
import { ScheduleTab } from '@/features/schedule/ScheduleTab'
import { useTeamSizes } from '@/features/dicts/teamSizes/hooks'
import { useCompetitionFormats } from '@/features/dicts/formats/hooks'
import { notifications } from '@mantine/notifications'
import { useSetParticipantCheckin } from '@/features/results/hooks'
import { useZones } from '@/features/zones/hooks'
import { useAssignJudge, useZoneJudges, useRoundAssignments } from '@/features/zones/assignments/hooks'
import { useRounds } from '@/features/schedule/hooks'
import { useCompetitionRoles, useAssignCompetitionRole, useRemoveCompetitionRole } from '@/features/competitionRoles/hooks'

export default function CompetitionPage() {
  const { competitionId } = useParams()
  const { user } = useAuth()
  const { data: competition } = useCompetition(competitionId!)
  const { data: competitionLeagues } = useCompetitionLeagues(competitionId!)
  const { data: teamSizes } = useTeamSizes()

  if (!competitionId) return <Text>Нет соревнования</Text>

  const [activeTab, setActiveTab] = useState<string>('overview')

  return (
    <Stack p="md">
      <Title order={2}>{competition?.title ?? 'Соревнование'}</Title>
      <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="overview">Обзор</Tabs.Tab>
          <Tabs.Tab value="teams">{(teamSizes?.find(s => s.id === competition?.team_size_id)?.size === 1) ? 'Участники' : 'Команды'}</Tabs.Tab>
          <Tabs.Tab value="judges">Судьи</Tabs.Tab>
          <Tabs.Tab value="results">Результаты</Tabs.Tab>
          <Tabs.Tab value="schedule">Расписание</Tabs.Tab>
          <Tabs.Tab value="zones">Зоны</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <InfoFromDrawer competitionId={competitionId} />
          <CompetitionRolesPanel competitionId={competitionId} />
        </Tabs.Panel>
        <Tabs.Panel value="teams" pt="md">
          {competition && (
            <TeamsTab competitionId={competition.id} userId={user?.id} />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="judges" pt="md">
          <JudgesTab competitionId={competitionId} currentUserId={user?.id} />
        </Tabs.Panel>
        <Tabs.Panel value="results" pt="md">
          <ResultsTab competitionId={competitionId} currentUserId={user?.id} competitionCreatorId={competition?.created_by ?? undefined} currentUserRole={(user as any)?.user_metadata?.role} />
        </Tabs.Panel>
        <Tabs.Panel value="schedule" pt="md">
          {competition && (
            <ScheduleTab competitionId={competition.id} />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="zones" pt="md">
          {competition && (
            <ZonesTab competitionId={competition.id} canEdit={!!(user?.id && (user?.id === competition.created_by || (user as any)?.user_metadata?.role === 'admin'))} active={activeTab === 'zones'} />
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

function ResultItem({ result, fishKinds, onSave, onDelete, canEdit }: {
  result: any
  fishKinds: { value: string; label: string }[]
  onSave: (input: { participant_user_id?: string; fish_kind_id?: string; weight_grams?: number | null; length_cm?: number | null }) => Promise<void>
  onDelete: () => Promise<void>
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [fishId, setFishId] = useState<string | null>(result.fish_kind_id)
  const [weight, setWeight] = useState<number | ''>(result.weight_grams ?? '')
  const [length, setLength] = useState<number | ''>(result.length_cm ?? '')

  return (
    <Paper p="md" withBorder>
      <Stack gap={8}>
        <Group justify="space-between">
          <Stack gap={2}>
            <Text fw={500}>{result.user_nickname || result.user_email || result.participant_user_id}</Text>
            {!isEditing ? (
              <Text size="sm" c="dimmed">{result.fish_name || result.fish_kind_id} {result.weight_grams ? `• ${result.weight_grams} г` : ''} {result.length_cm ? `• ${result.length_cm} см` : ''}</Text>
            ) : (
              <Group grow>
                <Select label="Вид рыбы" data={fishKinds} value={fishId} onChange={setFishId} searchable />
                <NumberInput label="Вес (г)" value={weight} onChange={(v) => setWeight(typeof v === 'number' ? v : v === '' ? '' : Number(v))} min={0} clampBehavior="strict" />
                <NumberInput label="Длина (см)" value={length} onChange={(v) => setLength(typeof v === 'number' ? v : v === '' ? '' : Number(v))} min={0} clampBehavior="strict" />
              </Group>
            )}
          </Stack>
          <Text size="sm" c="dimmed">{new Date(result.created_at).toLocaleString('ru-RU')}</Text>
        </Group>
        <Group justify="flex-end" gap="xs">
          {!isEditing ? (
            <>
              <Button size="xs" variant="light" onClick={() => setIsEditing(true)} disabled={!canEdit}>Изменить</Button>
              <Button size="xs" variant="outline" color="red" onClick={onDelete} disabled={!canEdit}>Удалить</Button>
            </>
          ) : (
            <>
              <Button size="xs" variant="subtle" onClick={() => {
                setFishId(result.fish_kind_id)
                setWeight(result.weight_grams ?? '')
                setLength(result.length_cm ?? '')
                setIsEditing(false)
              }}>Отмена</Button>
              <Button size="xs" onClick={async () => {
                await onSave({ fish_kind_id: fishId ?? undefined, weight_grams: weight === '' ? null : Number(weight), length_cm: length === '' ? null : Number(length) })
                setIsEditing(false)
              }} disabled={!canEdit}>Сохранить</Button>
            </>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}

function InfoFromDrawer({ competitionId }: { competitionId: string }) {
  const { data: competition } = useCompetition(competitionId)
  const { data: competitionLeagues } = useCompetitionLeagues(competitionId)
  const { data: teamSizes } = useTeamSizes()
  const { data: formats } = useCompetitionFormats()
  const { data: fishKindIds } = useCompetitionFishKinds(competitionId)
  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Title order={3}>{competition?.title}</Title>
        {competition?.starts_at && (
          <Text size="sm"><strong>Дата:</strong> {new Date(competition.starts_at).toLocaleString('ru-RU')}</Text>
        )}
        {competition?.description && (
          <Text size="sm"><strong>Описание:</strong> {competition.description}</Text>
        )}
        {competition?.format_id && (
          <Text size="sm"><strong>Формат:</strong> {formats?.find(f => f.id === competition.format_id)?.name || competition.format_id}</Text>
        )}
        {competition?.team_size_id && (
          <Text size="sm"><strong>Размер команды:</strong> {teamSizes?.find(s => s.id === competition.team_size_id)?.name || competition.team_size_id}</Text>
        )}
        {fishKindIds && fishKindIds.length > 0 && (
          <Text size="sm"><strong>Целевая рыба:</strong> {fishKindIds.join(', ')}</Text>
        )}
        {competitionLeagues && competitionLeagues.length > 0 && (
          <Group gap="xs">
            <Text size="sm"><strong>Лиги:</strong></Text>
            {competitionLeagues.map((league) => (
              <Badge key={league.id} variant="light" color="blue" size="sm">
                {league.name}
              </Badge>
            ))}
          </Group>
        )}
        {typeof competition?.lat === 'number' && typeof competition?.lng === 'number' && (
          <Text size="sm"><strong>Координаты:</strong> {competition.lat.toFixed(6)}, {competition.lng.toFixed(6)}</Text>
        )}
      </Stack>
    </Paper>
  )
}

function CompetitionRolesPanel({ competitionId }: { competitionId: string }) {
  const { data: roles } = useCompetitionRoles(competitionId)
  const assign = useAssignCompetitionRole()
  const remove = useRemoveCompetitionRole(competitionId)
  const [role, setRole] = useState<'organizer' | 'chief_judge' | 'secretary' | 'zone_judge'>('zone_judge')
  const [userId, setUserId] = useState('')
  return (
    <Paper p="md" withBorder mt="md">
      <Stack>
        <Text fw={600}>Роли в соревновании</Text>
        <Group>
          <Select maw={220} label="Роль" value={role} onChange={(v) => setRole((v as any) || 'zone_judge')} data={[
            { value: 'organizer', label: 'Организатор' },
            { value: 'chief_judge', label: 'Главный судья' },
            { value: 'secretary', label: 'Секретарь' },
            { value: 'zone_judge', label: 'Судья зоны' },
          ]} />
          <TextInput label="User ID" placeholder="id пользователя (временно, позже по email)" value={userId} onChange={(e) => setUserId(e.currentTarget.value)} maw={360} />
          <Button onClick={async () => {
            if (!userId) return
            await assign.mutateAsync({ competition_id: competitionId, user_id: userId, role })
          }}>Назначить</Button>
        </Group>
        <Stack>
          {(roles ?? []).map((r: any) => (
            <Group key={r.user_id + r.role} justify="space-between">
              <Text>{r.user_nickname || r.user_email || r.user_id} — {r.role}</Text>
              <Button size="xs" variant="light" color="red" onClick={() => remove.mutate({ user_id: r.user_id, role: r.role })}>Удалить</Button>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

function JudgesTab({ competitionId, currentUserId }: { competitionId: string; currentUserId?: string }) {
  const { data: judges } = useCompetitionJudges(competitionId)
  const { mutateAsync: inviteJudge, isPending } = useCreateJudgeInvitation()
  const { data: zones } = useZones(competitionId)
  const { data: zoneJudges } = useZoneJudges(competitionId)
  const { mutateAsync: assignJudge, isPending: assigning } = useAssignJudge(competitionId)
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<Record<string, string>>({})

  return (
    <Stack>
      <Paper p="md" withBorder>
        <Group align="end">
          <TextInput label="Email судьи" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <Button disabled={!email.trim() || !currentUserId} loading={isPending} onClick={async () => {
            try {
              await inviteJudge({ competition_id: competitionId, invited_user_email: email.trim(), invited_by: currentUserId! })
              setEmail('')
              notifications.show({ color: 'green', message: 'Приглашение отправлено' })
            } catch (e: any) {
              notifications.show({ color: 'red', message: e?.message ?? 'Ошибка' })
            }
          }}>Пригласить</Button>
        </Group>
      </Paper>

      <Stack>
        {(judges ?? []).map((j) => (
          <Paper key={j.user_id} p="md" withBorder>
            <Group justify="space-between">
              <Stack gap={2}>
                <Text fw={500}>{j.user_nickname || j.user_email || j.user_id}</Text>
                <Text size="sm" c="dimmed">Судья</Text>
              </Stack>
              <Group>
                <Select
                  placeholder="Зона"
                  data={(zones ?? []).map((z: any) => ({ value: z.id, label: z.name }))}
                  value={selected[j.user_id] ?? (zoneJudges?.find((zj) => zj.user_id === j.user_id)?.zone_id ?? null)}
                  onChange={(v) => setSelected((s) => ({ ...s, [j.user_id]: v || '' }))}
                  maw={260}
                />
                <Button size="xs" loading={assigning} disabled={!selected[j.user_id]} onClick={async () => {
                  if (!selected[j.user_id]) return
                  await assignJudge({ zone_id: selected[j.user_id], user_id: j.user_id })
                  setSelected((s) => ({ ...s, [j.user_id]: '' }))
                }}>Назначить</Button>
                <Badge variant="light">Добавлен</Badge>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}

function ResultsTab({ competitionId, currentUserId, competitionCreatorId, currentUserRole }: { competitionId: string; currentUserId?: string; competitionCreatorId?: string; currentUserRole?: string }) {
  const { data: participants } = useCompetitionParticipants(competitionId)
  const { data: fishKinds } = useFishKinds()
  const { data: results } = useResults(competitionId)
  const { mutateAsync: editResult } = useUpdateResult(competitionId)
  const { mutateAsync: removeResult } = useDeleteResult(competitionId)
  const { mutateAsync: addResult, isPending } = useCreateResult()
  const { data: isJudge } = useIsUserJudge(competitionId, currentUserId)
  const canEditAll = !!(currentUserId && (currentUserRole === 'admin' || currentUserId === competitionCreatorId || isJudge))
  const { mutateAsync: setCheckin } = useSetParticipantCheckin(competitionId)
  const { data: rounds } = useRounds(competitionId)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const activeRoundId = selectedRoundId || (rounds ?? []).find((r: any) => r.kind === 'round' && r.status === 'ongoing')?.id || null
  const { data: assignments } = useRoundAssignments(activeRoundId || '')
  const { data: zoneJudges } = useZoneJudges(competitionId)
  const judgeZoneId = (zoneJudges ?? []).find((z) => z.user_id === currentUserId)?.zone_id
  // Ограничение по зоне для судей будет добавлено позже (когда выберем активный тур в UI)

  const [participantId, setParticipantId] = useState<string | null>(null)
  const [fishId, setFishId] = useState<string | null>(null)
  const [weight, setWeight] = useState<number | ''>('')
  const [length, setLength] = useState<number | ''>('')

  return (
    <Stack>
      {/* выбор тура и фильтр по зоне судьи */}
      <Group>
        <Select
          label="Тур"
          placeholder="Активный"
          data={(rounds ?? []).filter((r: any) => r.kind === 'round').map((r: any) => ({ value: r.id, label: `${r.index}. ${r.title}` }))}
          value={selectedRoundId}
          onChange={setSelectedRoundId}
          maw={260}
        />
        {isJudge && judgeZoneId && <Badge variant="light">Ваша зона</Badge>}
      </Group>

      {canEditAll && (
      <Paper p="md" withBorder>
        <Group grow align="end">
          <Select
            label="Участник"
            data={(participants ?? [])
              .filter((p: import('@/features/results/types').CompetitionParticipant) => {
                if (!isJudge || !judgeZoneId || !activeRoundId || !assignments) return true
                const a = assignments.find((x: any) => x.participant_user_id === p.user_id)
                return a ? a.zone_id === judgeZoneId : false
              })
              .map((p: import('@/features/results/types').CompetitionParticipant) => ({ value: p.user_id, label: p.user_nickname || p.user_email || p.user_id }))}
            value={participantId}
            onChange={setParticipantId}
            searchable
          />
          <Select label="Вид рыбы" data={(fishKinds ?? []).map(f => ({ value: f.id, label: f.name }))} value={fishId} onChange={setFishId} searchable />
          <NumberInput label="Вес (г)" value={weight} onChange={(v) => setWeight(typeof v === 'number' ? v : v === '' ? '' : Number(v))} min={0} clampBehavior="strict" />
          <NumberInput label="Длина (см)" value={length} onChange={(v) => setLength(typeof v === 'number' ? v : v === '' ? '' : Number(v))} min={0} clampBehavior="strict" />
          <Group justify="flex-end" gap="sm">
            <Button disabled={!participantId || !fishId || !currentUserId} variant="light" loading={isPending} onClick={async () => {
              try {
                await addResult({ input: { competition_id: competitionId, participant_user_id: participantId!, fish_kind_id: fishId!, weight_grams: weight === '' ? null : Number(weight), length_cm: length === '' ? null : Number(length) }, createdBy: currentUserId! })
                // Очистить только значения, оставить выбранного участника и рыбу
                setLength(''); setWeight('')
                notifications.show({ color: 'green', message: 'Результат добавлен. Можно добавить ещё для этого участника' })
              } catch (e: any) {
                notifications.show({ color: 'red', message: e?.message ?? 'Ошибка добавления' })
              }
            }}>Добавить ещё рыбу</Button>
            <Button disabled={!participantId || !fishId || !currentUserId} loading={isPending} onClick={async () => {
              try {
                await addResult({ input: { competition_id: competitionId, participant_user_id: participantId!, fish_kind_id: fishId!, weight_grams: weight === '' ? null : Number(weight), length_cm: length === '' ? null : Number(length) }, createdBy: currentUserId! })
                setLength(''); setWeight(''); setFishId(null); setParticipantId(null)
                notifications.show({ color: 'green', message: 'Результат добавлен' })
              } catch (e: any) {
                notifications.show({ color: 'red', message: e?.message ?? 'Ошибка добавления' })
              }
            }}>Добавить</Button>
          </Group>
        </Group>
      </Paper>
      )}

      <Stack>
        {canEditAll && (
          <Paper p="md" withBorder>
            <Stack gap={6}>
              <Text fw={600}>Участники (чек-ин)</Text>
              <Group wrap="wrap" gap="xs">
                {(participants ?? []).map((p: import('@/features/results/types').CompetitionParticipant) => (
                  <Button key={p.user_id} size="xs" variant={p.checked_in ? 'filled' : 'light'} color={p.checked_in ? 'teal' : 'gray'} onClick={async () => {
                    try {
                      await setCheckin({ userId: p.user_id, checked: !p.checked_in })
                    } catch (e: any) {
                      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка чек-ина' })
                    }
                  }}>
                    {(p.user_nickname || p.user_email || p.user_id) + (p.checked_in ? ' • прибыл' : '')}
                  </Button>
                ))}
              </Group>
            </Stack>
          </Paper>
        )}
        {(results ?? []).map((r: import('@/features/results/types').CompetitionResult) => (
          <ResultItem
            key={r.id}
            result={r}
            fishKinds={fishKinds?.map(f => ({ value: f.id, label: f.name })) ?? []}
            canEdit={canEditAll}
            onSave={async (input) => {
              await editResult({ id: r.id, input })
              notifications.show({ color: 'green', message: 'Запись обновлена' })
            }}
            onDelete={async () => {
              await removeResult(r.id)
              notifications.show({ color: 'green', message: 'Запись удалена' })
            }}
          />
        ))}
      </Stack>
    </Stack>
  )
}


