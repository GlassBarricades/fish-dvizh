import { useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks'
import { useRounds } from '@/features/schedule/hooks'
import { useRoundAssignments, useZoneJudges } from '@/features/zones/assignments/hooks'
import { useZones } from '@/features/zones/hooks'
import { useCompetitionParticipants } from '@/features/results/hooks'
import { useCreateResult } from '@/features/results/hooks'
import { useFishKinds } from '@/features/dicts/fish/hooks'
import { addToQueue } from '@/lib/offlineQueue'
import { syncOfflineQueue } from '@/lib/offlineSync'
import { notifications } from '@mantine/notifications'

export function useJudgePanel(competitionId: string | undefined) {
  const { user, role } = useAuth()
  const { data: rounds } = useRounds(competitionId || '')
  const activeRoundId = (rounds ?? []).find((r: any) => r.kind === 'round' && r.status === 'ongoing')?.id as string | undefined
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
    await addToQueue({ type: 'create_result', payload: { competition_id: competitionId, participant_user_id: participantId, fish_kind_id: fishId, weight_grams: weight === '' ? null : Number(weight), proof_data_url: proofDataUrl } })
    notifications.show({ color: 'green', message: 'Сохранено офлайн. Синхронизируется при появлении сети' })
    setWeight('')
    setFile(null)
  }

  async function trySync() {
    await syncOfflineQueue(user?.id)
    notifications.show({ color: 'blue', message: 'Попытка синхронизации очереди' })
  }

  return {
    // meta
    role,
    zones,
    judgeZoneId,
    activeRoundId,
    // data
    allowedParticipants,
    fishKinds,
    // state
    participantId,
    setParticipantId,
    fishId,
    setFishId,
    weight,
    setWeight,
    file,
    setFile,
    // actions
    submitOnline,
    submitOffline,
    trySync,
    isSubmitting: create.isPending,
  }
}

export type UseJudgePanelReturn = ReturnType<typeof useJudgePanel>


