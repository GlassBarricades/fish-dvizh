import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Group, Paper, Stack, Text, TextInput, NumberInput, SegmentedControl } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import dayjs from 'dayjs'
import { useCreateRound, useDeleteRound, useRounds, useUpdateRound } from './hooks'
import { useZones } from '../zones/hooks'
import { useDrawAssignments, useRoundAssignments } from '../zones/assignments/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { useResultsInRange } from '../results/hooks'

export function ScheduleTab({ competitionId }: { competitionId: string }) {
  const { data: rounds } = useRounds(competitionId)
  const { mutateAsync: createRound, isPending } = useCreateRound()
  const { mutateAsync: delRound } = useDeleteRound()
  const { mutateAsync: updRound } = useUpdateRound()
  const { data: zones } = useZones(competitionId)
  const draw = useDrawAssignments()

  const [title, setTitle] = useState('Тур')
  const [index, setIndex] = useState<number | ''>(rounds?.length ? rounds.length + 1 : 1)
  const [startAt, setStartAt] = useState<string | null>(dayjs().toISOString())
  const [endAt, setEndAt] = useState<string | null>(dayjs().add(2, 'hour').toISOString())
  const [kind, setKind] = useState<'round' | 'registration' | 'break'>('round')
  const [nowTs, setNowTs] = useState<number>(Date.now())

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
                <Badge color={r.status === 'ongoing' ? 'green' : r.status === 'completed' ? 'gray' : 'blue'} variant="light">
                  {r.kind === 'registration' ? 'Регистрация' : r.kind === 'break' ? 'Перерыв' : 'Тур'} • {r.status === 'ongoing' ? 'идет' : r.status === 'completed' ? 'завершен' : 'запланирован'}
                </Badge>
                {r.status === 'ongoing' && (
                  <Text size="sm" c="dimmed">Осталось: {formatRemaining(new Date(r.end_at).getTime() - nowTs)}</Text>
                )}
              </Group>
            </Stack>
            <Group>
              <Button variant="light" disabled={r.status !== 'scheduled'} onClick={async () => {
                try {
                  await updRound({ id: r.id, input: { status: 'ongoing', started_at: new Date().toISOString() } })
                  notifications.show({ color: 'green', message: 'Тур начат' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка запуска тура' })
                }
              }}>Старт тура</Button>
              <Button variant="light" disabled={r.status !== 'ongoing'} onClick={async () => {
                try {
                  await updRound({ id: r.id, input: { status: 'completed', ended_at: new Date().toISOString() } })
                  notifications.show({ color: 'green', message: 'Тур завершён' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка завершения тура' })
                }
              }}>Завершить тур</Button>
              <Button variant="light" loading={draw.isPending} disabled={!zones || zones.length === 0} onClick={() => draw.mutate({ competition_id: competitionId, round_id: r.id })}>Жеребьёвка по зонам</Button>
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
      const ids = Array.from(new Set((results ?? []).map((r) => r.participant_user_id)))
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
                {(byZone.get(zid) || []).map((row, idx) => (
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


