import { notifications } from '@mantine/notifications'
import { useUserTrainings, useCreateTraining, useDeleteTraining, useUpdateTraining, useUserCatches } from '@/features/trainings/hooks'
import { useUserTeams, useCreateTeam, useDeleteTeam, useCreateTeamInvitation, useUserInvitations, useAcceptTeamInvitation } from '@/features/teams/hooks'
import { useUserJudgeInvitations, useRespondJudgeInvitation } from '@/features/judges/hooks'
import { useBaits } from '@/features/dicts/baits/hooks'
import { useUserBaits, useAddUserBaitFromDict, useAddCustomUserBait, useDeleteUserBait } from '@/features/userBaits/hooks'

export function useProfilePageVM(userId?: string) {
  // trainings
  const { data: trainings } = useUserTrainings(userId)
  const { data: userCatches } = useUserCatches(userId)
  const { mutateAsync: createTrainingMut, isPending: isCreatingTraining } = useCreateTraining()
  const { mutateAsync: deleteTrainingMut, isPending: isDeletingTraining } = useDeleteTraining()
  const { mutateAsync: updateTrainingMut, isPending: isUpdatingTraining } = useUpdateTraining()

  // teams
  const { data: userTeams, isLoading: teamsLoading } = useUserTeams(userId || '')
  const { data: userInvitations, isLoading: invitationsLoading } = useUserInvitations(userId || '')
  const { mutateAsync: deleteTeamMut } = useDeleteTeam()
  const { mutateAsync: createTeamMut, isPending: isCreatingTeam } = useCreateTeam()
  const { mutateAsync: createInvitationMut, isPending: isInvitingTeamMate } = useCreateTeamInvitation()
  const { mutateAsync: acceptInvitationMut } = useAcceptTeamInvitation()

  // judge invites
  const { data: judgeInvites } = useUserJudgeInvitations(userId)
  const { mutateAsync: respondJudgeInviteMut } = useRespondJudgeInvitation()

  // baits
  const { data: dictBaits } = useBaits()
  const { data: userBaits } = useUserBaits(userId)
  const { mutateAsync: addFromDictMut, isPending: isAddingFromDict } = useAddUserBaitFromDict()
  const { mutateAsync: addCustomMut, isPending: isAddingCustom } = useAddCustomUserBait()
  const { mutateAsync: removeUserBaitMut } = useDeleteUserBait()

  // wrappers with notifications
  async function createTraining(input: Parameters<typeof createTrainingMut>[0]) {
    await createTrainingMut(input)
    notifications.show({ color: 'green', message: 'Тренировка создана' })
  }
  async function deleteTraining(id: string) {
    await deleteTrainingMut(id)
    notifications.show({ color: 'gray', message: 'Тренировка удалена' })
  }
  async function updateTraining(input: Parameters<typeof updateTrainingMut>[0]) {
    await updateTrainingMut(input)
    notifications.show({ color: 'green', message: 'Тренировка обновлена' })
  }

  async function deleteTeam(teamId: string) {
    await deleteTeamMut(teamId)
  }
  async function createTeam(values: { name: string; description?: string | undefined; created_by: string }) {
    await createTeamMut(values)
    notifications.show({ color: 'green', message: 'Команда создана' })
  }
  async function createInvitation(values: { team_id: string; invited_user_email: string; invited_by: string; role: 'member' | 'captain' | 'coach' | 'creator' }) {
    await createInvitationMut(values)
    notifications.show({ color: 'green', message: 'Приглашение отправлено' })
  }
  async function acceptInvitation(values: { invitation_id: string; accept: boolean }) {
    await acceptInvitationMut(values)
    notifications.show({ color: 'green', message: values.accept ? 'Приглашение принято' : 'Приглашение отклонено' })
  }

  async function respondJudgeInvite(values: { invitation_id: string; accept: boolean; userId: string }) {
    await respondJudgeInviteMut(values)
    notifications.show({ color: values.accept ? 'green' : 'gray', message: values.accept ? 'Вы приняли приглашение судьи' : 'Вы отклонили приглашение' })
  }

  async function addFromDict(values: { user_id: string; dict_bait_id: string }) {
    await addFromDictMut(values)
    notifications.show({ color: 'green', message: 'Добавлено' })
  }
  async function addCustom(values: { user_id: string; brand: string; name: string; color?: string | null; size?: string | null }) {
    await addCustomMut(values)
    notifications.show({ color: 'green', message: 'Добавлено' })
  }
  async function removeUserBait(values: { id: string }) {
    await removeUserBaitMut(values)
    notifications.show({ color: 'gray', message: 'Удалено' })
  }

  return {
    // data
    trainings,
    userCatches,
    userTeams,
    teamsLoading,
    userInvitations,
    invitationsLoading,
    judgeInvites,
    dictBaits,
    userBaits,
    // mutations
    createTraining,
    deleteTraining,
    updateTraining,
    isCreatingTraining,
    isDeletingTraining,
    isUpdatingTraining,
    deleteTeam,
    createTeam,
    isCreatingTeam,
    createInvitation,
    isInvitingTeamMate,
    acceptInvitation,
    respondJudgeInvite,
    addFromDict,
    isAddingFromDict,
    addCustom,
    isAddingCustom,
    removeUserBait,
  }
}

export type UseProfilePageVMReturn = ReturnType<typeof useProfilePageVM>


