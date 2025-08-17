import { supabase } from '../../lib/supabaseClient'
import type { Round, CreateRoundInput, UpdateRoundInput } from './types'

const TABLE = 'competition_rounds'

export async function listRounds(competitionId: string): Promise<Round[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('competition_id', competitionId)
    .order('index', { ascending: true })
  if (error) throw error
  return data as Round[]
}

export async function createRound(input: CreateRoundInput): Promise<Round> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as Round
}

export async function updateRound(id: string, input: UpdateRoundInput): Promise<Round> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Round
}

export async function deleteRound(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

// Push notifications temporarily disabled


