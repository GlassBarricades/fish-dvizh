import { useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Badge, Button, FileInput, Group, NumberInput, Paper, Select, Stack, Title } from '@mantine/core'
import { useCompetitionParticipants } from '../features/results/hooks'
import { useFishKinds } from '../features/dicts/fish/hooks'
import { useZones } from '../features/zones/hooks'
import { useRoundAssignments, useZoneJudges } from '../features/zones/assignments/hooks'
import { useRounds } from '../features/schedule/hooks'
import { useAuth } from '../features/auth/hooks'
import { addToQueue } from '../lib/offlineQueue'
import { syncOfflineQueue } from '../lib/offlineSync'
import { notifications } from '@mantine/notifications'
import { useCreateResult } from '../features/results/hooks'

export default function JudgePage() {
  const { competitionId } = useParams()
  const { user, role } = useAuth()
  const { data: rounds } = useRounds(competitionId || '')
  const activeRoundId = (rounds ?? []).find((r: any) => r.kind === 'round' && r.status === 'ongoing')?.id
  const { data: assignments } = useRoundAssignments(activeRoundId || '')
  const { data: zones } = useZones(competitionId || '')
  const { data: zoneJudges } = useZoneJudges(competitionId || '')
  const judgeZoneId = useMemo(() => {
    if (!user?.id || !zoneJudges) return undefined
    return zoneJudges.find((z: any) => z.user_id === user.id)?.zone_id as string | undefined
  }, [zoneJudges, user?.id])

  const { data: participants } = useCompetitionParticipants(competitionId || '')
  const { data: fishKinds } = useFishKinds()
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [fishId, setFishId] = useState<string | null>(null)
  const [weight, setWeight] = useState<number | ''>('')
  const [file, setFile] = useState<File | null>(null)
  const create = useCreateResult()

  const allowedParticipants = useMemo(() => {
    if (!participants) return []
    // только участники активного тура
    const inRound = new Set((assignments ?? []).map((a: any) => a.participant_user_id))
    let base = participants.filter((p: any) => inRound.has(p.user_id))
    if (judgeZoneId) {
      base = base.filter((p: any) => (assignments || []).find((a: any) => a.participant_user_id === p.user_id)?.zone_id === judgeZoneId)
    }
    return base
  }, [participants, assignments, judgeZoneId])

  async function submitOnline() {
    if (!competitionId || !user?.id || !participantId || !fishId) return
    await create.mutateAsync({ input: { competition_id: competitionId, participant_user_id: participantId!, fish_kind_id: fishId!, weight_grams: weight === '' ? null : Number(weight), length_cm: null }, createdBy: user.id })
  }

  async function submitOffline() {
    if (!competitionId || !participantId || !fishId) return
    let proofDataUrl: string | undefined
    if (file) {
      proofDataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.readAsDataURL(file)
      })
    }
    await addToQueue({ type: 'create_result', payload: { competition_id: competitionId, participant_user_id: participantId, fish_kind_id: fishId, weight_grams: weight === '' ? null : Number(weight), proof_data_url: proofDataUrl }, })
    notifications.show({ color: 'green', message: 'Сохранено офлайн. Синхронизируется при появлении сети' })
    setWeight(''); setFile(null)
  }

  async function trySync() {
    await syncOfflineQueue(user?.id)
    notifications.show({ color: 'blue', message: 'Попытка синхронизации очереди' })
  }

  return (
    <Stack p="md">
      <Title order={2}>Режим судьи</Title>
      <Paper p="md" withBorder>
        <Group>
          <Badge>{role}</Badge>
          {judgeZoneId && <Badge variant="light">Зона: {zones?.find((z: any) => z.id === judgeZoneId)?.name || judgeZoneId}</Badge>}
          {activeRoundId ? <Badge color="green">Активный тур</Badge> : <Badge color="gray">Нет активного тура</Badge>}
        </Group>
      </Paper>
      <Paper p="md" withBorder>
        <Group grow align="end">
          <Select label="Участник" placeholder={activeRoundId ? undefined : 'Нет активного тура'} data={(allowedParticipants ?? []).map((p: any) => ({ value: p.user_id, label: p.user_nickname || p.user_email || p.user_id }))} value={participantId} onChange={setParticipantId} searchable disabled={!activeRoundId} />
          <Select label="Вид рыбы" data={(fishKinds ?? []).map((f: any) => ({ value: f.id, label: f.name }))} value={fishId} onChange={setFishId} searchable />
          <NumberInput label="Вес (г)" value={weight} onChange={(v) => setWeight(typeof v === 'number' ? v : v === '' ? '' : Number(v))} min={0} clampBehavior="strict" />
          <FileInput label="Фото-подтверждение (необязательно)" value={file} onChange={setFile} accept="image/*" clearable />
          <Button onClick={submitOnline} loading={create.isPending} disabled={!activeRoundId || !participantId || !fishId}>Отправить</Button>
          <Button variant="light" onClick={submitOffline} disabled={!activeRoundId || !participantId || !fishId}>Сохранить офлайн</Button>
          <Button variant="subtle" onClick={trySync}>Синхронизировать</Button>
        </Group>
      </Paper>
    </Stack>
  )
}


