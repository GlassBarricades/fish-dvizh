import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBaitManufacturer, deleteBaitManufacturer, listBaitManufacturers, updateBaitManufacturer } from '../api/api'

const KEY = ['dict-bait-manufacturers']

export function useBaitManufacturers() {
  return useQuery({ queryKey: KEY, queryFn: listBaitManufacturers })
}

export function useCreateBaitManufacturer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBaitManufacturer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateBaitManufacturer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateBaitManufacturer(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBaitManufacturer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBaitManufacturer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}


