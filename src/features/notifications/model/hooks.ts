// React Query хуки для системы уведомлений
// Создайте файл src/features/notifications/model/hooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { supabase } from '@/lib/supabaseClient'
import {
  fetchUserNotifications,
  fetchLeagueNotifications,
  createNotification,
  createBulkNotifications,
  updateNotificationStatus,
  fetchEmailTemplate,
  fetchEmailTemplates,
  upsertEmailTemplate,
  sendEmail,
  sendLeagueInvitationEmail,
  sendBulkInvitationEmails,
  getNotificationStats
} from '../api/api'
import type {
  Notification,
  EmailTemplate,
  CreateNotificationInput,
  SendEmailInput
} from '../api/api'

// Получение уведомлений пользователя
export function useUserNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-notifications', userId],
    queryFn: () => fetchUserNotifications(userId!),
    enabled: !!userId
  })
}

// Получение уведомлений лиги
export function useLeagueNotifications(leagueId: string | undefined) {
  return useQuery({
    queryKey: ['league-notifications', leagueId],
    queryFn: () => fetchLeagueNotifications(leagueId!),
    enabled: !!leagueId
  })
}

// Создание уведомления
export function useCreateNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createNotification,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['league-notifications'] })
      notifications.show({
        color: 'green',
        title: 'Уведомление создано',
        message: 'Уведомление успешно создано'
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка создания уведомления',
        message: error.message || 'Не удалось создать уведомление'
      })
    }
  })
}

// Массовое создание уведомлений
export function useCreateBulkNotifications() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createBulkNotifications,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['league-notifications'] })
      notifications.show({
        color: 'green',
        title: 'Уведомления созданы',
        message: `Создано ${data.length} уведомлений`
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка массового создания',
        message: error.message || 'Не удалось создать уведомления'
      })
    }
  })
}

// Обновление статуса уведомления
export function useUpdateNotificationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ notificationId, status, sentAt }: {
      notificationId: string
      status: Notification['status']
      sentAt?: string
    }) => updateNotificationStatus(notificationId, status, sentAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['league-notifications'] })
    }
  })
}

// Получение шаблона email
export function useEmailTemplate(templateName: string | undefined) {
  return useQuery({
    queryKey: ['email-template', templateName],
    queryFn: () => fetchEmailTemplate(templateName!),
    enabled: !!templateName
  })
}

// Получение всех шаблонов
export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchEmailTemplates
  })
}

// Создание/обновление шаблона
export function useUpsertEmailTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: upsertEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      queryClient.invalidateQueries({ queryKey: ['email-template'] })
      notifications.show({
        color: 'green',
        title: 'Шаблон сохранен',
        message: 'Email шаблон успешно сохранен'
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка сохранения шаблона',
        message: error.message || 'Не удалось сохранить шаблон'
      })
    }
  })
}

// Отправка email
export function useSendEmail() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sendEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['league-notifications'] })
      notifications.show({
        color: 'green',
        title: 'Email отправлен',
        message: 'Email успешно отправлен'
      })
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка отправки email',
        message: error.message || 'Не удалось отправить email'
      })
    }
  })
}

// Отправка приглашения в лигу
export function useSendLeagueInvitationEmail() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ email, leagueId, invitationToken }: {
      email: string
      leagueId: string
      invitationToken: string
    }) => sendLeagueInvitationEmail(email, leagueId, invitationToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['league-notifications'] })
      notifications.show({
        color: 'green',
        title: 'Приглашение отправлено',
        message: 'Email с приглашением успешно отправлен'
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

// Массовая отправка приглашений
export function useSendBulkInvitationEmails() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ invitations, leagueId }: {
      invitations: Array<{ email: string; token: string }>
      leagueId: string
    }) => sendBulkInvitationEmails(invitations, leagueId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['league-notifications'] })
      notifications.show({
        color: 'green',
        title: 'Приглашения отправлены',
        message: `Отправлено ${data.success} приглашений${data.errors.length > 0 ? `, ${data.errors.length} ошибок` : ''}`
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

// Получение статистики уведомлений
export function useNotificationStats(leagueId?: string) {
  return useQuery({
    queryKey: ['notification-stats', leagueId],
    queryFn: () => getNotificationStats(leagueId)
  })
}

// Получение количества непрочитанных уведомлений пользователя
export function useUnreadNotificationsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['unread-notifications-count', userId],
    queryFn: async () => {
      if (!userId) return { count: 0 }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'sent')
      
      if (error) throw error
      return { count: data?.length || 0 }
    },
    enabled: !!userId
  })
}