import { useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { useCompetition } from '@/features/competitions/hooks'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import {
  Paper,
  Stack,
  Group,
  Select,
  NumberInput,
  Button,
  Text,
  Badge
} from '@mantine/core'
import { useCompetitionParticipants, useCreateResult, useResults, useUpdateResult, useDeleteResult } from '@/features/results/hooks'
import { useFishKinds } from '@/features/dicts/fish/hooks'
import { useSetParticipantCheckin } from '@/features/results/hooks'
import { useRounds } from '@/features/schedule/hooks'
import { useRoundAssignments } from '@/features/zones/assignments/hooks'
import { useZoneJudges } from '@/features/zones/assignments/hooks'
import { useIsUserJudge } from '@/features/judges/hooks'

function ResultItem({
  result,
  fishKinds,
  onSave,
  onDelete,
  canEdit
}: {
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
              <Text size="sm" c="dimmed">
                {result.fish_name || result.fish_kind_id} {result.weight_grams ? `• ${result.weight_grams} г` : ''} {result.length_cm ? `• ${result.length_cm} см` : ''}
              </Text>
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
        {canEdit && (
          <Group justify="flex-end" gap="xs">
            {!isEditing ? (
              <>
                <Button size="xs" variant="light" onClick={() => setIsEditing(true)}>Изменить</Button>
                <Button size="xs" variant="outline" color="red" onClick={onDelete}>Удалить</Button>
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
                }}>Сохранить</Button>
              </>
            )}
          </Group>
        )}
      </Stack>
    </Paper>
  )
}

export default function ResultsPage() {
  const { competitionId } = useParams()
  const { user, role } = useAuth()
  const { data: competition } = useCompetition(competitionId!)
  const { data: participants } = useCompetitionParticipants(competitionId!)
  const { data: fishKinds } = useFishKinds()
  const { data: results } = useResults(competitionId!)
  const { mutateAsync: editResult } = useUpdateResult(competitionId!)
  const { mutateAsync: removeResult } = useDeleteResult(competitionId!)
  const { mutateAsync: addResult, isPending } = useCreateResult()
  const { data: isJudge } = useIsUserJudge(competitionId!, user?.id)
  const { mutateAsync: setCheckin } = useSetParticipantCheckin(competitionId!)
  const { data: rounds } = useRounds(competitionId!)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const activeRoundId = selectedRoundId || (rounds ?? []).find((r: any) => r.kind === 'round' && r.status === 'ongoing')?.id || null
  const { data: assignments } = useRoundAssignments(activeRoundId || '')
  const { data: zoneJudges } = useZoneJudges(competitionId!)
  const judgeZoneId = (zoneJudges ?? []).find((z) => z.user_id === user?.id)?.zone_id

  const canEdit = !!(
    user?.id && (
      role === 'admin' || 
      user.id === competition?.created_by
    )
  )

  const canEditResults = !!(user?.id && (canEdit || role === 'organizer' || isJudge))

  const [participantId, setParticipantId] = useState<string | null>(null)
  const [fishId, setFishId] = useState<string | null>(null)
  const [weight, setWeight] = useState<number | ''>('')
  const [length, setLength] = useState<number | ''>('')

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Select
          label="Тур"
          placeholder="Активный"
          data={(rounds ?? []).filter((r: any) => r.kind === 'round').map((r: any) => ({ value: r.id, label: `${r.index}. ${r.title}` }))}
          value={selectedRoundId}
          onChange={setSelectedRoundId}
        />
        {isJudge && judgeZoneId && <Badge variant="light" size="lg">Ваша зона</Badge>}
      </Stack>

      {canEditResults && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Select
              label="Участник"
              data={(participants ?? [])
                .filter((p: any) => {
                  if (!isJudge || !judgeZoneId || !activeRoundId || !assignments) return true
                  const a = assignments.find((x: any) => x.participant_user_id === p.user_id)
                  return a ? a.zone_id === judgeZoneId : false
                })
                .map((p: any) => ({ value: p.user_id, label: p.user_nickname || p.user_email || p.user_id }))}
              value={participantId}
              onChange={setParticipantId}
              searchable
            />
            <Select label="Вид рыбы" data={(fishKinds ?? []).map(f => ({ value: f.id, label: f.name }))} value={fishId} onChange={setFishId} searchable />
            <Group grow>
              <NumberInput label="Вес (г)" value={weight} onChange={(v) => setWeight(typeof v === 'number' ? v : v === '' ? '' : Number(v))} min={0} clampBehavior="strict" />
              <NumberInput label="Длина (см)" value={length} onChange={(v) => setLength(typeof v === 'number' ? v : v === '' ? '' : Number(v))} min={0} clampBehavior="strict" />
            </Group>
            <Stack gap="xs">
              <Button
                fullWidth
                disabled={!participantId || !fishId || !user?.id}
                loading={isPending}
                onClick={async () => {
                  try {
                    await addResult({ input: { competition_id: competitionId!, participant_user_id: participantId!, fish_kind_id: fishId!, weight_grams: weight === '' ? null : Number(weight), length_cm: length === '' ? null : Number(length) }, createdBy: user!.id })
                    setLength('')
                    setWeight('')
                    setFishId(null)
                    setParticipantId(null)
                    notifications.show({ color: 'green', message: 'Результат добавлен' })
                  } catch (e: any) {
                    notifications.show({ color: 'red', message: e?.message ?? 'Ошибка добавления' })
                  }
                }}
              >
                Добавить
              </Button>
              <Button
                fullWidth
                variant="light"
                disabled={!participantId || !fishId || !user?.id}
                loading={isPending}
                onClick={async () => {
                  try {
                    await addResult({ input: { competition_id: competitionId!, participant_user_id: participantId!, fish_kind_id: fishId!, weight_grams: weight === '' ? null : Number(weight), length_cm: length === '' ? null : Number(length) }, createdBy: user!.id })
                    setLength('')
                    setWeight('')
                    notifications.show({ color: 'green', message: 'Результат добавлен. Можно добавить ещё для этого участника' })
                  } catch (e: any) {
                    notifications.show({ color: 'red', message: e?.message ?? 'Ошибка добавления' })
                  }
                }}
              >
                Добавить ещё рыбу
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Stack>
        {canEditResults && (
          <Paper p="md" withBorder>
            <Stack gap={6}>
              <Text fw={600}>Участники (чек-ин)</Text>
              <Group wrap="wrap" gap="xs">
                {(participants ?? []).map((p: any) => (
                  <Button
                    key={p.user_id}
                    size="xs"
                    variant={p.checked_in ? 'filled' : 'light'}
                    color={p.checked_in ? 'teal' : 'gray'}
                    onClick={async () => {
                      try {
                        await setCheckin({ userId: p.user_id, checked: !p.checked_in })
                      } catch (e: any) {
                        notifications.show({ color: 'red', message: e?.message ?? 'Ошибка чек-ина' })
                      }
                    }}
                  >
                    {(p.user_nickname || p.user_email || p.user_id) + (p.checked_in ? ' • прибыл' : '')}
                  </Button>
                ))}
              </Group>
            </Stack>
          </Paper>
        )}
        {(results ?? []).map((r: any) => (
          <ResultItem
            key={r.id}
            result={r}
            fishKinds={fishKinds?.map(f => ({ value: f.id, label: f.name })) ?? []}
            canEdit={canEditResults}
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
