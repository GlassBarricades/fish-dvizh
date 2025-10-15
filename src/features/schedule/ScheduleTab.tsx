import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Group, Paper, Stack, Text, TextInput, NumberInput, SegmentedControl, Checkbox } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import dayjs from 'dayjs'
import { useCreateRound, useDeleteRound, useRounds, useUpdateRound } from './hooks'
import { useZones } from '../zones/hooks'
import { useDrawAllAssignments, useRoundAssignments, usePreviewAllAssignments, useApplyAssignments, usePreviewAllAssignmentsWithLocks } from '../zones/assignments/hooks'
import type { LockedAssignment } from '../zones/assignments/types'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { useAggregatedStandings, useResultsInRange, useTeamStandingsByPlaces } from '../results/hooks'

export function ScheduleTab({ competitionId }: { competitionId: string }) {
  const { data: rounds } = useRounds(competitionId)
  const { mutateAsync: createRound, isPending } = useCreateRound()
  const { mutateAsync: delRound } = useDeleteRound()
  const { mutateAsync: updRound } = useUpdateRound()
  const { data: zones } = useZones(competitionId)
  const drawAll = useDrawAllAssignments()
  const preview = usePreviewAllAssignments(competitionId)
  const previewWithLocks = usePreviewAllAssignmentsWithLocks(competitionId)
  const applyAssign = useApplyAssignments()
  const previewUserIds = useMemo(
    () => Array.from(new Set((preview.data ?? []).map((a) => a.participant_user_id))),
    [preview.data]
  )
  const previewUsersQuery = useQuery({
    queryKey: ['preview-assign-users', competitionId, previewUserIds],
    queryFn: async () => {
      if (previewUserIds.length === 0) return {}
      const { data: users, error } = await supabase
        .from('users')
        .select('id,email,raw_user_meta_data')
        .in('id', previewUserIds)
      if (error) throw error
      return Object.fromEntries(
        (users || []).map((u: any) => [u.id, { email: u.email, nickname: u.raw_user_meta_data?.nickname }])
      ) as Record<string, { email?: string; nickname?: string }>
    },
    enabled: previewUserIds.length > 0,
  })

  const [title, setTitle] = useState('Тур')
  const [index, setIndex] = useState<number | ''>(rounds?.length ? rounds.length + 1 : 1)
  const [startAt, setStartAt] = useState<string | null>(dayjs().toISOString())
  const [endAt, setEndAt] = useState<string | null>(dayjs().add(2, 'hour').toISOString())
  const [kind, setKind] = useState<'round' | 'registration' | 'break'>('round')
  const [nowTs, setNowTs] = useState<number>(Date.now())

  // Конструктор расписания
  const [genStartAt, setGenStartAt] = useState<string | null>(dayjs().toISOString())
  const [genRegistrationMin, setGenRegistrationMin] = useState<number>(30)
  const [genRoundsCount, setGenRoundsCount] = useState<number>(2)
  const [genRoundMin, setGenRoundMin] = useState<number>(120)
  const [genWithTransitions, setGenWithTransitions] = useState<boolean>(true)
  const [genTransitionMin, setGenTransitionMin] = useState<number>(15)
  const [genWithResults, setGenWithResults] = useState<boolean>(true)
  const [genResultsMin, setGenResultsMin] = useState<number>(20)
  const [genWithAwarding, setGenWithAwarding] = useState<boolean>(true)
  const [genAwardingMin, setGenAwardingMin] = useState<number>(20)
  const [genMiniPerRound, setGenMiniPerRound] = useState<number>(0)
  const [genMiniRoundMin, setGenMiniRoundMin] = useState<number>(30)
  const [genMiniBreakMin, setGenMiniBreakMin] = useState<number>(10)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [shiftByMin, setShiftByMin] = useState<number>(15)
  const [locked, setLocked] = useState<LockedAssignment[]>([])

  const lockedQuery = previewWithLocks.useQuery(locked)
  const currentPreview = locked.length > 0 ? lockedQuery : preview

  function toggleLock(roundId: string, userId: string, zoneId?: string) {
    if (!zoneId) return
    const key = `${roundId}::${userId}`
    const exists = locked.find(l => `${l.round_id}::${l.participant_user_id}` === key)
    if (exists) {
      setLocked(locked.filter(l => `${l.round_id}::${l.participant_user_id}` !== key))
    } else {
      setLocked([...locked, { round_id: roundId, participant_user_id: userId, zone_id: zoneId }])
    }
  }

  async function shiftAllBlocks(deltaMinutes: number) {
    if (!rounds || rounds.length === 0) return
    const ops = rounds.map((r) => {
      const s = dayjs(r.start_at).add(deltaMinutes, 'minute').toISOString()
      const e = dayjs(r.end_at).add(deltaMinutes, 'minute').toISOString()
      return updRound({ id: r.id, input: { start_at: s, end_at: e } })
    })
    await Promise.all(ops)
    notifications.show({ color: 'green', message: `Сдвинуто на ${deltaMinutes > 0 ? '+' : ''}${deltaMinutes} мин` })
  }

  async function moveRound(rid: string, direction: 'up' | 'down') {
    if (!rounds) return
    const idx = rounds.findIndex(r => r.id === rid)
    if (idx === -1) return
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= rounds.length) return
    const a = rounds[idx]
    const b = rounds[swapWith]
    await Promise.all([
      updRound({ id: a.id, input: { index: b.index } }),
      updRound({ id: b.id, input: { index: a.index } }),
    ])
    notifications.show({ color: 'green', message: 'Порядок обновлён' })
  }

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  function formatRemaining(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  const canCreate = title.trim() && index !== '' && startAt && endAt

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Text fw={600}>Конструктор расписания</Text>
          <Group grow>
            <DateTimePicker label="Старт первого блока" value={genStartAt} onChange={setGenStartAt} popoverProps={{ withinPortal: true }} />
            <NumberInput label="Регистрация, мин" min={0} value={genRegistrationMin} onChange={(v) => setGenRegistrationMin(Number(v) || 0)} clampBehavior="strict" />
          </Group>
          <Group grow>
            <NumberInput label="Кол-во туров" min={1} value={genRoundsCount} onChange={(v) => setGenRoundsCount(Math.max(1, Number(v) || 1))} clampBehavior="strict" />
            <NumberInput label="Длительность тура, мин" min={1} value={genRoundMin} onChange={(v) => setGenRoundMin(Math.max(1, Number(v) || 1))} clampBehavior="strict" />
          </Group>
          <Group grow>
            <NumberInput label="Минитуров на тур (0 — нет)" min={0} value={genMiniPerRound} onChange={(v) => setGenMiniPerRound(Math.max(0, Number(v) || 0))} clampBehavior="strict" />
            <NumberInput label="Минитур, мин" min={1} disabled={genMiniPerRound === 0} value={genMiniRoundMin} onChange={(v) => setGenMiniRoundMin(Math.max(1, Number(v) || 1))} clampBehavior="strict" />
            <NumberInput label="Перерыв между минитурами, мин" min={0} disabled={genMiniPerRound === 0} value={genMiniBreakMin} onChange={(v) => setGenMiniBreakMin(Math.max(0, Number(v) || 0))} clampBehavior="strict" />
          </Group>
          <Group>
            <Checkbox checked={genWithTransitions} onChange={(e) => setGenWithTransitions(e.currentTarget.checked)} label="Переходы между зонами" />
            <NumberInput w={160} label="Переход, мин" min={0} disabled={!genWithTransitions} value={genTransitionMin} onChange={(v) => setGenTransitionMin(Math.max(0, Number(v) || 0))} clampBehavior="strict" />
          </Group>
          <Group>
            <Checkbox checked={genWithResults} onChange={(e) => setGenWithResults(e.currentTarget.checked)} label="Подведение итогов" />
            <NumberInput w={160} label="Итоги, мин" min={0} disabled={!genWithResults} value={genResultsMin} onChange={(v) => setGenResultsMin(Math.max(0, Number(v) || 0))} clampBehavior="strict" />
          </Group>
          <Group>
            <Checkbox checked={genWithAwarding} onChange={(e) => setGenWithAwarding(e.currentTarget.checked)} label="Награждение" />
            <NumberInput w={160} label="Награждение, мин" min={0} disabled={!genWithAwarding} value={genAwardingMin} onChange={(v) => setGenAwardingMin(Math.max(0, Number(v) || 0))} clampBehavior="strict" />
          </Group>
          <Group justify="space-between" wrap="nowrap">
            <Group>
              <Button variant="default" loading={preview.isLoading} onClick={() => preview.refetch()}>Предпросмотр жеребьёвки</Button>
              <Button variant="light" loading={drawAll.isPending} disabled={!zones || zones.length === 0} onClick={() => drawAll.mutate({ competition_id: competitionId })}>Жеребьёвка по всем турам</Button>
              <NumberInput w={140} label="Сдвиг, мин" value={shiftByMin} onChange={(v) => setShiftByMin(Number(v) || 0)} />
              <Button variant="default" onClick={() => shiftAllBlocks(shiftByMin)}>Сдвинуть все</Button>
              <Button variant="subtle" component="a" href={`/scoreboard/${competitionId}`} target="_blank">Открыть табло</Button>
              <Button variant="subtle" component="a" href={`/results/${competitionId}`} target="_blank">Публичные итоги</Button>
            </Group>
            <Button variant="light" color="red" disabled={!rounds || (rounds?.length ?? 0) === 0} onClick={async () => {
              if (!rounds || rounds.length === 0) return
              for (const r of rounds) {
                await delRound({ id: r.id, competitionId })
              }
            }}>Очистить расписание</Button>
            <Button loading={isGenerating} disabled={!genStartAt} onClick={async () => {
              if (!genStartAt) return
              try {
                setIsGenerating(true)
                const blocks: { title: string; kind: 'round' | 'registration' | 'break'; minutes: number }[] = []
                if (genRegistrationMin > 0) {
                  blocks.push({ title: 'Регистрация и подтверждение участия', kind: 'registration', minutes: genRegistrationMin })
                }
                for (let i = 1; i <= genRoundsCount; i++) {
                  if (genMiniPerRound > 0) {
                    for (let j = 1; j <= genMiniPerRound; j++) {
                      blocks.push({ title: `Тур ${i}.${j}`, kind: 'round', minutes: genMiniRoundMin })
                      if (j < genMiniPerRound && genMiniBreakMin > 0) {
                        blocks.push({ title: 'Короткий перерыв', kind: 'break', minutes: genMiniBreakMin })
                      }
                    }
                  } else {
                    blocks.push({ title: `Тур ${i}`, kind: 'round', minutes: genRoundMin })
                  }
                  if (i < genRoundsCount && genWithTransitions && genTransitionMin > 0) {
                    blocks.push({ title: 'Переход между зонами', kind: 'break', minutes: genTransitionMin })
                  }
                }
                if (genWithResults && genResultsMin > 0) {
                  blocks.push({ title: 'Подведение итогов', kind: 'break', minutes: genResultsMin })
                }
                if (genWithAwarding && genAwardingMin > 0) {
                  blocks.push({ title: 'Награждение', kind: 'break', minutes: genAwardingMin })
                }

                let cursor = dayjs(genStartAt)
                const baseIndex = (rounds?.length || 0) + 1
                for (let k = 0; k < blocks.length; k++) {
                  const b = blocks[k]
                  const s = cursor.toISOString()
                  const e = cursor.add(b.minutes, 'minute').toISOString()
                  await createRound({ competition_id: competitionId, index: baseIndex + k, title: b.title, start_at: s, end_at: e, kind: b.kind })
                  cursor = dayjs(e)
                }
              } finally {
                setIsGenerating(false)
              }
            }}>Сгенерировать расписание</Button>
          </Group>
        </Stack>
      </Paper>
      {currentPreview.data && currentPreview.data.length > 0 && (
        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Text fw={600}>Матрица жеребьёвки (предпросмотр)</Text>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Участник</th>
                    {(rounds ?? []).filter(r => r.kind === 'round').map((r) => (
                      <th key={r.id} style={{ textAlign: 'left' }}>Тур {r.index}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(currentPreview.data.map((a: any) => a.participant_user_id))).map((uid) => (
                    <tr key={uid}>
                      <td>{previewUsersQuery.data?.[uid]?.nickname || previewUsersQuery.data?.[uid]?.email || uid}</td>
                      {(rounds ?? []).filter(r => r.kind === 'round').map((r) => {
                        const a = currentPreview.data!.find((x: any) => x.participant_user_id === uid && x.round_id === r.id)
                        const zoneLabel = zones?.find((z: any) => z.id === a?.zone_id)?.name || a?.zone_id || '-'
                        const isLocked = locked.some(l => l.round_id === r.id && l.participant_user_id === uid)
                        return (
                          <td key={r.id} style={{ cursor: a?.zone_id ? 'pointer' : 'default', background: isLocked ? 'rgba(255, 200, 0, 0.2)' : undefined }} onClick={() => toggleLock(r.id, uid, a?.zone_id)}>
                            {zoneLabel}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => (locked.length > 0 ? lockedQuery.refetch() : preview.refetch())}>Перегенерировать</Button>
              <Button variant="default" color="gray" disabled={locked.length === 0} onClick={() => setLocked([])}>Очистить фиксации</Button>
              <Button variant="light" loading={applyAssign.isPending} onClick={() => applyAssign.mutate({ assignments: currentPreview.data! })}>Применить матрицу</Button>
            </Group>
          </Stack>
        </Paper>
      )}

      <Standings competitionId={competitionId} />
      <TeamStandingsByPlaces competitionId={competitionId} />
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group grow>
            <TextInput label="Название" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
            <NumberInput label="№" value={index} onChange={(val) => setIndex(typeof val === 'number' ? val : val === '' ? '' : Number(val))} min={1} clampBehavior="strict" />
          </Group>
          <SegmentedControl
            fullWidth
            data={[
              { label: 'Регистрация', value: 'registration' },
              { label: 'Тур', value: 'round' },
              { label: 'Перерыв', value: 'break' },
            ]}
            value={kind}
            onChange={(v) => setKind(v as any)}
          />
          <Group grow>
            <DateTimePicker label="Начало" value={startAt} onChange={setStartAt} popoverProps={{ withinPortal: true }} />
            <DateTimePicker label="Конец" value={endAt} onChange={setEndAt} popoverProps={{ withinPortal: true }} />
          </Group>
          <Group justify="flex-end">
            <Button disabled={!canCreate || isPending} onClick={async () => {
              if (!canCreate) return
              await createRound({ competition_id: competitionId, index: Number(index), title: title.trim(), start_at: startAt!, end_at: endAt!, kind })
            }}>Добавить</Button>
          </Group>
        </Stack>
      </Paper>

      {(rounds ?? []).map((r) => (
        <Paper key={r.id} p="md" withBorder>
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={500}>{r.index}. {r.title}</Text>
              <Text size="sm" c="dimmed">{dayjs(r.start_at).format('DD.MM.YYYY HH:mm')} — {dayjs(r.end_at).format('DD.MM.YYYY HH:mm')}</Text>
              <Group gap="xs">
                <Badge color={r.status === 'ongoing' ? 'green' : r.status === 'completed' ? 'gray' : r.status === 'break' ? 'yellow' : 'blue'} variant="light">
                  {r.kind === 'registration' ? 'Регистрация' : r.kind === 'break' ? 'Перерыв' : 'Тур'} • {r.status === 'ongoing' ? 'идет' : r.status === 'completed' ? 'завершен' : r.status === 'break' ? 'пауза' : 'запланирован'}
                </Badge>
                {r.status === 'ongoing' && (
                  <Text size="sm" c="dimmed">Осталось: {formatRemaining(new Date(r.end_at).getTime() - nowTs)}</Text>
                )}
              </Group>
            </Stack>
            <Group>
              <Button variant="subtle" onClick={() => moveRound(r.id, 'up')}>↑</Button>
              <Button variant="subtle" onClick={() => moveRound(r.id, 'down')}>↓</Button>
              <Button variant="light" disabled={r.status !== 'scheduled'} onClick={async () => {
                try {
                  await updRound({ id: r.id, input: { status: 'ongoing', started_at: new Date().toISOString() } })
                  notifications.show({ color: 'green', message: 'Блок запущен' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка запуска' })
                }
              }}>Старт</Button>
              <Button variant="light" disabled={r.status !== 'ongoing'} onClick={async () => {
                try {
                  await updRound({ id: r.id, input: { status: 'break' } })
                  notifications.show({ color: 'blue', message: 'Пауза' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка паузы' })
                }
              }}>Пауза</Button>
              <Button variant="light" disabled={r.status !== 'break'} onClick={async () => {
                try {
                  await updRound({ id: r.id, input: { status: 'ongoing' } })
                  notifications.show({ color: 'green', message: 'Продолжено' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка продолжения' })
                }
              }}>Продолжить</Button>
              <Button variant="light" disabled={r.status === 'completed'} onClick={async () => {
                try {
                  await updRound({ id: r.id, input: { status: 'completed', ended_at: new Date().toISOString() } })
                  notifications.show({ color: 'green', message: 'Блок завершён' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка завершения' })
                }
              }}>Завершить</Button>
              <Button variant="light" color="red" onClick={() => delRound({ id: r.id, competitionId })}>Удалить</Button>
            </Group>
          </Group>

          <RoundAssignmentsView roundId={r.id} competitionId={competitionId} />
          {r.kind === 'round' && r.status === 'completed' && (
            <RoundResultsTable roundId={r.id} competitionId={competitionId} startIso={r.started_at || r.start_at} endIso={r.ended_at || r.end_at} />
          )}
        </Paper>
      ))}
    </Stack>
  )
}
function Standings({ competitionId }: { competitionId: string }) {
  const { data } = useAggregatedStandings(competitionId)
  if (!data || data.length === 0) return null
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Text fw={600}>Общий рейтинг участников</Text>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Место</th>
              <th style={{ textAlign: 'left' }}>Участник</th>
              <th style={{ textAlign: 'left' }}>Сумма веса (г)</th>
              <th style={{ textAlign: 'left' }}>Кол-во рыбин</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: { userId: string; totalWeight: number; totalCount: number }, i: number) => (
              <tr key={r.userId}>
                <td>{i + 1}</td>
                <td>{r.userId}</td>
                <td>{Math.round(r.totalWeight)}</td>
                <td>{r.totalCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Stack>
    </Paper>
  )
}

function TeamStandingsByPlaces({ competitionId }: { competitionId: string }) {
  const { data } = useTeamStandingsByPlaces(competitionId)
  if (!data || data.length === 0) return null
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Text fw={600}>Командный зачёт (сумма мест по турам)</Text>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Место</th>
              <th style={{ textAlign: 'left' }}>Команда</th>
              <th style={{ textAlign: 'left' }}>Сумма мест</th>
              <th style={{ textAlign: 'left' }}>Вес (сумма, г) — тай-брейк</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any, i: number) => (
              <tr key={r.teamId}>
                <td>{i + 1}</td>
                <td>{r.teamName}</td>
                <td>{r.sumPlaces}</td>
                <td>{Math.round(r.totalWeight)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Stack>
    </Paper>
  )
}

function RoundAssignmentsView({ roundId, competitionId }: { roundId: string; competitionId: string }) {
  const { data } = useRoundAssignments(roundId)
  const { data: zones } = useZones(competitionId)
  const userIds = useMemo(() => Array.from(new Set((data ?? []).map((a) => a.participant_user_id))), [data])
  const usersQuery = useQuery({
    queryKey: ['round-assignment-users', roundId, userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {}
      const { data: users, error } = await supabase
        .from('users')
        .select('id,email,raw_user_meta_data')
        .in('id', userIds)
      if (error) throw error
      return Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, nickname: u.raw_user_meta_data?.nickname }])) as Record<string, { email?: string; nickname?: string }>
    },
    enabled: userIds.length > 0,
  })
  if (!data || data.length === 0) return null
  return (
    <Paper mt="sm" p="sm" withBorder>
      <Stack gap={4}>
        <Text size="sm" fw={600}>Назначения по зонам</Text>
        {data.map((a) => {
          const user = usersQuery.data?.[a.participant_user_id]
          const userLabel = user?.nickname || user?.email || a.participant_user_id
          const zoneLabel = zones?.find((z: any) => z.id === a.zone_id)?.name || a.zone_id
          return (
            <Text key={`${a.participant_user_id}-${a.zone_id}`} size="sm" c="dimmed">
              Участник {userLabel} → зона {zoneLabel}
            </Text>
          )
        })}
      </Stack>
    </Paper>
  )
}

function RoundResultsTable({ roundId, competitionId, startIso, endIso }: { roundId: string; competitionId: string; startIso?: string | null; endIso?: string | null }) {
  const { data: results } = useResultsInRange(competitionId, startIso, endIso)
  const { data: assignments } = useRoundAssignments(roundId)
  const { data: zones } = useZones(competitionId)

  const byZone = useMemo(() => {
    const map = new Map<string, { userId: string; totalWeight: number; totalCount: number }[]>()
    const assignByUser = new Map<string, string>((assignments ?? []).map((a) => [a.participant_user_id, a.zone_id]))
    const grouped: Record<string, { totalWeight: number; totalCount: number }> = {}
    for (const r of results ?? []) {
      const uid = r.participant_user_id
      const zid = assignByUser.get(uid)
      if (!zid) continue
      const key = `${zid}::${uid}`
      if (!grouped[key]) grouped[key] = { totalWeight: 0, totalCount: 0 }
      grouped[key].totalWeight += r.weight_grams || 0
      grouped[key].totalCount += 1
    }
    for (const key of Object.keys(grouped)) {
      const [zid, uid] = key.split('::')
      if (!map.has(zid)) map.set(zid, [])
      map.get(zid)!.push({ userId: uid, totalWeight: grouped[key].totalWeight, totalCount: grouped[key].totalCount })
    }
    for (const [, arr] of map) arr.sort((a, b) => b.totalWeight - a.totalWeight)
    return map
  }, [results, assignments])

  const { data: usersMap } = useQuery({
    queryKey: ['round-results-users', roundId],
    queryFn: async () => {
      const ids = Array.from(new Set((results ?? []).map((r: any) => r.participant_user_id)))
      if (ids.length === 0) return {}
      const { data: users, error } = await supabase.from('users').select('id,email,raw_user_meta_data').in('id', ids)
      if (error) throw error
      return Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, nickname: u.raw_user_meta_data?.nickname }])) as Record<string, { email?: string; nickname?: string }>
    },
    enabled: (results ?? []).length > 0,
  })

  if (!results || results.length === 0) return null

  return (
    <Paper mt="sm" p="sm" withBorder>
      <Stack>
        <Text fw={600}>Итоги по зонам</Text>
        {Array.from(byZone.keys()).map((zid) => (
          <Paper key={zid} p="sm" withBorder>
            <Text fw={600} size="sm" mb={4}>Зона: {zones?.find((z: any) => z.id === zid)?.name || zid}</Text>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Место</th>
                  <th style={{ textAlign: 'left' }}>Участник</th>
                  <th style={{ textAlign: 'left' }}>Вес (сумма, г)</th>
                  <th style={{ textAlign: 'left' }}>Кол-во рыбин</th>
                </tr>
              </thead>
              <tbody>
                {(byZone.get(zid) || []).map((row: { userId: string; totalWeight: number; totalCount: number }, idx: number) => (
                  <tr key={row.userId}>
                    <td>{idx + 1}</td>
                    <td>{usersMap?.[row.userId]?.nickname || usersMap?.[row.userId]?.email || row.userId}</td>
                    <td>{Math.round(row.totalWeight)}</td>
                    <td>{row.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        ))}
      </Stack>
    </Paper>
  )
}


