import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTeamSizes, createTeamSize, updateTeamSize, deleteTeamSize } from '../api/api'
import type { CreateTeamSizeInput, UpdateTeamSizeInput } from './types'

const QUERY_KEY = ['team-sizes']

export function useTeamSizes() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchTeamSizes })
}

export function useCreateTeamSize() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTeamSizeInput) => createTeamSize(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateTeamSize() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTeamSizeInput }) => updateTeamSize(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteTeamSize() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTeamSize(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}


