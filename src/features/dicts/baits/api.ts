import { supabase } from '../../../lib/supabaseClient'

export type Bait = {
  id: string
  brand: string
  manufacturer_id?: string | null
  name: string
  type_id?: string | null
  color?: string | null
  size?: string | null
  created_at: string
}

const TABLE = 'dict_baits'

export async function listBaits(): Promise<Bait[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('brand', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return (data || []) as Bait[]
}

export async function createBait(input: { brand: string; name: string; type_id?: string | null; color?: string; size?: string; manufacturer_id?: string | null }): Promise<Bait> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as Bait
}

export async function updateBait(id: string, input: Partial<{ brand: string; name: string; type_id?: string | null; color?: string; size?: string; manufacturer_id?: string | null }>): Promise<Bait> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Bait
}

export async function deleteBait(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}


