import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useAuth } from '@/features/auth/hooks'
import {
  fetchLeagues,
  fetchLeague,
  fetchActiveLeagues,
  createLeague,
  updateLeague,
  deleteLeague,
  fetchRatingConfigs,
  fetchRatingConfig,
  createRatingConfig,
  updateRatingConfig,
  deleteRatingConfig,
  joinLeague,
  leaveLeague,
  fetchLeagueParticipants,
  fetchUserLeagueParticipations,
  fetchLeagueRating,
  fetchLeagueCompetitions,
  fetchCompetitionLeagues,
  addLeagueResult,
  processCompetitionResults,
  recalculateLeagueRating,
  getLeagueSeasonStats,
  linkCompetitionsToLeague,
  createLeagueInvitation,
  fetchLeagueInvitations,
  fetchInvitationByToken,
  acceptLeagueInvitation,
  declineLeagueInvitation,
  revokeLeagueInvitation,
  resendLeagueInvitation,
  createBulkLeagueInvitations,
  fetchUserInvitations,
  bulkAddParticipants
} from '../api/api'
import type {
  CreateLeagueInput,
  UpdateLeagueInput,
  CreateRatingConfigInput,
  UpdateRatingConfigInput,
  LeagueRatingFilters
} from '../model/types'

// === ЛИГИ ===

export function useLeagues() {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: fetchLeagues
  })
}

export function useLeague(leagueId: string | undefined) {
  return useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => fetchLeague(leagueId!),
    enabled: !!leagueId
  })
}

export function useLeagueCompetitions(leagueId: string | undefined) {
  return useQuery({
    queryKey: ['league-competitions', leagueId],
    queryFn: () => fetchLeagueCompetitions(leagueId!),
    enabled: !!leagueId
  })
}

export function useCompetitionLeagues(competitionId: string | undefined) {
  return useQuery({
    queryKey: ['competition-leagues', competitionId],
    queryFn: () => fetchCompetitionLeagues(competitionId!),
    enabled: !!competitionId
  })
}

export function useActiveLeagues() {
  return useQuery({
    queryKey: ['active-leagues'],
    queryFn: fetchActiveLeagues
  })
}

export function useCreateLeague() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (input: CreateLeagueInput) => createLeague(input, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      queryClient.invalidateQueries({ queryKey: ['active-leagues'] })
      notifications.show({ color: 'green', message: 'Лига создана успешно' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка создания лиги' })
    }
  })
}

export function useUpdateLeague() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leagueId, input }: { leagueId: string; input: UpdateLeagueInput }) => 
      updateLeague(leagueId, input),
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] })
      queryClient.invalidateQueries({ queryKey: ['active-leagues'] })
      notifications.show({ color: 'green', message: 'Лига обновлена' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обновления лиги' })
    }
  })
}

export function useDeleteLeague() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteLeague,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      queryClient.invalidateQueries({ queryKey: ['active-leagues'] })
      notifications.show({ color: 'green', message: 'Лига удалена' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка удаления лиги' })
    }
  })
}

// === КОНФИГУРАЦИИ РЕЙТИНГА ===

export function useRatingConfigs() {
  return useQuery({
    queryKey: ['rating-configs'],
    queryFn: fetchRatingConfigs
  })
}

export function useRatingConfig(configId: string | undefined) {
  return useQuery({
    queryKey: ['rating-config', configId],
    queryFn: () => fetchRatingConfig(configId!),
    enabled: !!configId
  })
}

export function useCreateRatingConfig() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (input: CreateRatingConfigInput) => createRatingConfig(input, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rating-configs'] })
      notifications.show({ color: 'green', message: 'Конфигурация рейтинга создана' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка создания конфигурации' })
    }
  })
}

export function useUpdateRatingConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ configId, input }: { configId: string; input: UpdateRatingConfigInput }) => 
      updateRatingConfig(configId, input),
    onSuccess: (_, { configId }) => {
      queryClient.invalidateQueries({ queryKey: ['rating-configs'] })
      queryClient.invalidateQueries({ queryKey: ['rating-config', configId] })
      notifications.show({ color: 'green', message: 'Конфигурация обновлена' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обновления конфигурации' })
    }
  })
}

export function useDeleteRatingConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRatingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rating-configs'] })
      notifications.show({ color: 'green', message: 'Конфигурация удалена' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка удаления конфигурации' })
    }
  })
}

// === ПРИВЯЗКА СОРЕВНОВАНИЙ К ЛИГЕ ===
export function useLinkCompetitionsToLeague() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ leagueId, competitionIds }: { leagueId: string; competitionIds: string[] }) =>
      linkCompetitionsToLeague(leagueId, competitionIds),
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] })
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      notifications.show({ color: 'green', message: 'Соревнования привязаны к лиге' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка привязки соревнований' })
    }
  })
}

// === УЧАСТИЕ В ЛИГЕ ===

export function useJoinLeague() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinLeague,
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['league-participants', input.league_id] })
      queryClient.invalidateQueries({ queryKey: ['user-league-participations', input.user_id] })
      queryClient.invalidateQueries({ queryKey: ['league-rating', input.league_id] })
      notifications.show({ color: 'green', message: 'Вы успешно присоединились к лиге' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка присоединения к лиге' })
    }
  })
}

export function useLeaveLeague() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leagueId, userId }: { leagueId: string; userId: string }) => 
      leaveLeague(leagueId, userId),
    onSuccess: (_, { leagueId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['league-participants', leagueId] })
      queryClient.invalidateQueries({ queryKey: ['user-league-participations', userId] })
      queryClient.invalidateQueries({ queryKey: ['league-rating', leagueId] })
      notifications.show({ color: 'green', message: 'Вы покинули лигу' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка выхода из лиги' })
    }
  })
}

export function useLeagueParticipants(leagueId: string | undefined) {
  return useQuery({
    queryKey: ['league-participants', leagueId],
    queryFn: () => fetchLeagueParticipants(leagueId!),
    enabled: !!leagueId
  })
}

export function useUserLeagueParticipations(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-league-participations', userId],
    queryFn: () => fetchUserLeagueParticipations(userId!),
    enabled: !!userId
  })
}

// === РЕЙТИНГ ЛИГИ ===

export function useLeagueRating(filters: LeagueRatingFilters) {
  return useQuery({
    queryKey: ['league-rating', filters],
    queryFn: () => fetchLeagueRating(filters)
  })
}

export function useAddLeagueResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addLeagueResult,
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['league-rating', { league_id: input.league_id }] })
      queryClient.invalidateQueries({ queryKey: ['league-participants', input.league_id] })
      queryClient.invalidateQueries({ queryKey: ['user-league-participations', input.user_id] })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка добавления результата' })
    }
  })
}

// === УТИЛИТАРНЫЕ ХУКИ ===

// Проверяет, участвует ли пользователь в лиге
export function useIsUserInLeague(leagueId: string | undefined, userId: string | undefined) {
  const { data: participations } = useUserLeagueParticipations(userId)
  
  return {
    isParticipating: !!participations?.find(p => p.league_id === leagueId),
    participation: participations?.find(p => p.league_id === leagueId)
  }
}

// Получает статистику пользователя в конкретной лиге
export function useUserLeagueStats(leagueId: string | undefined, userId: string | undefined) {
  const { data: rating } = useLeagueRating({ league_id: leagueId! })
  
  return {
    userStats: rating?.find(stats => stats.user_id === userId),
    userRank: rating ? (rating.findIndex(stats => stats.user_id === userId) + 1) : 0
  }
}

// === АВТОМАТИЧЕСКАЯ ОБРАБОТКА РЕЗУЛЬТАТОВ ===

export function useProcessCompetitionResults() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: processCompetitionResults,
    onSuccess: () => {
      // Инвалидируем кэш рейтингов всех лиг, которые могут быть затронуты
      queryClient.invalidateQueries({ queryKey: ['league-rating'] })
      queryClient.invalidateQueries({ queryKey: ['league-participants'] })
      queryClient.invalidateQueries({ queryKey: ['user-league-participations'] })
      notifications.show({ 
        color: 'green', 
        message: 'Результаты соревнования обработаны и добавлены в лигу' 
      })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обработки результатов' })
    }
  })
}

export function useRecalculateLeagueRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recalculateLeagueRating,
    onSuccess: (_, leagueId) => {
      queryClient.invalidateQueries({ queryKey: ['league-rating', { league_id: leagueId }] })
      queryClient.invalidateQueries({ queryKey: ['league-participants', leagueId] })
      notifications.show({ 
        color: 'green', 
        message: 'Рейтинг лиги пересчитан' 
      })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка пересчета рейтинга' })
    }
  })
}

export function useLeagueSeasonStats(leagueId: string | undefined, season: string | undefined) {
  return useQuery({
    queryKey: ['league-season-stats', leagueId, season],
    queryFn: () => getLeagueSeasonStats(leagueId!, season!),
    enabled: !!leagueId && !!season
  })
}

// === ПРИГЛАШЕНИЯ В ЛИГИ ===

// Получение приглашений лиги
export function useLeagueInvitations(leagueId: string | undefined) {
  return useQuery({
    queryKey: ['league-invitations', leagueId],
    queryFn: () => fetchLeagueInvitations(leagueId!),
    enabled: !!leagueId
  })
}

// Получение всех приглашений пользователя
export function useUserInvitations(userEmail: string | undefined) {
  return useQuery({
    queryKey: ['user-invitations', userEmail],
    queryFn: () => fetchUserInvitations(userEmail!),
    enabled: !!userEmail
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
      queryClient.invalidateQueries({ queryKey: ['league-invitations'] })
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
    onSuccess: (_, _invitationId) => {
      // Инвалидируем все запросы приглашений
      queryClient.invalidateQueries({ queryKey: ['league-invitations'] })
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
    onSuccess: (data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-invitations'] })
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

// Массовое добавление участников через CSV
export function useBulkAddParticipants() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bulkAddParticipants,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['league-invitations'] })
      notifications.show({
        color: 'green',
        title: 'Участники добавлены',
        message: `Успешно добавлено ${data.success} участников${data.errors.length > 0 ? `, ${data.errors.length} ошибок` : ''}`
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка массового добавления',
        message: error.message || 'Не удалось добавить участников'
      })
    }
  })
}
