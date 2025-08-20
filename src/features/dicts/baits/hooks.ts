import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBait, deleteBait, listBaits, updateBait } from './api'

const KEY = ['dict-baits']

export function useBaits() {
  return useQuery({ queryKey: KEY, queryFn: listBaits })
}

export function useCreateBait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBait,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateBait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ brand: string; name: string; color?: string; size?: string }> }) => updateBait(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBait(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}


