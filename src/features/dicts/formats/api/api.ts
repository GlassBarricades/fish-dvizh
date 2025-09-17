import { supabase } from '@/lib/supabaseClient'
import type { CompetitionFormat, CreateCompetitionFormatInput, UpdateCompetitionFormatInput } from '../model/types'

const TABLE = 'dict_competition_formats'

export async function fetchCompetitionFormats(): Promise<CompetitionFormat[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('name')
  if (error) throw error
  return data as CompetitionFormat[]
}

export async function createCompetitionFormat(input: CreateCompetitionFormatInput): Promise<CompetitionFormat> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as CompetitionFormat
}

export async function updateCompetitionFormat(id: string, input: UpdateCompetitionFormatInput): Promise<CompetitionFormat> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as CompetitionFormat
}

export async function deleteCompetitionFormat(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}


