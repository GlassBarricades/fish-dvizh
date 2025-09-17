import { supabase } from '@/lib/supabaseClient'
import type { CreateJudgeInvitationInput, JudgeInvitation, RespondJudgeInvitationInput, CompetitionJudge } from '../model/types'

const INVITES = 'competition_judge_invitations'
const JUDGES = 'competition_judges'

export async function createJudgeInvitation(input: CreateJudgeInvitationInput): Promise<void> {
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('id, email, raw_user_meta_data')
    .eq('email', input.invited_user_email)
    .maybeSingle()
  if (userErr) throw userErr

  const payload: any = {
    competition_id: input.competition_id,
    invited_user_email: input.invited_user_email,
    invited_by: input.invited_by,
    status: 'pending',
  }
  if (userRow?.id) payload.invited_user_id = userRow.id

  const { error } = await supabase.from(INVITES).insert(payload)
  if (error) throw error
}

export async function fetchCompetitionJudges(competitionId: string): Promise<CompetitionJudge[]> {
  const { data, error } = await supabase
    .from(JUDGES)
    .select('competition_id, user_id, created_at')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data as any[]) || []
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter((id: any) => typeof id === 'string' && id.length > 0)))
  let usersMap: Record<string, { email?: string | null; nickname?: string | null }> = {}
  if (userIds.length > 0) {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id,email,raw_user_meta_data')
      .in('id', userIds)
    if (usersErr) throw usersErr
    usersMap = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, nickname: u.raw_user_meta_data?.nickname }]))
  }
  return rows.map((r) => ({
    competition_id: r.competition_id,
    user_id: r.user_id,
    created_at: r.created_at,
    user_email: usersMap[r.user_id]?.email ?? null,
    user_nickname: usersMap[r.user_id]?.nickname ?? null,
  }))
}

export async function isUserJudge(competitionId: string, userId?: string): Promise<boolean> {
  if (!competitionId || !userId) return false
  const { data, error } = await supabase
    .from(JUDGES)
    .select('user_id')
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

export async function fetchUserJudgeInvitations(userId: string): Promise<JudgeInvitation[]> {
  const { data, error } = await supabase
    .from(INVITES)
    .select('id, competition_id, invited_user_id, invited_user_email, invited_by, status, created_at, competitions:competition_id(title)')
    .eq('invited_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as any[]).map((r) => ({
    id: r.id,
    competition_id: r.competition_id,
    invited_user_id: r.invited_user_id,
    invited_user_email: r.invited_user_email,
    invited_by: r.invited_by,
    status: r.status,
    created_at: r.created_at,
    competition_title: r.competitions?.title,
  }))
}

export async function respondJudgeInvitation(input: RespondJudgeInvitationInput, userId: string): Promise<void> {
  const { data: invitation, error: invErr } = await supabase
    .from(INVITES)
    .select('*')
    .eq('id', input.invitation_id)
    .single()
  if (invErr) throw invErr
  if (!invitation) throw new Error('Приглашение не найдено')
  if (invitation.status !== 'pending') throw new Error('Приглашение уже обработано')

  const { error: updErr } = await supabase
    .from(INVITES)
    .update({ status: input.accept ? 'accepted' : 'declined' })
    .eq('id', input.invitation_id)
  if (updErr) throw updErr

  if (input.accept) {
    const invitedUserId = invitation.invited_user_id || userId
    const { error: addErr } = await supabase
      .from(JUDGES)
      .upsert({ competition_id: invitation.competition_id, user_id: invitedUserId })
    if (addErr) throw addErr
  }
}


