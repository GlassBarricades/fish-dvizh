import { Badge, Button, FileInput, Group, NumberInput, Paper, Select, Stack, Title } from '@mantine/core'
import type { UseJudgePanelReturn } from '@/features/judging/model/hooks'

export function JudgePanel({ vm }: { vm: UseJudgePanelReturn }) {
  const {
    role, zones, judgeZoneId, activeRoundId,
    allowedParticipants, fishKinds,
    participantId, setParticipantId,
    fishId, setFishId,
    weight, setWeight,
    file, setFile,
    submitOnline, submitOffline, trySync,
    isSubmitting,
  } = vm

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
          <Button onClick={submitOnline} loading={isSubmitting} disabled={!activeRoundId || !participantId || !fishId}>Отправить</Button>
          <Button variant="light" onClick={submitOffline} disabled={!activeRoundId || !participantId || !fishId}>Сохранить офлайн</Button>
          <Button variant="subtle" onClick={trySync}>Синхронизировать</Button>
        </Group>
      </Paper>
    </Stack>
  )
}


