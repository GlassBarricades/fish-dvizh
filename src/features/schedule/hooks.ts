import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRound, deleteRound, listRounds, updateRound } from './api'
import type { CreateRoundInput, UpdateRoundInput } from './types'

export function useRounds(competitionId: string) {
  return useQuery({ queryKey: ['rounds', competitionId], queryFn: () => listRounds(competitionId), enabled: !!competitionId })
}

export function useCreateRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRoundInput) => createRound(input),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ['rounds', variables.competition_id] })
    },
  })
}

export function useUpdateRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoundInput }) => updateRound(id, input),
    onSuccess: (_d) => {
      // Need competition id to invalidate; caller should follow-up or we refetch all
      qc.invalidateQueries({ queryKey: ['rounds'] })
    },
  })
}

export function useDeleteRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; competitionId: string }) => deleteRound(id),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ['rounds', (variables as any).competitionId] })
    },
  })
}


