import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignCompetitionRole, listCompetitionRoles, removeCompetitionRole } from '../api/api'
import type { AssignRoleInput } from './types'

export function useCompetitionRoles(competitionId: string) {
  return useQuery({ queryKey: ['competition-roles', competitionId], queryFn: () => listCompetitionRoles(competitionId), enabled: !!competitionId })
}

export function useAssignCompetitionRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignRoleInput) => assignCompetitionRole(input),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['competition-roles', vars.competition_id] }),
  })
}

export function useRemoveCompetitionRole(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ user_id, role }: { user_id: string; role: string }) => removeCompetitionRole(competitionId, user_id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competition-roles', competitionId] }),
  })
}


