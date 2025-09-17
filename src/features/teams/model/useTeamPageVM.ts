import { notifications } from '@mantine/notifications'
import { useTeam, useTeamMembers, useTeamInvitations, useUpdateTeam, useDeleteTeam, useRemoveTeamMember, useUpdateTeamMemberRole, useDeleteTeamInvitation, useCreateTeamInvitation } from '@/features/teams/hooks'
import { useTeamTrainings, useCreateTraining, useDeleteTraining, useUpdateTraining } from '@/features/trainings/hooks'

export function useTeamPageVM(teamId?: string, userId?: string) {
  // base data
  const teamQuery = useTeam(teamId!)
  const membersQuery = useTeamMembers(teamId!)
  const invitationsQuery = useTeamInvitations(teamId!)
  const trainingsQuery = useTeamTrainings(teamId)

  // team actions
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()
  const removeMember = useRemoveTeamMember()
  const updateMemberRole = useUpdateTeamMemberRole()
  const deleteInvitation = useDeleteTeamInvitation()
  const createInvitation = useCreateTeamInvitation()

  // trainings actions
  const { mutateAsync: createTraining, isPending: isCreatingTraining } = useCreateTraining()
  const { mutateAsync: updateTraining, isPending: isUpdatingTraining } = useUpdateTraining()
  const { mutateAsync: deleteTraining, isPending: isDeletingTraining } = useDeleteTraining()

  async function onEditTeam(values: { id: string; input: { name: string; description?: string } }) {
    await updateTeam.mutateAsync(values)
  }
  async function onDeleteTeam(id: string) {
    await deleteTeam.mutateAsync(id)
  }
  async function onRemoveMember(values: { teamId: string; userId: string }) {
    await removeMember.mutateAsync(values)
  }
  async function onUpdateMemberRole(values: { teamId: string; userId: string; role: string }) {
    await updateMemberRole.mutateAsync(values)
  }
  async function onDeleteInvitation(id: string) {
    await deleteInvitation.mutateAsync(id)
  }
  async function onCreateInvitation(values: { team_id: string; invited_user_email: string; invited_by: string; role: 'member' | 'captain' | 'coach' | 'creator' }) {
    await createInvitation.mutateAsync(values)
    notifications.show({ color: 'green', message: 'Приглашение отправлено успешно' })
  }

  return {
    // queries
    teamQuery, membersQuery, invitationsQuery, trainingsQuery,
    // actions
    onEditTeam, onDeleteTeam, onRemoveMember, onUpdateMemberRole, onDeleteInvitation, onCreateInvitation,
    createTraining, updateTraining, deleteTraining,
    isCreatingTraining, isUpdatingTraining, isDeletingTraining,
  }
}

export type UseTeamPageVMReturn = ReturnType<typeof useTeamPageVM>


