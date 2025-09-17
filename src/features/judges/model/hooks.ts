import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createJudgeInvitation, fetchCompetitionJudges, fetchUserJudgeInvitations, isUserJudge, respondJudgeInvitation } from '../api/api'
import type { CreateJudgeInvitationInput } from './types'

export function useCompetitionJudges(competitionId: string) {
  return useQuery({ queryKey: ['judges', competitionId], queryFn: () => fetchCompetitionJudges(competitionId), enabled: !!competitionId })
}

export function useUserJudgeInvitations(userId?: string) {
  return useQuery({ queryKey: ['judge-invitations', userId], queryFn: () => fetchUserJudgeInvitations(userId!), enabled: !!userId })
}

export function useCreateJudgeInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateJudgeInvitationInput) => createJudgeInvitation(input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['judges', vars.competition_id] })
    },
  })
}

export function useRespondJudgeInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ invitation_id, accept, userId }: { invitation_id: string; accept: boolean; userId: string }) => respondJudgeInvitation({ invitation_id, accept }, userId),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useIsUserJudge(competitionId?: string, userId?: string) {
  return useQuery({ queryKey: ['is-judge', competitionId, userId], queryFn: () => isUserJudge(competitionId!, userId!), enabled: !!competitionId && !!userId })
}


