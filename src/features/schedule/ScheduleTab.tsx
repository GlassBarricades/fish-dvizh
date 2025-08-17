import { useEffect, useState } from 'react'
import { Badge, Button, Group, Paper, Stack, Text, TextInput, NumberInput, SegmentedControl } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import dayjs from 'dayjs'
import { useCreateRound, useDeleteRound, useRounds, useUpdateRound } from './hooks'
import { notifications } from '@mantine/notifications'

export function ScheduleTab({ competitionId }: { competitionId: string }) {
  const { data: rounds } = useRounds(competitionId)
  const { mutateAsync: createRound, isPending } = useCreateRound()
  const { mutateAsync: delRound } = useDeleteRound()
  const { mutateAsync: updRound } = useUpdateRound()

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
              <Button variant="light" color="red" onClick={() => delRound({ id: r.id, competitionId })}>Удалить</Button>
            </Group>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}


