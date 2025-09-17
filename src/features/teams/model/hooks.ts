import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchTeams,
  fetchUserTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchTeam,
  fetchTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  fetchTeamInvitations,
  fetchUserInvitations,
  createTeamInvitation,
  acceptTeamInvitation,
  deleteTeamInvitation,
  fetchCompetitionTeams,
  registerTeamForCompetition,
  updateTeamParticipationStatus,
  fetchUserTeamRoles,
  registerSoloForCompetition,
  updateSoloParticipationStatus,
  fetchSoloParticipants,
} from '../api/api'
import type {
  CreateTeamInput,
  UpdateTeamInput,
  CreateInvitationInput,
  AcceptInvitationInput,
  CreateTeamParticipationInput,
  UpdateTeamParticipationInput,
  TeamRole
} from './types'

export function useTeams() {
  return useQuery({ queryKey: ['teams'], queryFn: () => fetchTeams() })
}

export function useTeam(teamId: string) {
  return useQuery({ queryKey: ['team', teamId], queryFn: () => fetchTeam(teamId), enabled: !!teamId })
}

export function useUserTeams(userId: string) {
  return useQuery({ queryKey: ['user-teams', userId], queryFn: () => fetchUserTeams(userId), enabled: !!userId })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTeamInput) => createTeam(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['user-teams'] })
    },
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTeamInput }) => updateTeam(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['user-teams'] })
    },
  })
}

export function useTeamMembers(teamId: string) {
  return useQuery({ queryKey: ['team-members', teamId], queryFn: () => fetchTeamMembers(teamId), enabled: !!teamId })
}

export function useAddTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: string; userId: string; role?: TeamRole }) => addTeamMember(teamId, userId, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.teamId] })
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useRemoveTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => removeTeamMember(teamId, userId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.teamId] })
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeamMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: string; userId: string; role: TeamRole }) => updateTeamMemberRole(teamId, userId, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.teamId] })
    },
  })
}

export function useTeamInvitations(teamId: string) {
  return useQuery({ queryKey: ['team-invitations', teamId], queryFn: () => fetchTeamInvitations(teamId), enabled: !!teamId })
}

export function useUserInvitations(userId: string) {
  return useQuery({ queryKey: ['user-invitations', userId], queryFn: () => fetchUserInvitations(userId), enabled: !!userId })
}

export function useCreateTeamInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => createTeamInvitation(input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['team-invitations', variables.team_id] })
      qc.invalidateQueries({ queryKey: ['user-invitations'] })
    },
  })
}

export function useAcceptTeamInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AcceptInvitationInput) => acceptTeamInvitation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-invitations'] })
      qc.invalidateQueries({ queryKey: ['user-invitations'] })
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

export function useDeleteTeamInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTeamInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-invitations'] })
      qc.invalidateQueries({ queryKey: ['user-invitations'] })
    },
  })
}

export function useCompetitionTeams(competitionId: string) {
  return useQuery({ queryKey: ['competition-teams', competitionId], queryFn: () => fetchCompetitionTeams(competitionId), enabled: !!competitionId })
}

export function useRegisterTeamForCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTeamParticipationInput) => registerTeamForCompetition(input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-teams', variables.competition_id] })
    },
  })
}

export function useUpdateTeamParticipationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, competitionId, input }: { teamId: string; competitionId: string; input: UpdateTeamParticipationInput }) => updateTeamParticipationStatus(teamId, competitionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competition-teams'] })
    },
  })
}

export function useRegisterSoloForCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { user_id: string; competition_id: string }) => registerSoloForCompetition(input),
    onSuccess: (created, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-teams', variables.competition_id] })
      qc.invalidateQueries({ queryKey: ['solo-participants', variables.competition_id] })
      const key = ['solo-participants', variables.competition_id]
      const existing = qc.getQueryData<any[]>(key) || []
      const exists = existing.some((p) => p.user_id === variables.user_id)
      if (!exists) {
        qc.setQueryData(key, [
          ...existing,
          { user_id: variables.user_id, status: created.status, registered_at: created.registered_at },
        ])
      }
    },
  })
}

export function useUpdateSoloParticipationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { user_id: string; competition_id: string; status: 'registered' | 'confirmed' | 'rejected' }) => updateSoloParticipationStatus(input.user_id, input.competition_id, { status: input.status }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-teams', variables.competition_id] })
      qc.invalidateQueries({ queryKey: ['solo-participants', variables.competition_id] })
    },
  })
}

export function useSoloParticipants(competitionId: string) {
  return useQuery({ queryKey: ['solo-participants', competitionId], queryFn: () => fetchSoloParticipants(competitionId), enabled: !!competitionId })
}

export function useUserTeamRoles(userId: string | undefined, teamIds: string[] | undefined) {
  return useQuery({
    queryKey: ['user-team-roles', userId, teamIds?.join(',') ?? ''],
    queryFn: () => fetchUserTeamRoles(userId as string, teamIds as string[]),
    enabled: !!userId && !!teamIds && teamIds.length > 0,
  })
}


