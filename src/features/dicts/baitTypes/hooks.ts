import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBaitType, deleteBaitType, listBaitTypes, updateBaitType } from './api'

const KEY = ['dict-bait-types']

export function useBaitTypes() {
  return useQuery({ queryKey: KEY, queryFn: listBaitTypes })
}

export function useCreateBaitType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBaitType,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateBaitType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateBaitType(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBaitType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBaitType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}


