import { supabase } from '../../lib/supabaseClient'

export type UserBait = {
  id: string
  user_id: string
  dict_bait_id?: string | null
  // Denormalized display fields
  brand?: string | null
  name?: string | null
  color?: string | null
  size?: string | null
  created_at: string
}

const TABLE = 'user_baits'

export async function listUserBaits(userId: string): Promise<UserBait[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id,user_id,dict_bait_id,created_at,dict_baits:dict_bait_id(brand,name,color,size),brand,name,color,size')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    dict_bait_id: row.dict_bait_id ?? null,
    brand: (row.dict_baits?.brand ?? row.brand) ?? null,
    name: (row.dict_baits?.name ?? row.name) ?? null,
    color: (row.dict_baits?.color ?? row.color) ?? null,
    size: (row.dict_baits?.size ?? row.size) ?? null,
    created_at: row.created_at,
  }))
}

export async function addUserBaitFromDict(input: { user_id: string; dict_bait_id: string }): Promise<UserBait> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select('id,user_id,dict_bait_id,created_at,dict_baits:dict_bait_id(brand,name,color,size)')
    .single()
  if (error) throw error
  const row: any = data
  return {
    id: row.id,
    user_id: row.user_id,
    dict_bait_id: row.dict_bait_id ?? null,
    brand: row.dict_baits?.brand ?? null,
    name: row.dict_baits?.name ?? null,
    color: row.dict_baits?.color ?? null,
    size: row.dict_baits?.size ?? null,
    created_at: row.created_at,
  }
}

export async function addCustomUserBait(input: { user_id: string; brand: string; name: string; color?: string | null; size?: string | null }): Promise<UserBait> {
  const payload = { ...input, color: input.color ?? null, size: input.size ?? null, dict_bait_id: null }
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select('id,user_id,dict_bait_id,brand,name,color,size,created_at')
    .single()
  if (error) throw error
  const row: any = data
  return {
    id: row.id,
    user_id: row.user_id,
    dict_bait_id: row.dict_bait_id ?? null,
    brand: row.brand ?? null,
    name: row.name ?? null,
    color: row.color ?? null,
    size: row.size ?? null,
    created_at: row.created_at,
  }
}

export async function deleteUserBait(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function fetchUserBaitById(id: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id,user_id,dict_bait_id,brand,name,color,size,dict_baits:dict_bait_id(brand,name,color,size)')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  const row: any = data
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    dict_bait_id: (row.dict_bait_id ?? null) as string | null,
    brand: (row.dict_baits?.brand ?? row.brand ?? null) as string | null,
    name: (row.dict_baits?.name ?? row.name ?? null) as string | null,
    color: (row.dict_baits?.color ?? row.color ?? null) as string | null,
    size: (row.dict_baits?.size ?? row.size ?? null) as string | null,
  }
}


