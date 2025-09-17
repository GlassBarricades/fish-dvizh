import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBait, deleteBait, listBaits, updateBait } from '../api/api'

const KEY = ['dict-baits']

export function useBaits() {
  return useQuery({ queryKey: KEY, queryFn: listBaits })
}

export function useCreateBait() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBait,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateBait() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ brand: string; name: string; color?: string; size?: string; type_id?: string | null; manufacturer_id?: string | null }> }) => updateBait(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBait() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBait(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}


