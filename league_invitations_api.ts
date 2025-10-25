// API функции для системы приглашений в лиги
// Добавьте эти функции в src/features/leagues/api/api.ts

import { supabase } from '@/lib/supabaseClient'

// === ПРИГЛАШЕНИЯ В ЛИГИ ===

export interface LeagueInvitation {
  id: string
  league_id: string
  email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  token: string
  expires_at: string
  created_at: string
  accepted_at?: string
}

export interface CreateInvitationInput {
  league_id: string
  email: string
  invited_by: string
  expires_in_days?: number
}

export interface AcceptInvitationInput {
  token: string
  user_id: string
}

// Создание приглашения в лигу
export async function createLeagueInvitation(input: CreateInvitationInput): Promise<LeagueInvitation> {
  const { league_id, email, invited_by, expires_in_days = 7 } = input
  
  // Проверяем, что пользователь с таким email еще не приглашен в эту лигу
  const { data: existingInvitation } = await supabase
    .from('league_invitations')
    .select('id, status')
    .eq('league_id', league_id)
    .eq('email', email)
    .single()

  if (existingInvitation) {
    if (existingInvitation.status === 'pending') {
      throw new Error('Пользователь уже приглашен в эту лигу')
    }
    if (existingInvitation.status === 'accepted') {
      throw new Error('Пользователь уже является участником этой лиги')
    }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expires_in_days)

  const { data, error } = await supabase
    .from('league_invitations')
    .insert({
      league_id,
      email,
      invited_by,
      expires_at: expiresAt.toISOString(),
      token: generateInvitationToken()
    })
    .select()
    .single()

  if (error) throw error
  return data as LeagueInvitation
}

// Получение приглашений лиги
export async function fetchLeagueInvitations(leagueId: string): Promise<LeagueInvitation[]> {
  const { data, error } = await supabase
    .from('league_invitations')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as LeagueInvitation[]
}

// Получение приглашения по токену
export async function fetchInvitationByToken(token: string): Promise<LeagueInvitation | null> {
  const { data, error } = await supabase
    .from('league_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw error
  }
  return data as LeagueInvitation
}

// Принятие приглашения
export async function acceptLeagueInvitation(input: AcceptInvitationInput): Promise<void> {
  const { token, user_id } = input

  // Получаем приглашение
  const invitation = await fetchInvitationByToken(token)
  if (!invitation) {
    throw new Error('Приглашение не найдено')
  }

  if (invitation.status !== 'pending') {
    throw new Error('Приглашение уже обработано')
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('Приглашение истекло')
  }

  // Начинаем транзакцию
  const { error: updateError } = await supabase
    .from('league_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitation.id)

  if (updateError) throw updateError

  // Добавляем пользователя в лигу
  const { error: joinError } = await supabase
    .from('league_participations')
    .insert({
      league_id: invitation.league_id,
      user_id: user_id,
      class: 'open',
      current_rating: 0,
      total_points: 0,
      competitions_count: 0
    })

  if (joinError) throw joinError
}

// Отклонение приглашения
export async function declineLeagueInvitation(token: string): Promise<void> {
  const { error } = await supabase
    .from('league_invitations')
    .update({ status: 'declined' })
    .eq('token', token)

  if (error) throw error
}

// Отзыв приглашения
export async function revokeLeagueInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('league_invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId)

  if (error) throw error
}

// Повторная отправка приглашения
export async function resendLeagueInvitation(invitationId: string): Promise<LeagueInvitation> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase
    .from('league_invitations')
    .update({
      status: 'pending',
      token: generateInvitationToken(),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single()

  if (error) throw error
  return data as LeagueInvitation
}

// Массовое создание приглашений
export async function createBulkLeagueInvitations(
  leagueId: string, 
  emails: string[], 
  invitedBy: string
): Promise<LeagueInvitation[]> {
  const invitations = emails.map(email => ({
    league_id: leagueId,
    email: email.trim().toLowerCase(),
    invited_by: invitedBy,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней
    token: generateInvitationToken()
  }))

  const { data, error } = await supabase
    .from('league_invitations')
    .insert(invitations)
    .select()

  if (error) throw error
  return data as LeagueInvitation[]
}

// Вспомогательная функция для генерации токена
function generateInvitationToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
