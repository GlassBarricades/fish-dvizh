import { supabase } from '@/lib/supabaseClient'
import type { CompetitionParticipant, CompetitionResult, CreateResultInput, UpdateResultInput } from '../model/types'

const TABLE = 'competition_results'
const CHECKINS = 'competition_checkins'

export async function fetchCompetitionParticipants(competitionId: string): Promise<CompetitionParticipant[]> {
  const { data: solo, error: soloErr } = await supabase
    .from('solo_participations')
    .select('user_id')
    .eq('competition_id', competitionId)
    .in('status', ['registered','confirmed'])
  if (soloErr) throw soloErr
  const soloIds = (solo ?? []).map((r: any) => r.user_id).filter((id: any) => typeof id === 'string' && id.length > 0)

  const { data: teams, error: teamErr } = await supabase
    .from('team_participations')
    .select('participant_user_ids')
    .eq('competition_id', competitionId)
    .in('status', ['registered','confirmed'])
  if (teamErr) throw teamErr
  const teamIds = new Set<string>()
  for (const row of teams ?? []) {
    for (const uid of (row.participant_user_ids ?? [])) {
      if (typeof uid === 'string' && uid.length > 0) teamIds.add(uid)
    }
  }

  const allIds = Array.from(new Set<string>([...soloIds, ...Array.from(teamIds)]))
  if (allIds.length === 0) return []

  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id,email,raw_user_meta_data')
    .in('id', allIds)
  if (usersErr) throw usersErr

  const { data: checkins, error: chErr } = await supabase
    .from(CHECKINS)
    .select('user_id, checked_in')
    .eq('competition_id', competitionId)
  if (chErr) throw chErr
  const byId = new Map<string, boolean>((checkins ?? []).map((r: any) => [r.user_id, !!r.checked_in]))
  return (users ?? []).map((u: any) => ({ user_id: u.id, user_email: u.email, user_nickname: u.raw_user_meta_data?.nickname, checked_in: byId.get(u.id) ?? false }))
}

export async function listResults(competitionId: string): Promise<CompetitionResult[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, competition_id, participant_user_id, fish_kind_id, weight_grams, length_cm, created_by, created_at')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data as any[]) || []

  const userIds = Array.from(new Set(rows.map((r) => r.participant_user_id).filter((id: any) => typeof id === 'string' && id.length > 0)))
  const fishIds = Array.from(new Set(rows.map((r) => r.fish_kind_id).filter((id: any) => typeof id === 'string' && id.length > 0)))

  let usersMap: Record<string, { email?: string | null; nickname?: string | null }> = {}
  if (userIds.length > 0) {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id,email,raw_user_meta_data')
      .in('id', userIds)
    if (usersErr) throw usersErr
    usersMap = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, nickname: u.raw_user_meta_data?.nickname }]))
  }

  let fishMap: Record<string, { name?: string | null }> = {}
  if (fishIds.length > 0) {
    const { data: fish, error: fishErr } = await supabase
      .from('dict_fish_kinds')
      .select('id,name')
      .in('id', fishIds)
    if (fishErr) throw fishErr
    fishMap = Object.fromEntries((fish || []).map((f: any) => [f.id, { name: f.name }]))
  }

  return rows.map((r) => ({
    id: r.id,
    competition_id: r.competition_id,
    participant_user_id: r.participant_user_id,
    fish_kind_id: r.fish_kind_id,
    weight_grams: r.weight_grams,
    length_cm: r.length_cm,
    created_by: r.created_by,
    created_at: r.created_at,
    user_email: usersMap[r.participant_user_id]?.email ?? null,
    user_nickname: usersMap[r.participant_user_id]?.nickname ?? null,
    fish_name: fishMap[r.fish_kind_id]?.name ?? null,
  }))
}

export async function createResult(input: CreateResultInput, createdBy: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .insert({ ...input, created_by: createdBy })
  if (error) throw error
}

export async function updateResult(id: string, input: UpdateResultInput): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
  if (error) throw error
}

export async function deleteResult(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function setParticipantCheckin(competitionId: string, userId: string, checked: boolean): Promise<void> {
  const { error } = await supabase
    .from(CHECKINS)
    .upsert({ competition_id: competitionId, user_id: userId, checked_in: checked }, { onConflict: 'competition_id,user_id' })
  if (error) throw error
}

export async function getUserZoneForRound(roundId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('round_zone_assignments')
    .select('zone_id')
    .eq('round_id', roundId)
    .eq('participant_user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as any)?.zone_id ?? null
}

export async function listResultsInRange(
  competitionId: string,
  fromIso?: string | null,
  toIso?: string | null
): Promise<Array<{ participant_user_id: string; weight_grams: number | null; length_cm: number | null; created_at: string }>> {
  let query = supabase
    .from(TABLE)
    .select('participant_user_id, weight_grams, length_cm, created_at')
    .eq('competition_id', competitionId)

  if (fromIso) query = query.gte('created_at', fromIso)
  if (toIso) query = query.lte('created_at', toIso)

  const { data, error } = await query
  if (error) throw error
  return (data as any[]) || []
}

export async function listTeamParticipants(
  competitionId: string
): Promise<Array<{ team_id: string; team_name?: string | null; participant_user_ids: string[] }>> {
  const { data, error } = await supabase
    .from('team_participations')
    .select('team_id, participant_user_ids, teams!inner(name)')
    .eq('competition_id', competitionId)
    .in('status', ['registered','confirmed'])
  if (error) throw error
  const rows = (data as any[]) || []
  return rows.map((r: any) => ({
    team_id: r.team_id,
    team_name: r.teams?.name ?? null,
    participant_user_ids: Array.isArray(r.participant_user_ids) ? r.participant_user_ids : [],
  }))
}


