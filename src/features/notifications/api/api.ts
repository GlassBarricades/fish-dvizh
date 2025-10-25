// API функции для системы уведомлений
// Создайте файл src/features/notifications/api/api.ts

import { supabase } from '@/lib/supabaseClient'

export interface Notification {
  id: string
  user_id: string
  league_id?: string
  type: 'invitation' | 'league_update' | 'competition_reminder' | 'results_available' | 'custom'
  title: string
  message: string
  email?: string
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  sent_at?: string
  created_at: string
  metadata: Record<string, any>
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  variables: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateNotificationInput {
  user_id?: string
  league_id?: string
  type: Notification['type']
  title: string
  message: string
  email?: string
  metadata?: Record<string, any>
}

export interface SendEmailInput {
  to: string
  template_name: string
  variables: Record<string, any>
  league_id?: string
}

// Получение уведомлений пользователя
export async function fetchUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Notification[]
}

// Получение уведомлений лиги
export async function fetchLeagueNotifications(leagueId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Notification[]
}

// Создание уведомления
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...input,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data as Notification
}

// Массовое создание уведомлений
export async function createBulkNotifications(notifications: CreateNotificationInput[]): Promise<Notification[]> {
  const notificationsWithStatus = notifications.map(notification => ({
    ...notification,
    status: 'pending' as const
  }))

  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationsWithStatus)
    .select()

  if (error) throw error
  return data as Notification[]
}

// Обновление статуса уведомления
export async function updateNotificationStatus(
  notificationId: string, 
  status: Notification['status'],
  sentAt?: string
): Promise<Notification> {
  const updateData: any = { status }
  if (sentAt) updateData.sent_at = sentAt

  const { data, error } = await supabase
    .from('notifications')
    .update(updateData)
    .eq('id', notificationId)
    .select()
    .single()

  if (error) throw error
  return data as Notification
}

// Получение шаблона email
export async function fetchEmailTemplate(templateName: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', templateName)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw error
  }
  return data as EmailTemplate
}

// Получение всех шаблонов
export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('name')

  if (error) throw error
  return data as EmailTemplate[]
}

// Создание/обновление шаблона
export async function upsertEmailTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .upsert({
      ...template,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailTemplate
}

// Отправка email (заглушка - в реальном проекте здесь будет интеграция с email сервисом)
export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; messageId?: string }> {
  // Получаем шаблон
  const template = await fetchEmailTemplate(input.template_name)
  if (!template) {
    throw new Error(`Template ${input.template_name} not found`)
  }

  // Заменяем переменные в шаблоне
  const subject = replaceVariables(template.subject, input.variables)
  const htmlContent = replaceVariables(template.html_content, input.variables)
  const textContent = template.text_content ? replaceVariables(template.text_content, input.variables) : undefined

  // Создаем уведомление
  const notification = await createNotification({
    league_id: input.league_id,
    type: 'custom',
    title: subject,
    message: textContent || htmlContent,
    email: input.to,
    metadata: {
      template_name: input.template_name,
      variables: input.variables,
      html_content: htmlContent
    }
  })

  // В реальном проекте здесь будет отправка через email сервис (SendGrid, Mailgun, etc.)
  // Пока что просто симулируем отправку
  console.log('Sending email:', {
    to: input.to,
    subject,
    htmlContent,
    textContent
  })

  // Обновляем статус на "отправлено"
  await updateNotificationStatus(notification.id, 'sent', new Date().toISOString())

  return {
    success: true,
    messageId: notification.id
  }
}

// Отправка приглашения в лигу
export async function sendLeagueInvitationEmail(
  email: string,
  leagueId: string,
  invitationToken: string
): Promise<{ success: boolean; messageId?: string }> {
  // Получаем информацию о лиге
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('name, season, description, start_date, end_date')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    throw new Error('League not found')
  }

  // Получаем приглашение для получения даты истечения
  const { data: invitation, error: invitationError } = await supabase
    .from('league_invitations')
    .select('expires_at')
    .eq('token', invitationToken)
    .single()

  if (invitationError || !invitation) {
    throw new Error('Invitation not found')
  }

  const variables = {
    league_name: league.name,
    league_season: league.season,
    league_description: league.description || 'Описание не указано',
    league_start_date: new Date(league.start_date).toLocaleDateString('ru-RU'),
    league_end_date: new Date(league.end_date).toLocaleDateString('ru-RU'),
    invitation_link: `${window.location.origin}/invitation/${invitationToken}`,
    expires_at: new Date(invitation.expires_at).toLocaleDateString('ru-RU')
  }

  return sendEmail({
    to: email,
    template_name: 'league_invitation',
    variables,
    league_id: leagueId
  })
}

// Массовая отправка приглашений
export async function sendBulkInvitationEmails(
  invitations: Array<{ email: string; token: string }>,
  leagueId: string
): Promise<{ success: number; errors: Array<{ email: string; error: string }> }> {
  const results = {
    success: 0,
    errors: [] as Array<{ email: string; error: string }>
  }

  for (const invitation of invitations) {
    try {
      await sendLeagueInvitationEmail(invitation.email, leagueId, invitation.token)
      results.success++
    } catch (error) {
      results.errors.push({
        email: invitation.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

// Вспомогательная функция для замены переменных в шаблоне
function replaceVariables(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match
  })
}

// Получение статистики уведомлений
export async function getNotificationStats(leagueId?: string): Promise<{
  total: number
  pending: number
  sent: number
  failed: number
  delivered: number
}> {
  let query = supabase
    .from('notifications')
    .select('status')

  if (leagueId) {
    query = query.eq('league_id', leagueId)
  }

  const { data, error } = await query

  if (error) throw error

  const stats = {
    total: data.length,
    pending: data.filter(n => n.status === 'pending').length,
    sent: data.filter(n => n.status === 'sent').length,
    failed: data.filter(n => n.status === 'failed').length,
    delivered: data.filter(n => n.status === 'delivered').length
  }

  return stats
}