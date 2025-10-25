import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import {
  getBonuses,
  getBonus,
  createBonus,
  updateBonus,
  deleteBonus,
  getSpecialRules,
  getSpecialRule,
  createSpecialRule,
  updateSpecialRule,
  deleteSpecialRule,
  getUserBonuses,
  grantBonusToUser,
  useUserBonus,
  checkAndApplyBonuses,
  getBonusStats,
  getBonusSystemConfig,
  updateBonusSystemConfig
} from '../api/api'
import type {
  Bonus,
  SpecialRule,
  UserBonus,
  CreateBonusInput,
  UpdateBonusInput,
  CreateSpecialRuleInput,
  UpdateSpecialRuleInput,
  BonusApplicationResult,
  BonusStats,
  BonusSystemConfig
} from '../model/types'

// === УПРАВЛЕНИЕ БОНУСАМИ ===

export function useBonuses(leagueId?: string) {
  return useQuery({
    queryKey: ['bonuses', leagueId],
    queryFn: () => getBonuses(leagueId)
  })
}

export function useBonus(id: string) {
  return useQuery({
    queryKey: ['bonus', id],
    queryFn: () => getBonus(id),
    enabled: !!id
  })
}

export function useCreateBonus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      notifications.show({ color: 'green', message: 'Бонус успешно создан' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка создания бонуса' })
    }
  })
}

export function useUpdateBonus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBonusInput }) => updateBonus(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bonus', id] })
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      notifications.show({ color: 'green', message: 'Бонус успешно обновлен' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обновления бонуса' })
    }
  })
}

export function useDeleteBonus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      notifications.show({ color: 'green', message: 'Бонус успешно удален' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка удаления бонуса' })
    }
  })
}

// === УПРАВЛЕНИЕ СПЕЦИАЛЬНЫМИ ПРАВИЛАМИ ===

export function useSpecialRules(leagueId?: string, competitionId?: string) {
  return useQuery({
    queryKey: ['special-rules', leagueId, competitionId],
    queryFn: () => getSpecialRules(leagueId, competitionId)
  })
}

export function useSpecialRule(id: string) {
  return useQuery({
    queryKey: ['special-rule', id],
    queryFn: () => getSpecialRule(id),
    enabled: !!id
  })
}

export function useCreateSpecialRule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createSpecialRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-rules'] })
      notifications.show({ color: 'green', message: 'Специальное правило успешно создано' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка создания специального правила' })
    }
  })
}

export function useUpdateSpecialRule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSpecialRuleInput }) => updateSpecialRule(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['special-rule', id] })
      queryClient.invalidateQueries({ queryKey: ['special-rules'] })
      notifications.show({ color: 'green', message: 'Специальное правило успешно обновлено' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обновления специального правила' })
    }
  })
}

export function useDeleteSpecialRule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteSpecialRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-rules'] })
      notifications.show({ color: 'green', message: 'Специальное правило успешно удалено' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка удаления специального правила' })
    }
  })
}

// === ПОЛЬЗОВАТЕЛЬСКИЕ БОНУСЫ ===

export function useUserBonuses(userId: string, activeOnly = true) {
  return useQuery({
    queryKey: ['user-bonuses', userId, activeOnly],
    queryFn: () => getUserBonuses(userId, activeOnly),
    enabled: !!userId
  })
}

export function useGrantBonusToUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, bonusId }: { userId: string; bonusId: string }) => grantBonusToUser(userId, bonusId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-bonuses', userId] })
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      notifications.show({ color: 'green', message: 'Бонус успешно предоставлен пользователю' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка предоставления бонуса' })
    }
  })
}

export function useUseUserBonus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: useUserBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bonuses'] })
      notifications.show({ color: 'green', message: 'Бонус успешно использован' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка использования бонуса' })
    }
  })
}

// === ПРИМЕНЕНИЕ БОНУСОВ ===

export function useCheckAndApplyBonuses() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, competitionId, leagueId }: { userId: string; competitionId: string; leagueId?: string }) => 
      checkAndApplyBonuses(userId, competitionId, leagueId),
    onSuccess: (results) => {
      if (results.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user-bonuses'] })
        queryClient.invalidateQueries({ queryKey: ['bonuses'] })
        notifications.show({ 
          color: 'green', 
          message: `Применено ${results.length} бонусов` 
        })
      }
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка применения бонусов' })
    }
  })
}

// === СТАТИСТИКА БОНУСОВ ===

export function useBonusStats() {
  return useQuery({
    queryKey: ['bonus-stats'],
    queryFn: getBonusStats
  })
}

// === КОНФИГУРАЦИЯ СИСТЕМЫ БОНУСОВ ===

export function useBonusSystemConfig() {
  return useQuery({
    queryKey: ['bonus-system-config'],
    queryFn: getBonusSystemConfig
  })
}

export function useUpdateBonusSystemConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateBonusSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-system-config'] })
      notifications.show({ color: 'green', message: 'Конфигурация системы бонусов обновлена' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обновления конфигурации' })
    }
  })
}

// === УТИЛИТАРНЫЕ ХУКИ ===

// Хук для получения активных бонусов пользователя
export function useActiveUserBonuses(userId: string) {
  const { data: userBonuses } = useUserBonuses(userId, true)
  
  return {
    bonuses: userBonuses || [],
    count: userBonuses?.length || 0,
    hasActiveBonuses: (userBonuses?.length || 0) > 0
  }
}

// Хук для проверки доступности бонуса
export function useBonusAvailability(bonusId: string) {
  const { data: bonus } = useBonus(bonusId)
  
  return {
    isAvailable: bonus ? (
      bonus.is_active && 
      (!bonus.max_uses || bonus.current_uses < bonus.max_uses) &&
      (!bonus.expires_at || new Date(bonus.expires_at) > new Date())
    ) : false,
    remainingUses: bonus?.max_uses ? bonus.max_uses - bonus.current_uses : null,
    expiresAt: bonus?.expires_at
  }
}

// Хук для получения бонусов по типу
export function useBonusesByType(type: string, leagueId?: string) {
  const { data: bonuses } = useBonuses(leagueId)
  
  return bonuses?.filter(bonus => bonus.type === type) || []
}

// Хук для получения специальных правил по типу
export function useSpecialRulesByType(type: string, leagueId?: string, competitionId?: string) {
  const { data: rules } = useSpecialRules(leagueId, competitionId)
  
  return rules?.filter(rule => rule.type === type) || []
}
