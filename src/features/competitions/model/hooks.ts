import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCompetition, fetchCompetitions, updateCompetition, deleteCompetition, setCompetitionFishKinds, listCompetitionFishKinds, fetchCompetitionById, fetchUpcomingCompetitions } from '../api/api'
import type { CreateCompetitionInput, UpdateCompetitionInput } from './types'

const QUERY_KEY = ['competitions']

export function useCompetitions() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchCompetitions })
}

export function useCompetition(competitionId: string) {
  return useQuery({ queryKey: ['competition', competitionId], queryFn: () => fetchCompetitionById(competitionId), enabled: !!competitionId })
}

export function useUpcomingCompetitions(limit?: number) {
  return useQuery({ queryKey: ['competitions-upcoming', limit], queryFn: () => fetchUpcomingCompetitions(limit) })
}

export function useCreateCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCompetitionInput) => createCompetition(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCompetitionInput }) => updateCompetition(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCompetition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useCompetitionFishKinds(competitionId: string) {
  return useQuery({ queryKey: ['competition-fish-kinds', competitionId], queryFn: () => listCompetitionFishKinds(competitionId), enabled: !!competitionId })
}

export function useSetCompetitionFishKinds() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ competitionId, fishKindIds }: { competitionId: string; fishKindIds: string[] }) => setCompetitionFishKinds(competitionId, fishKindIds),
    onSuccess: () => qc.invalidateQueries(),
  })
}


