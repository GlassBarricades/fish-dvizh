import { supabase } from '../../../lib/supabaseClient'

export type BaitManufacturer = {
  id: string
  name: string
  created_at: string
}

const TABLE = 'dict_bait_manufacturers'

export async function listBaitManufacturers(): Promise<BaitManufacturer[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data || []) as BaitManufacturer[]
}

export async function createBaitManufacturer(name: string): Promise<BaitManufacturer> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name })
    .select('*')
    .single()
  if (error) throw error
  return data as BaitManufacturer
}

export async function updateBaitManufacturer(id: string, name: string): Promise<BaitManufacturer> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ name })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as BaitManufacturer
}

export async function deleteBaitManufacturer(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}


