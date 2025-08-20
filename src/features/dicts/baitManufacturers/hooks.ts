import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBaitManufacturer, deleteBaitManufacturer, listBaitManufacturers, updateBaitManufacturer } from './api'

const KEY = ['dict-bait-manufacturers']

export function useBaitManufacturers() {
  return useQuery({ queryKey: KEY, queryFn: listBaitManufacturers })
}

export function useCreateBaitManufacturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBaitManufacturer,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateBaitManufacturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateBaitManufacturer(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBaitManufacturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBaitManufacturer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}


