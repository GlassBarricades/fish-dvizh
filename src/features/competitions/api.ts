import { supabase } from '../../lib/supabaseClient'
import type { Competition, CreateCompetitionInput, UpdateCompetitionInput, CompetitionFishKind } from './types'

const TABLE = 'competitions'

export async function fetchCompetitions(): Promise<Competition[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('starts_at', { ascending: true })
  if (error) throw error
  return data as Competition[]
}

export async function createCompetition(input: CreateCompetitionInput): Promise<Competition> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as Competition
}

export async function updateCompetition(id: string, input: UpdateCompetitionInput): Promise<Competition> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Competition
}

export async function deleteCompetition(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

// Junction table for many-to-many competition -> fish kinds
const FISH_TABLE = 'competition_fish_kinds'

export async function listAllCompetitionFishKinds(): Promise<CompetitionFishKind[]> {
  const { data, error } = await supabase.from(FISH_TABLE).select('competition_id, fish_kind_id')
  if (error) throw error
  return data as CompetitionFishKind[]
}

export async function listCompetitionFishKinds(competitionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(FISH_TABLE)
    .select('fish_kind_id')
    .eq('competition_id', competitionId)
  if (error) throw error
  return (data as { fish_kind_id: string }[]).map((r) => r.fish_kind_id)
}

export async function setCompetitionFishKinds(competitionId: string, fishKindIds: string[]): Promise<void> {
  // Replace strategy: delete all then insert selected
  const del = await supabase.from(FISH_TABLE).delete().eq('competition_id', competitionId)
  if (del.error) throw del.error
  if (fishKindIds.length === 0) return
  const insertPayload = fishKindIds.map((id) => ({ competition_id: competitionId, fish_kind_id: id }))
  const ins = await supabase.from(FISH_TABLE).insert(insertPayload)
  if (ins.error) throw ins.error
}


