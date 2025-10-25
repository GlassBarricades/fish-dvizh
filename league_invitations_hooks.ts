// React Query хуки для системы приглашений в лиги
// Добавьте эти хуки в src/features/leagues/model/hooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import {
  createLeagueInvitation,
  fetchLeagueInvitations,
  fetchInvitationByToken,
  acceptLeagueInvitation,
  declineLeagueInvitation,
  revokeLeagueInvitation,
  resendLeagueInvitation,
  createBulkLeagueInvitations,
  type CreateInvitationInput,
  type AcceptInvitationInput,
  type LeagueInvitation
} from '../api/api'

// === ПРИГЛАШЕНИЯ В ЛИГИ ===

// Получение приглашений лиги
export function useLeagueInvitations(leagueId: string | undefined) {
  return useQuery({
    queryKey: ['league-invitations', leagueId],
    queryFn: () => fetchLeagueInvitations(leagueId!),
    enabled: !!leagueId
  })
}

// Получение приглашения по токену
export function useInvitationByToken(token: string | undefined) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => fetchInvitationByToken(token!),
    enabled: !!token
  })
}

// Создание приглашения
export function useCreateLeagueInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLeagueInvitation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['league-invitations', data.league_id] })
      notifications.show({
        color: 'green',
        title: 'Приглашение отправлено',
        message: `Приглашение отправлено на ${data.email}`
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка отправки приглашения',
        message: error.message || 'Не удалось отправить приглашение'
      })
    }
  })
}

// Принятие приглашения
export function useAcceptLeagueInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptLeagueInvitation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invitation', variables.token] })
      queryClient.invalidateQueries({ queryKey: ['league-participants'] })
      queryClient.invalidateQueries({ queryKey: ['user-league-participations'] })
      notifications.show({
        color: 'green',
        title: 'Приглашение принято',
        message: 'Вы успешно присоединились к лиге!'
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка принятия приглашения',
        message: error.message || 'Не удалось принять приглашение'
      })
    }
  })
}

// Отклонение приглашения
export function useDeclineLeagueInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: declineLeagueInvitation,
    onSuccess: (_, token) => {
      queryClient.invalidateQueries({ queryKey: ['invitation', token] })
      notifications.show({
        color: 'blue',
        title: 'Приглашение отклонено',
        message: 'Приглашение в лигу отклонено'
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка отклонения приглашения',
        message: error.message || 'Не удалось отклонить приглашение'
      })
    }
  })
}

// Отзыв приглашения
export function useRevokeLeagueInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeLeagueInvitation,
    onSuccess: (_, invitationId) => {
      // Находим league_id для инвалидации кэша
      const invitations = queryClient.getQueryData(['league-invitations']) as LeagueInvitation[]
      const invitation = invitations?.find(inv => inv.id === invitationId)
      if (invitation) {
        queryClient.invalidateQueries({ queryKey: ['league-invitations', invitation.league_id] })
      }
      notifications.show({
        color: 'orange',
        title: 'Приглашение отозвано',
        message: 'Приглашение в лигу отозвано'
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка отзыва приглашения',
        message: error.message || 'Не удалось отозвать приглашение'
      })
    }
  })
}

// Повторная отправка приглашения
export function useResendLeagueInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resendLeagueInvitation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['league-invitations', data.league_id] })
      notifications.show({
        color: 'green',
        title: 'Приглашение переотправлено',
        message: `Приглашение переотправлено на ${data.email}`
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка переотправки приглашения',
        message: error.message || 'Не удалось переотправить приглашение'
      })
    }
  })
}

// Массовое создание приглашений
export function useCreateBulkLeagueInvitations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leagueId, emails, invitedBy }: { leagueId: string, emails: string[], invitedBy: string }) =>
      createBulkLeagueInvitations(leagueId, emails, invitedBy),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-invitations', variables.leagueId] })
      notifications.show({
        color: 'green',
        title: 'Приглашения отправлены',
        message: `Отправлено ${data.length} приглашений`
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка массовой отправки',
        message: error.message || 'Не удалось отправить приглашения'
      })
    }
  })
}
