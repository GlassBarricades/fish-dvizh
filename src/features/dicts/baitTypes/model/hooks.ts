import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBaitType, deleteBaitType, listBaitTypes, updateBaitType } from '../api/api'

const KEY = ['dict-bait-types']

export function useBaitTypes() {
  return useQuery({ queryKey: KEY, queryFn: listBaitTypes })
}

export function useCreateBaitType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBaitType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateBaitType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateBaitType(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBaitType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBaitType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}


