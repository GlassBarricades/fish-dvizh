import { supabase } from '../../../lib/supabaseClient'
import type { AssignJudgeInput, RoundZoneAssignment, DrawAssignmentsInput, DrawAllAssignmentsInput, ZoneJudge, PreviewAllAssignmentsInput, ApplyAssignmentsInput } from './types'

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

export async function drawAllAssignments({ competition_id }: DrawAllAssignmentsInput): Promise<void> {
  // Fetch zones, users with team info, and all round ids of the competition
  const [{ data: zones, error: zErr }, { data: solo, error: sErr }, { data: teams, error: tErr }, { data: rounds, error: rErr }] = await Promise.all([
    supabase.from('competition_zones').select('id').eq('competition_id', competition_id),
    supabase.from('solo_participations').select('user_id').eq('competition_id', competition_id).in('status', ['registered','confirmed']),
    supabase.from('team_participations').select('team_id,participant_user_ids').eq('competition_id', competition_id).in('status', ['registered','confirmed']),
    supabase.from('competition_rounds').select('id,index,kind').eq('competition_id', competition_id).order('index', { ascending: true }),
  ])
  if (zErr) throw zErr
  if (sErr) throw sErr
  if (tErr) throw tErr
  if (rErr) throw rErr

  const zoneIds = (zones ?? []).map((z: any) => z.id)
  const userIds: string[] = []
  const userToTeam: Record<string, string | null> = {}
  for (const r of solo ?? []) if (r.user_id) { userIds.push(r.user_id); userToTeam[r.user_id] = null }
  for (const row of teams ?? []) {
    const teamId = (row as any).team_id as string
    for (const uid of (row.participant_user_ids ?? [])) if (uid) { userIds.push(uid); if (!userToTeam[uid]) userToTeam[uid] = teamId }
  }
  const uniqueUsers = Array.from(new Set(userIds))
  if (uniqueUsers.length === 0 || zoneIds.length === 0) return

  // Filter only real rounds (kind === 'round') in order
  const roundIds = (rounds ?? []).filter((r: any) => r.kind === 'round').map((r: any) => r.id)
  if (roundIds.length === 0) return

  // Global rotation without repeating zone per user until all zones visited
  const shuffledUsers = [...uniqueUsers].sort(() => Math.random() - 0.5)

  // For each user we build a cyclic permutation of zones starting from an offset
  const userToZoneOrder: Record<string, string[]> = {}
  for (let i = 0; i < shuffledUsers.length; i++) {
    const uid = shuffledUsers[i]
    const offset = i % zoneIds.length
    const order = [...zoneIds.slice(offset), ...zoneIds.slice(0, offset)]
    userToZoneOrder[uid] = order
  }

  const assignments: { round_id: string; participant_user_id: string; zone_id: string }[] = []
  const edgeLeft = zoneIds[0]
  const edgeRight = zoneIds[zoneIds.length - 1]
  const userEdgeCount: Record<string, number> = {}
  for (let rIdx = 0; rIdx < roundIds.length; rIdx++) {
    const rid = roundIds[rIdx]
    const roundZoneTeams = new Map<string, Set<string>>()
    for (const zid of zoneIds) roundZoneTeams.set(zid, new Set())
    for (let uIdx = 0; uIdx < shuffledUsers.length; uIdx++) {
      const uid = shuffledUsers[uIdx]
      const teamId = userToTeam[uid] || null
      let zone = userToZoneOrder[uid][rIdx % zoneIds.length]
      // Try avoid placing multiple same-team members into the same zone in the same round
      if (teamId) {
        let attempts = 0
        while (attempts < zoneIds.length) {
          const occupiedTeams = roundZoneTeams.get(zone)!
          if (!occupiedTeams.has(teamId)) break
          // move to next zone circularly
          const idx = zoneIds.indexOf(zone)
          zone = zoneIds[(idx + 1) % zoneIds.length]
          attempts++
        }
      }
      // Balance edge zones: if user already had an edge and we have alternative, try choose non-edge
      const isEdge = zone === edgeLeft || zone === edgeRight
      if (isEdge && (userEdgeCount[uid] || 0) >= 1 && zoneIds.length > 2) {
        // try find nearest non-edge that doesn't violate team constraint
        for (let s = 0; s < zoneIds.length; s++) {
          const candidate = zoneIds[(zoneIds.indexOf(zone) + s) % zoneIds.length]
          if (candidate === edgeLeft || candidate === edgeRight) continue
          if (teamId) {
            const occupied = roundZoneTeams.get(candidate)!
            if (occupied.has(teamId)) continue
          }
          zone = candidate
          break
        }
      }
      if (zone === edgeLeft || zone === edgeRight) userEdgeCount[uid] = (userEdgeCount[uid] || 0) + 1
      assignments.push({ round_id: rid, participant_user_id: uid, zone_id: zone })
      if (teamId) roundZoneTeams.get(zone)!.add(teamId)
    }
  }

  const { error } = await supabase
    .from(ASSIGN_TABLE)
    .upsert(assignments, { onConflict: 'round_id,participant_user_id' })
  if (error) throw error
}

export async function previewAllAssignments({ competition_id, locked = [] }: PreviewAllAssignmentsInput): Promise<RoundZoneAssignment[]> {
  // Same as drawAllAssignments but without DB write
  const [{ data: zones, error: zErr }, { data: solo, error: sErr }, { data: teams, error: tErr }, { data: rounds, error: rErr }] = await Promise.all([
    supabase.from('competition_zones').select('id').eq('competition_id', competition_id),
    supabase.from('solo_participations').select('user_id').eq('competition_id', competition_id).in('status', ['registered','confirmed']),
    supabase.from('team_participations').select('team_id,participant_user_ids').eq('competition_id', competition_id).in('status', ['registered','confirmed']),
    supabase.from('competition_rounds').select('id,index,kind').eq('competition_id', competition_id).order('index', { ascending: true }),
  ])
  if (zErr) throw zErr
  if (sErr) throw sErr
  if (tErr) throw tErr
  if (rErr) throw rErr
  const zoneIds = (zones ?? []).map((z: any) => z.id)
  const userIds: string[] = []
  const userToTeam: Record<string, string | null> = {}
  for (const r of solo ?? []) if (r.user_id) { userIds.push(r.user_id); userToTeam[r.user_id] = null }
  for (const row of teams ?? []) {
    const teamId = (row as any).team_id as string
    for (const uid of (row.participant_user_ids ?? [])) if (uid) { userIds.push(uid); if (!userToTeam[uid]) userToTeam[uid] = teamId }
  }
  const uniqueUsers = Array.from(new Set(userIds))
  const roundIds = (rounds ?? []).filter((r: any) => r.kind === 'round').map((r: any) => r.id)
  if (uniqueUsers.length === 0 || zoneIds.length === 0 || roundIds.length === 0) return []

  const shuffledUsers = [...uniqueUsers].sort(() => Math.random() - 0.5)
  const userToZoneOrder: Record<string, string[]> = {}
  for (let i = 0; i < shuffledUsers.length; i++) {
    const uid = shuffledUsers[i]
    const offset = i % zoneIds.length
    userToZoneOrder[uid] = [...zoneIds.slice(offset), ...zoneIds.slice(0, offset)]
  }
  const edgeLeft = zoneIds[0]
  const edgeRight = zoneIds[zoneIds.length - 1]
  const userEdgeCount: Record<string, number> = {}
  const lockedKey = new Set((locked || []).map(l => `${l.round_id}::${l.participant_user_id}`))
  const lockedMap = new Map<string, string>((locked || []).map(l => [`${l.round_id}::${l.participant_user_id}`, l.zone_id]))
  const assignments: RoundZoneAssignment[] = []
  for (let rIdx = 0; rIdx < roundIds.length; rIdx++) {
    const rid = roundIds[rIdx]
    const roundZoneTeams = new Map<string, Set<string>>()
    for (const zid of zoneIds) roundZoneTeams.set(zid, new Set())
    for (const uid of shuffledUsers) {
      const lockKey = `${rid}::${uid}`
      if (lockedKey.has(lockKey)) {
        const zone = lockedMap.get(lockKey)!
        assignments.push({ round_id: rid, participant_user_id: uid, zone_id: zone })
        const teamId = userToTeam[uid] || null
        if (teamId) roundZoneTeams.get(zone)!.add(teamId)
        continue
      }
      const teamId = userToTeam[uid] || null
      let zone = userToZoneOrder[uid][rIdx % zoneIds.length]
      if (teamId) {
        let attempts = 0
        while (attempts < zoneIds.length) {
          const occupiedTeams = roundZoneTeams.get(zone)!
          if (!occupiedTeams.has(teamId)) break
          const idx = zoneIds.indexOf(zone)
          zone = zoneIds[(idx + 1) % zoneIds.length]
          attempts++
        }
      }
      const isEdge = zone === edgeLeft || zone === edgeRight
      if (isEdge && (userEdgeCount[uid] || 0) >= 1 && zoneIds.length > 2) {
        for (let s = 0; s < zoneIds.length; s++) {
          const candidate = zoneIds[(zoneIds.indexOf(zone) + s) % zoneIds.length]
          if (candidate === edgeLeft || candidate === edgeRight) continue
          if (teamId) {
            const occupied = roundZoneTeams.get(candidate)!
            if (occupied.has(teamId)) continue
          }
          zone = candidate
          break
        }
      }
      if (zone === edgeLeft || zone === edgeRight) userEdgeCount[uid] = (userEdgeCount[uid] || 0) + 1
      assignments.push({ round_id: rid, participant_user_id: uid, zone_id: zone })
      if (teamId) roundZoneTeams.get(zone)!.add(teamId)
    }
  }
  return assignments
}

export async function applyAssignments({ assignments }: ApplyAssignmentsInput): Promise<void> {
  if (!assignments || assignments.length === 0) return
  const { error } = await supabase
    .from(ASSIGN_TABLE)
    .upsert(assignments, { onConflict: 'round_id,participant_user_id' })
  if (error) throw error
}


