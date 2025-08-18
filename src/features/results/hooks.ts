import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResult, deleteResult, fetchCompetitionParticipants, listResults, updateResult, setParticipantCheckin, getUserZoneForRound, listResultsInRange } from './api'
import type { CreateResultInput, UpdateResultInput } from './types'

export function useCompetitionParticipants(competitionId: string) {
  return useQuery({ queryKey: ['participants', competitionId], queryFn: () => fetchCompetitionParticipants(competitionId), enabled: !!competitionId })
}

export function useResults(competitionId: string) {
  return useQuery({ queryKey: ['results', competitionId], queryFn: () => listResults(competitionId), enabled: !!competitionId })
}

export function useCreateResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, createdBy }: { input: CreateResultInput; createdBy: string }) => createResult(input, createdBy),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['results', vars.input.competition_id] })
    },
  })
}

export function useUpdateResult(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateResultInput }) => updateResult(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', competitionId] })
    },
  })
}

export function useDeleteResult(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteResult(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', competitionId] })
    },
  })
}

export function useSetParticipantCheckin(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, checked }: { userId: string; checked: boolean }) => setParticipantCheckin(competitionId, userId, checked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', competitionId] })
    },
  })
}

export function useUserZone(roundId?: string, userId?: string) {
  return useQuery({ queryKey: ['user-zone', roundId, userId], queryFn: () => getUserZoneForRound(roundId!, userId!), enabled: !!roundId && !!userId })
}

export function useResultsInRange(competitionId?: string, fromIso?: string | null, toIso?: string | null) {
  return useQuery({
    queryKey: ['results-range', competitionId, fromIso, toIso],
    queryFn: () => listResultsInRange(competitionId!, fromIso, toIso),
    enabled: !!competitionId,
  })
}


