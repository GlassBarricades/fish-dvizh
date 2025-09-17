import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core'
import dayjs from 'dayjs'
import { useRounds } from '@/features/schedule/hooks'
import { useZones } from '@/features/zones/hooks'
import { useRoundAssignments } from '@/features/zones/assignments/hooks'
import { supabase } from '@/lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'

export default function ScoreboardPage() {
  const { competitionId } = useParams()
  const { data: rounds } = useRounds(competitionId || '')
  const { data: zones } = useZones(competitionId || '')
  const current = useMemo(() => (rounds ?? []).find((r: any) => r.status === 'ongoing') || null, [rounds])
  const upcoming = useMemo(() => {
    const scheduled = (rounds ?? []).filter((r: any) => r.status === 'scheduled').sort((a: any, b: any) => dayjs(a.start_at).valueOf() - dayjs(b.start_at).valueOf())
    return scheduled[0] || null
  }, [rounds])

  const [now, setNow] = useState<number>(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const assignmentsQuery = useRoundAssignments(current?.id || '')
  const resultsQuery = useQuery({
    queryKey: ['scoreboard-results', competitionId, current?.id, current?.start_at, current?.end_at],
    queryFn: async () => {
      if (!competitionId) return []
      let query = supabase
        .from('competition_results')
        .select('participant_user_id, weight_grams, created_at')
        .eq('competition_id', competitionId)
      if (current?.start_at) query = query.gte('created_at', current.started_at || current.start_at)
      if (current?.end_at) query = query.lte('created_at', current.ended_at || current.end_at)
      const { data, error } = await query
      if (error) throw error
      return (data as any[]) || []
    },
    enabled: !!competitionId && !!current,
    refetchInterval: 5000,
  })

  const zoneStats = useMemo(() => {
    const byUserZone = new Map<string, string>((assignmentsQuery.data ?? []).map((a: any) => [a.participant_user_id, a.zone_id]))
    const byZone: Record<string, { totalWeight: number; totalCount: number; byUser: Record<string, number> }> = {}
    for (const r of resultsQuery.data ?? []) {
      const uid = r.participant_user_id
      const zid = byUserZone.get(uid)
      if (!zid) continue
      if (!byZone[zid]) byZone[zid] = { totalWeight: 0, totalCount: 0, byUser: {} }
      byZone[zid].totalWeight += r.weight_grams || 0
      byZone[zid].totalCount += 1
      byZone[zid].byUser[uid] = (byZone[zid].byUser[uid] || 0) + (r.weight_grams || 0)
    }
    const entries = Object.entries(byZone).map(([zid, s]) => {
      const top = Object.entries(s.byUser).sort((a, b) => b[1] - a[1])[0]
      return { zoneId: zid, totalWeight: s.totalWeight, totalCount: s.totalCount, topUserId: top?.[0], topWeight: top?.[1] || 0 }
    })
    entries.sort((a, b) => b.totalWeight - a.totalWeight)
    return entries
  }, [assignmentsQuery.data, resultsQuery.data])

  const remainingMs = current ? dayjs(current.end_at).valueOf() - now : 0
  const nextStartsIn = upcoming ? dayjs(upcoming.start_at).valueOf() - now : 0

  function fmt(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000))
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  return (
    <Stack p="md" gap="md">
      <Group justify="space-between">
        <Title order={2}>Табло соревнования</Title>
        {competitionId && (
          <Button component={Link} to={`/competition/${competitionId}`} variant="subtle">К странице соревнования</Button>
        )}
      </Group>
      <Paper p="xl" withBorder>
        <Group justify="space-between" align="center">
          <Stack>
            <Text size="lg">Текущий этап</Text>
            <Title order={1}>{current ? `${current.index}. ${current.title}` : 'Нет активного этапа'}</Title>
            {current && <Badge color="green" size="lg">Идет • Осталось {fmt(remainingMs)}</Badge>}
          </Stack>
          <Stack>
            <Text size="lg">Следующий этап</Text>
            <Title order={3}>{upcoming ? `${upcoming.index}. ${upcoming.title}` : '—'}</Title>
            {upcoming && <Badge size="lg">Старт через {fmt(nextStartsIn)}</Badge>}
          </Stack>
        </Group>
      </Paper>

      <Paper p="md" withBorder>
        <Stack>
          <Group>
            <Title order={3}>Статус по зонам</Title>
            <Badge variant="light">Обновление каждые 5 сек</Badge>
          </Group>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {zoneStats.map((z) => (
              <Paper key={z.zoneId} p="md" withBorder>
                <Stack gap={6}>
                  <Text fw={600}>{zones?.find((x: any) => x.id === z.zoneId)?.name || z.zoneId}</Text>
                  <Text size="sm" c="dimmed">Уловов: {z.totalCount}</Text>
                  <Text size="sm" c="dimmed">Вес: {Math.round(z.totalWeight)} г</Text>
                  {z.topUserId && (
                    <Badge variant="light">Лидер зоны: {z.topUserId} • {Math.round(z.topWeight)} г</Badge>
                  )}
                </Stack>
              </Paper>
            ))}
            {zoneStats.length === 0 && <Text c="dimmed">Нет данных для текущего этапа</Text>}
          </div>
        </Stack>
      </Paper>
    </Stack>
  )
}


