import { supabase } from '../../lib/supabaseClient'
import type { Competition, CreateCompetitionInput, UpdateCompetitionInput } from './types'

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


