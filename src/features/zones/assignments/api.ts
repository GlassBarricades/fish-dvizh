import { supabase } from '../../../lib/supabaseClient'
import type { AssignJudgeInput, RoundZoneAssignment, DrawAssignmentsInput, ZoneJudge } from './types'

const JUDGES_TABLE = 'competition_zone_judges'
const ASSIGN_TABLE = 'round_zone_assignments'

export async function listZoneJudges(competitionId: string): Promise<ZoneJudge[]> {
  const { data, error } = await supabase
    .from(JUDGES_TABLE)
    .select('zone_id,user_id')
    .eq('competition_id', competitionId)
  if (error) throw error
  return (data as any[]) as ZoneJudge[]
}

export async function assignJudge(input: AssignJudgeInput & { competition_id: string }): Promise<void> {
  const { error } = await supabase.from(JUDGES_TABLE).upsert({
    competition_id: input.competition_id,
    zone_id: input.zone_id,
    user_id: input.user_id,
  }, { onConflict: 'competition_id,zone_id,user_id' })
  if (error) throw error
}

export async function listRoundAssignments(roundId: string): Promise<RoundZoneAssignment[]> {
  const { data, error } = await supabase
    .from(ASSIGN_TABLE)
    .select('round_id,participant_user_id,zone_id')
    .eq('round_id', roundId)
  if (error) throw error
  return (data as any[]) as RoundZoneAssignment[]
}

export async function drawAssignments({ competition_id, round_id }: DrawAssignmentsInput): Promise<RoundZoneAssignment[]> {
  // Fetch all participants and zones
  const [{ data: zones, error: zErr }, { data: solo, error: sErr }, { data: teams, error: tErr }] = await Promise.all([
    supabase.from('competition_zones').select('id').eq('competition_id', competition_id),
    supabase.from('solo_participations').select('user_id').eq('competition_id', competition_id).in('status', ['registered','confirmed']),
    supabase.from('team_participations').select('participant_user_ids').eq('competition_id', competition_id).in('status', ['registered','confirmed']),
  ])
  if (zErr) throw zErr
  if (sErr) throw sErr
  if (tErr) throw tErr

  const userIds: string[] = []
  for (const r of solo ?? []) if (r.user_id) userIds.push(r.user_id)
  for (const row of teams ?? []) for (const uid of (row.participant_user_ids ?? [])) if (uid) userIds.push(uid)
  const uniqueUsers = Array.from(new Set(userIds))
  const zoneIds = (zones ?? []).map((z: any) => z.id)
  if (uniqueUsers.length === 0 || zoneIds.length === 0) return []

  // Simple round-robin shuffle
  const shuffled = [...uniqueUsers].sort(() => Math.random() - 0.5)
  const assignments = shuffled.map((uid, i) => ({ round_id, participant_user_id: uid, zone_id: zoneIds[i % zoneIds.length] }))

  const { data, error } = await supabase
    .from(ASSIGN_TABLE)
    .upsert(assignments, { onConflict: 'round_id,participant_user_id' })
    .select('round_id,participant_user_id,zone_id')
  if (error) throw error
  return data as any
}


