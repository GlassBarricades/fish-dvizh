import { useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { Paper, Stack, Group, TextInput, Button, Text, Select, Badge } from '@mantine/core'
import { useState } from 'react'
import { useCompetitionJudges, useCreateJudgeInvitation } from '@/features/judges/hooks'
import { useZones } from '@/features/zones/hooks'
import { useZoneJudges, useAssignJudge } from '@/features/zones/assignments/hooks'
import { notifications } from '@mantine/notifications'

export default function JudgesPage() {
  const { competitionId } = useParams()
  const { user } = useAuth()
  const { data: judges } = useCompetitionJudges(competitionId!)
  const { mutateAsync: inviteJudge, isPending } = useCreateJudgeInvitation()
  const { data: zones } = useZones(competitionId!)
  const { data: zoneJudges } = useZoneJudges(competitionId!)
  const { mutateAsync: assignJudge, isPending: assigning } = useAssignJudge(competitionId!)
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<Record<string, string>>({})

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <TextInput
            label="Email судьи"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <Button
            fullWidth
            disabled={!email.trim() || !user?.id}
            loading={isPending}
            onClick={async () => {
              try {
                await inviteJudge({ competition_id: competitionId!, invited_user_email: email.trim(), invited_by: user!.id })
                setEmail('')
                notifications.show({ color: 'green', message: 'Приглашение отправлено' })
              } catch (e: any) {
                notifications.show({ color: 'red', message: e?.message ?? 'Ошибка' })
              }
            }}
          >
            Пригласить
          </Button>
        </Stack>
      </Paper>

      <Stack>
        {(judges ?? []).map((j) => (
          <Paper key={j.user_id} p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={500} style={{ wordBreak: 'break-word' }}>{j.user_nickname || j.user_email || j.user_id}</Text>
                  <Text size="sm" c="dimmed">Судья</Text>
                </Stack>
                <Badge variant="light">Добавлен</Badge>
              </Group>
              <Select
                placeholder="Зона"
                data={(zones ?? []).map((z: any) => ({ value: z.id, label: z.name }))}
                value={selected[j.user_id] ?? (zoneJudges?.find((zj) => zj.user_id === j.user_id)?.zone_id ?? null)}
                onChange={(v) => setSelected((s) => ({ ...s, [j.user_id]: v || '' }))}
              />
              <Button
                fullWidth
                loading={assigning}
                disabled={!selected[j.user_id]}
                onClick={async () => {
                  if (!selected[j.user_id]) return
                  await assignJudge({ zone_id: selected[j.user_id], user_id: j.user_id })
                  setSelected((s) => ({ ...s, [j.user_id]: '' }))
                }}
              >
                Назначить на зону
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}
