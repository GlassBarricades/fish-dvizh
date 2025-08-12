import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCompetition, fetchCompetitions, updateCompetition, deleteCompetition } from './api'
import type { CreateCompetitionInput, UpdateCompetitionInput } from './types'

const QUERY_KEY = ['competitions']

export function useCompetitions() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchCompetitions })
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


