import { supabase } from '../../../lib/supabaseClient'

export type BaitType = {
  id: string
  name: string
  created_at: string
}

const TABLE = 'dict_bait_types'

export async function listBaitTypes(): Promise<BaitType[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data || []) as BaitType[]
}

export async function createBaitType(name: string): Promise<BaitType> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name })
    .select('*')
    .single()
  if (error) throw error
  return data as BaitType
}

export async function updateBaitType(id: string, name: string): Promise<BaitType> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ name })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as BaitType
}

export async function deleteBaitType(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}


