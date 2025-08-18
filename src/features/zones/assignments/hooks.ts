import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignJudge, drawAssignments, listRoundAssignments, listZoneJudges } from './api'

export function useZoneJudges(competitionId: string) {
  return useQuery({ queryKey: ['zone-judges', competitionId], queryFn: () => listZoneJudges(competitionId), enabled: !!competitionId })
}

export function useAssignJudge(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { zone_id: string; user_id: string }) => assignJudge({ ...input, competition_id: competitionId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zone-judges', competitionId] }),
  })
}

export function useRoundAssignments(roundId: string) {
  return useQuery({ queryKey: ['round-assignments', roundId], queryFn: () => listRoundAssignments(roundId), enabled: !!roundId })
}

export function useDrawAssignments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ competition_id, round_id }: { competition_id: string; round_id: string }) => drawAssignments({ competition_id, round_id }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['round-assignments', vars.round_id] }),
  })
}


