import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignJudge, drawAssignments, drawAllAssignments, listRoundAssignments, listZoneJudges, previewAllAssignments, applyAssignments } from '../api/api'

export function useZoneJudges(competitionId: string) {
  return useQuery({ queryKey: ['zone-judges', competitionId], queryFn: () => listZoneJudges(competitionId), enabled: !!competitionId })
}

export function useAssignJudge(competitionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { zone_id: string; user_id: string }) => assignJudge({ ...input, competition_id: competitionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zone-judges', competitionId] }),
  })
}

export function useRoundAssignments(roundId: string) {
  return useQuery({ queryKey: ['round-assignments', roundId], queryFn: () => listRoundAssignments(roundId), enabled: !!roundId })
}

export function useDrawAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ competition_id, round_id }: { competition_id: string; round_id: string }) => drawAssignments({ competition_id, round_id }),
    onSuccess: (_d, vars) => queryClient.invalidateQueries({ queryKey: ['round-assignments', vars.round_id] }),
  })
}

export function useDrawAllAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ competition_id }: { competition_id: string }) => drawAllAssignments({ competition_id }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['rounds', vars.competition_id] })
      queryClient.invalidateQueries({ queryKey: ['round-assignments'] })
    },
  })
}

export function usePreviewAllAssignments(competitionId: string) {
  return useQuery({
    queryKey: ['preview-assignments', competitionId],
    queryFn: () => previewAllAssignments({ competition_id: competitionId }),
    enabled: !!competitionId,
  })
}

export function usePreviewAllAssignmentsWithLocks(competitionId: string) {
  return {
    useQuery: (locked: { round_id: string; participant_user_id: string; zone_id: string }[]) =>
      useQuery({
        queryKey: ['preview-assignments', competitionId, JSON.stringify(locked ?? [])],
        queryFn: () => previewAllAssignments({ competition_id: competitionId, locked }),
        enabled: !!competitionId,
      }),
  }
}

export function useApplyAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { assignments: { round_id: string; participant_user_id: string; zone_id: string }[] }) => applyAssignments(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round-assignments'] })
    },
  })
}


