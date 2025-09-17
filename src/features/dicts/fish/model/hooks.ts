import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFishKind, deleteFishKind, listFishKinds, updateFishKind } from '../api/api'

const KEY = ['dict-fish-kinds']

export function useFishKinds() {
  return useQuery({ queryKey: KEY, queryFn: listFishKinds })
}

export function useCreateFishKind() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createFishKind(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateFishKind() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFishKind(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteFishKind() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFishKind(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}


