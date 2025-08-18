import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createZone, deleteZone, listZones, updateZone } from './api'
import type { CreateZoneInput, UpdateZoneInput } from './types'

export function useZones(competitionId: string) {
  return useQuery({ queryKey: ['zones', competitionId], queryFn: () => listZones(competitionId), enabled: !!competitionId })
}

export function useCreateZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateZoneInput) => createZone(input),
    onSuccess: (zone) => {
      qc.invalidateQueries({ queryKey: ['zones', zone.competition_id] })
    },
  })
}

export function useUpdateZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; input: UpdateZoneInput; competitionId: string }) => updateZone(args.id, args.input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['zones', (vars as any).competitionId] })
    },
  })
}

export function useDeleteZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; competitionId: string }) => deleteZone(id),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['zones', (vars as any).competitionId] })
    },
  })
}


