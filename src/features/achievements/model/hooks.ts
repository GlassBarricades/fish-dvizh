import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useAuth } from '@/features/auth/hooks'
import {
  fetchAchievements,
  fetchAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  fetchUserAchievements,
  fetchUserAchievementStats,
  checkAndAwardAchievements,
  fetchRewards,
  fetchReward,
  createReward,
  updateReward,
  deleteReward,
  fetchUserRewards,
  checkAndAwardRewards
} from '../api/api'
import type {
  Achievement,
  UserAchievement,
  UserAchievementStats,
  CreateAchievementInput,
  UpdateAchievementInput,
  AchievementFilters,
  Reward,
  UserReward,
  CreateRewardInput,
  UpdateRewardInput
} from '../model/types'

// === ДОСТИЖЕНИЯ ===

export function useAchievements(filters?: AchievementFilters) {
  return useQuery({
    queryKey: ['achievements', filters],
    queryFn: () => fetchAchievements(filters)
  })
}

export function useAchievement(achievementId: string | undefined) {
  return useQuery({
    queryKey: ['achievement', achievementId],
    queryFn: () => fetchAchievement(achievementId!),
    enabled: !!achievementId
  })
}

export function useCreateAchievement() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (input: CreateAchievementInput) => createAchievement(input, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      notifications.show({ color: 'green', message: 'Достижение создано' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка создания достижения' })
    }
  })
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ achievementId, input }: { achievementId: string; input: UpdateAchievementInput }) => 
      updateAchievement(achievementId, input),
    onSuccess: (_, { achievementId }) => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      queryClient.invalidateQueries({ queryKey: ['achievement', achievementId] })
      notifications.show({ color: 'green', message: 'Достижение обновлено' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обновления достижения' })
    }
  })
}

export function useDeleteAchievement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      notifications.show({ color: 'green', message: 'Достижение удалено' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка удаления достижения' })
    }
  })
}

// === ПОЛЬЗОВАТЕЛЬСКИЕ ДОСТИЖЕНИЯ ===

export function useUserAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => fetchUserAchievements(userId!),
    enabled: !!userId
  })
}

export function useUserAchievementStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-achievement-stats', userId],
    queryFn: () => fetchUserAchievementStats(userId!),
    enabled: !!userId
  })
}

export function useCheckAndAwardAchievements() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, context }: { userId: string; context: any }) => 
      checkAndAwardAchievements(userId, context),
    onSuccess: (newAchievements, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-achievement-stats', userId] })
      
      if (newAchievements.length > 0) {
        notifications.show({ 
          color: 'green', 
          message: `Получено ${newAchievements.length} новых достижений!` 
        })
      }
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка проверки достижений' })
    }
  })
}

// === НАГРАДЫ ===

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: fetchRewards
  })
}

export function useReward(rewardId: string | undefined) {
  return useQuery({
    queryKey: ['reward', rewardId],
    queryFn: () => fetchReward(rewardId!),
    enabled: !!rewardId
  })
}

export function useCreateReward() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (input: CreateRewardInput) => createReward(input, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      notifications.show({ color: 'green', message: 'Награда создана' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка создания награды' })
    }
  })
}

export function useUpdateReward() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ rewardId, input }: { rewardId: string; input: UpdateRewardInput }) => 
      updateReward(rewardId, input),
    onSuccess: (_, { rewardId }) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      queryClient.invalidateQueries({ queryKey: ['reward', rewardId] })
      notifications.show({ color: 'green', message: 'Награда обновлена' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка обновления награды' })
    }
  })
}

export function useDeleteReward() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      notifications.show({ color: 'green', message: 'Награда удалена' })
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка удаления награды' })
    }
  })
}

// === ПОЛЬЗОВАТЕЛЬСКИЕ НАГРАДЫ ===

export function useUserRewards(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-rewards', userId],
    queryFn: () => fetchUserRewards(userId!),
    enabled: !!userId
  })
}

export function useCheckAndAwardRewards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, leagueId, season }: { userId: string; leagueId: string; season: string }) => 
      checkAndAwardRewards(userId, leagueId, season),
    onSuccess: (newRewards, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-rewards', userId] })
      
      if (newRewards.length > 0) {
        notifications.show({ 
          color: 'green', 
          message: `Получено ${newRewards.length} новых наград!` 
        })
      }
    },
    onError: (error: any) => {
      notifications.show({ color: 'red', message: error?.message || 'Ошибка проверки наград' })
    }
  })
}

// === УТИЛИТАРНЫЕ ХУКИ ===

// Получает достижения пользователя по категориям
export function useUserAchievementsByCategory(userId: string | undefined) {
  const { data: stats } = useUserAchievementStats(userId)
  
  return {
    categories: stats?.achievements_by_category || {},
    total: stats?.total_achievements || 0,
    points: stats?.total_points || 0
  }
}

// Получает достижения пользователя по редкости
export function useUserAchievementsByRarity(userId: string | undefined) {
  const { data: stats } = useUserAchievementStats(userId)
  
  return {
    rarities: stats?.achievements_by_rarity || {},
    total: stats?.total_achievements || 0
  }
}

// Получает последние достижения пользователя
export function useUserRecentAchievements(userId: string | undefined) {
  const { data: stats } = useUserAchievementStats(userId)
  
  return {
    recent: stats?.recent_achievements || [],
    count: stats?.recent_achievements?.length || 0
  }
}
