import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCompetitionFormat, deleteCompetitionFormat, fetchCompetitionFormats, updateCompetitionFormat } from '../api/api'
import type { CreateCompetitionFormatInput, UpdateCompetitionFormatInput } from './types'

const QUERY_KEY = ['competition-formats']

export function useCompetitionFormats() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchCompetitionFormats })
}

export function useCreateCompetitionFormat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCompetitionFormatInput) => createCompetitionFormat(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateCompetitionFormat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCompetitionFormatInput }) => updateCompetitionFormat(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteCompetitionFormat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCompetitionFormat(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}


