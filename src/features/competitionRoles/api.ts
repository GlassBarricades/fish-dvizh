import { supabase } from '../../lib/supabaseClient'
import type { CompetitionRole, AssignRoleInput } from './types'

const TABLE = 'competition_roles'

export async function listCompetitionRoles(competitionId: string): Promise<CompetitionRole[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('competition_id,user_id,role,created_at')
      .eq('competition_id', competitionId)
    if (error) throw error
    const rows = (data as any[]) || []
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)))
    let usersMap: Record<string, { email?: string | null; nickname?: string | null }> = {}
    if (userIds.length > 0) {
      const { data: users, error: uerr } = await supabase.from('users').select('id,email,raw_user_meta_data').in('id', userIds)
      if (uerr) throw uerr
      usersMap = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, nickname: u.raw_user_meta_data?.nickname }]))
    }
    return rows.map((r) => ({
      competition_id: r.competition_id,
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      user_email: usersMap[r.user_id]?.email ?? null,
      user_nickname: usersMap[r.user_id]?.nickname ?? null,
    }))
  } catch (e: any) {
    // Fallback if table does not exist: infer roles
    const roles: CompetitionRole[] = []
    // organizer from competition.created_by
    const { data: comp } = await supabase.from('competitions').select('id,created_by,created_at').eq('id', competitionId).maybeSingle()
    if (comp?.created_by) {
      roles.push({ competition_id: competitionId, user_id: comp.created_by, role: 'organizer' as any, created_at: comp.created_at, user_email: null, user_nickname: null })
    }
    // zone judges from competition_judges
    const { data: judges } = await supabase.from('competition_judges').select('user_id, created_at').eq('competition_id', competitionId)
    for (const j of (judges as any[]) || []) {
      roles.push({ competition_id: competitionId, user_id: j.user_id, role: 'zone_judge' as any, created_at: j.created_at, user_email: null, user_nickname: null })
    }
    // Fetch users metadata
    const userIds = Array.from(new Set(roles.map(r => r.user_id)))
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id,email,raw_user_meta_data').in('id', userIds)
      const map = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, nickname: u.raw_user_meta_data?.nickname }]))
      for (const r of roles) {
        r.user_email = map[r.user_id]?.email ?? null
        r.user_nickname = map[r.user_id]?.nickname ?? null
      }
    }
    return roles
  }
}

export async function assignCompetitionRole(input: AssignRoleInput): Promise<void> {
  if (input.role === 'zone_judge') {
    const { error } = await supabase.from('competition_judges').upsert({ competition_id: input.competition_id, user_id: input.user_id }, { onConflict: 'competition_id,user_id' })
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from(TABLE)
    .upsert({ competition_id: input.competition_id, user_id: input.user_id, role: input.role }, { onConflict: 'competition_id,user_id,role' })
  if (error) throw error
}

export async function removeCompetitionRole(competitionId: string, userId: string, role: string): Promise<void> {
  if (role === 'zone_judge') {
    const { error } = await supabase.from('competition_judges').delete().eq('competition_id', competitionId).eq('user_id', userId)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
    .eq('role', role)
  if (error) throw error
}


