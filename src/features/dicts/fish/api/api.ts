import { supabase } from '@/lib/supabaseClient'
import type { FishKind } from '../model/types'

const TABLE = 'dict_fish_kinds'

export async function listFishKinds(): Promise<FishKind[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('name', { ascending: true })
  if (error) throw error
  return data as FishKind[]
}

export async function createFishKind(name: string): Promise<FishKind> {
  const { data, error } = await supabase.from(TABLE).insert({ name }).select('*').single()
  if (error) throw error
  return data as FishKind
}

export async function updateFishKind(id: string, name: string): Promise<FishKind> {
  const { data, error } = await supabase.from(TABLE).update({ name }).eq('id', id).select('*').single()
  if (error) throw error
  return data as FishKind
}

export async function deleteFishKind(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}


