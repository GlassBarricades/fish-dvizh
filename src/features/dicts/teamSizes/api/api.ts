import { supabase } from '@/lib/supabaseClient'
import type { TeamSize, CreateTeamSizeInput, UpdateTeamSizeInput } from '../model/types'

const TABLE = 'dict_team_sizes'

export async function fetchTeamSizes(): Promise<TeamSize[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('size', { ascending: true })
  if (error) throw error
  return data as TeamSize[]
}

export async function createTeamSize(input: CreateTeamSizeInput): Promise<TeamSize> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as TeamSize
}

export async function updateTeamSize(id: string, input: UpdateTeamSizeInput): Promise<TeamSize> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as TeamSize
}

export async function deleteTeamSize(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}


