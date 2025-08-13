import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFishKind, deleteFishKind, listFishKinds, updateFishKind } from './api'

const KEY = ['dict-fish-kinds']

export function useFishKinds() {
  return useQuery({ queryKey: KEY, queryFn: listFishKinds })
}

export function useCreateFishKind() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createFishKind(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateFishKind() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFishKind(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteFishKind() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFishKind(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}



