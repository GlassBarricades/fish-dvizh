import { supabase } from '../../lib/supabaseClient'
import type { Training, CreateTrainingInput, UpdateTrainingInput } from './types'

const TABLE = 'trainings'

export async function fetchUserTrainings(userId: string): Promise<Training[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .or(`user_id.eq.${userId},created_by.eq.${userId}`)
    .order('starts_at', { ascending: false })
  if (error) throw error
  return (data || []) as Training[]
}

export async function fetchTeamTrainings(teamId: string): Promise<Training[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('team_id', teamId)
    .order('starts_at', { ascending: false })
  if (error) throw error
  return (data || []) as Training[]
}

export async function fetchTrainingById(trainingId: string): Promise<Training | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', trainingId)
    .single()
  if (error) return null
  return data as Training
}

// Catches minimal API (safe for missing tables on early iterations)
export type TrainingCatch = {
  id: string
  training_id: string
  user_id: string
  fish_kind_id?: string | null
  bait_id?: string | null
  bait_name?: string | null
  weight_g?: number | null
  length_cm?: number | null
  lat?: number | null
  lng?: number | null
  caught_at: string
  released?: boolean | null
  notes?: string | null
}

// Training events (pins): strike/lost/snag
export type TrainingEvent = {
  id: string
  training_id: string
  user_id: string
  kind: 'strike' | 'lost' | 'snag'
  bait_id?: string | null
  lat: number
  lng: number
  at: string
  notes?: string | null
}

export async function listTrainingEvents(trainingId: string): Promise<TrainingEvent[]> {
  const { data, error } = await supabase
    .from('training_events')
    .select('id,training_id,user_id,kind,bait_id,lat,lng,at,notes')
    .eq('training_id', trainingId)
    .order('at', { ascending: false })
  if (error) return []
  
  const rows = (data || []) as any[]
  
  // Enrich with user info (email, nickname) and bait info
  try {
    // Получаем данные о пользователях
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)))
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id,email,raw_user_meta_data').in('id', userIds)
      const userMap: Record<string, any> = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, raw_user_meta_data: u.raw_user_meta_data }]))
      for (const r of rows) (r as any).users = userMap[r.user_id] ? userMap[r.user_id] : null
    }
    
    // Получаем данные о приманках
    const baitIds = Array.from(new Set(rows.map((r) => r.bait_id).filter(Boolean)))
    if (baitIds.length > 0) {
      const { data: baits } = await supabase.from('user_baits').select('id,brand,name,color,size').in('id', baitIds)
      const baitMap: Record<string, any> = Object.fromEntries((baits || []).map((b: any) => [b.id, b]))
      for (const r of rows) (r as any).bait_info = baitMap[r.bait_id] ? baitMap[r.bait_id] : null
    }
  } catch {}
  
  return rows as TrainingEvent[]
}

export async function createTrainingEvent(input: Omit<TrainingEvent, 'id' | 'at'> & { at?: string }): Promise<TrainingEvent> {
  const payload: any = { ...input }
  if (!payload.at) payload.at = new Date().toISOString()
  const { data, error } = await supabase
    .from('training_events')
    .insert(payload)
    .select('id,training_id,user_id,kind,bait_id,lat,lng,at,notes')
    .single()
  if (error) throw error
  return data as TrainingEvent
}

export async function deleteTrainingEvent(id: string): Promise<void> {
  const { error } = await supabase.from('training_events').delete().eq('id', id)
  if (error) throw error
}

export async function updateTrainingEvent(id: string, data: {
  kind: 'strike' | 'lost' | 'snag'
  bait_id?: string | null
  notes?: string | null
  at: string
  lat?: number | null
  lng?: number | null
}): Promise<boolean> {
  const { error } = await supabase
    .from('training_events')
    .update({
      kind: data.kind,
      bait_id: data.bait_id,
      notes: data.notes,
      at: data.at,
      lat: data.lat,
      lng: data.lng
    })
    .eq('id', id)
  return !error
}

export async function listTrainingCatches(trainingId: string): Promise<TrainingCatch[]> {
  const { data, error } = await supabase
    .from('training_catches')
    .select('id,training_id,user_id,fish_kind_id,bait_id,bait_name,weight_g,length_cm,lat,lng,caught_at,released,notes,dict_baits:bait_id(brand,name,color,size)')
    .eq('training_id', trainingId)
    .order('caught_at', { ascending: false })
  if (error) {
    return []
  }
  const rows = (data || []) as any[]
  try {
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)))
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id,email,raw_user_meta_data').in('id', userIds)
      const map: Record<string, any> = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, raw_user_meta_data: u.raw_user_meta_data }]))
      for (const r of rows) (r as any).users = map[r.user_id] ? map[r.user_id] : null
    }
  } catch {}
  return rows as TrainingCatch[]
}

export async function listUserCatches(userId: string): Promise<TrainingCatch[]> {
  const { data, error } = await supabase
    .from('training_catches')
    .select('id,training_id,user_id,fish_kind_id,bait_id,bait_name,weight_g,length_cm,lat,lng,caught_at,released,notes,dict_baits:bait_id(brand,name,color,size)')
    .eq('user_id', userId)
    .order('caught_at', { ascending: false })
  if (error) return []
  const rows = (data || []) as any[]
  // Enrich with user info (email, nickname) without relying on FK embedding
  try {
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)))
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id,email,raw_user_meta_data').in('id', userIds)
      const map: Record<string, any> = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, raw_user_meta_data: u.raw_user_meta_data }]))
      for (const r of rows) (r as any).users = map[r.user_id] ? map[r.user_id] : null
    }
  } catch {}
  return rows as TrainingCatch[]
}

export async function listCatchesByUsers(userIds: string[]): Promise<TrainingCatch[]> {
  if (!userIds || userIds.length === 0) return []
  const { data, error } = await supabase
    .from('training_catches')
    .select('id,training_id,user_id,fish_kind_id,bait_id,bait_name,weight_g,length_cm,lat,lng,caught_at,released,notes,dict_baits:bait_id(brand,name,color,size)')
    .in('user_id', userIds)
    .order('caught_at', { ascending: false })
  if (error) return []
  const rows = (data || []) as any[]
  try {
    const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)))
    if (ids.length > 0) {
      const { data: users } = await supabase.from('users').select('id,email,raw_user_meta_data').in('id', ids)
      const map: Record<string, any> = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email, raw_user_meta_data: u.raw_user_meta_data }]))
      for (const r of rows) (r as any).users = map[r.user_id] ? map[r.user_id] : null
    }
  } catch {}
  return rows as TrainingCatch[]
}

export type CreateCatchInput = {
  training_id: string
  user_id: string
  fish_kind_id?: string | null
  bait_id?: string | null
  bait_name?: string | null
  weight_g?: number | null
  length_cm?: number | null
  lat?: number | null
  lng?: number | null
  caught_at: string
  released?: boolean
  notes?: string
}

export async function createCatch(input: CreateCatchInput): Promise<TrainingCatch> {
  const { data, error } = await supabase
    .from('training_catches')
    .insert(input)
    .select('id,training_id,user_id,fish_kind_id,bait_id,bait_name,weight_g,length_cm,lat,lng,caught_at,released,notes,dict_baits:bait_id(brand,name,color,size)')
    .single()
  if (error) throw error
  return data as TrainingCatch
}

// User's taken baits for a training (legacy: training_baits_taken uses dict_bait_id)
export type TrainingTakenBait = {
  bait_id: string
  training_id: string
  user_id: string
  // denormalized display fields
  brand?: string | null
  name?: string | null
  color?: string | null
  size?: string | null
}

export async function listTrainingTakenBaits(trainingId: string, userId: string): Promise<TrainingTakenBait[]> {
  const { data, error } = await supabase
    .from('training_baits_taken')
    .select('bait_id,training_id,user_id,dict_baits:bait_id(brand,name,color,size)')
    .eq('training_id', trainingId)
    .eq('user_id', userId)
  if (error) return []
  return (data || []).map((row: any) => ({
    bait_id: row.bait_id,
    training_id: row.training_id,
    user_id: row.user_id,
    brand: row.dict_baits?.brand ?? null,
    name: row.dict_baits?.name ?? null,
    color: row.dict_baits?.color ?? null,
    size: row.dict_baits?.size ?? null,
  }))
}

export async function setTrainingTakenBaits(trainingId: string, userId: string, baitIds: string[]): Promise<void> {
  // replace all for pair (trainingId, userId)
  const del = await supabase.from('training_baits_taken').delete().eq('training_id', trainingId).eq('user_id', userId)
  if (del.error) throw del.error
  if (baitIds.length === 0) return
  const payload = baitIds.map((id) => ({ training_id: trainingId, user_id: userId, bait_id: id }))
  const ins = await supabase.from('training_baits_taken').insert(payload)
  if (ins.error) throw ins.error
}

// New: training taken user baits referencing user_baits
export type TrainingTakenUserBait = {
  user_bait_id: string
  training_id: string
  user_id: string
  dict_bait_id?: string | null
  // display fields from user_baits or dict
  brand?: string | null
  name?: string | null
  color?: string | null
  size?: string | null
}

export async function listTrainingTakenUserBaits(trainingId: string, userId: string): Promise<TrainingTakenUserBait[]> {
  const { data, error } = await supabase
    .from('training_user_baits_taken')
    .select('user_bait_id,training_id,user_id,user_baits:user_bait_id(dict_bait_id,brand,name,color,size,dict_baits:dict_bait_id(brand,name,color,size))')
    .eq('training_id', trainingId)
    .eq('user_id', userId)
  if (error) return []
  return (data || []).map((row: any) => ({
    user_bait_id: row.user_bait_id,
    training_id: row.training_id,
    user_id: row.user_id,
    dict_bait_id: row.user_baits?.dict_bait_id ?? null,
    brand: row.user_baits?.dict_baits?.brand ?? row.user_baits?.brand ?? null,
    name: row.user_baits?.dict_baits?.name ?? row.user_baits?.name ?? null,
    color: row.user_baits?.dict_baits?.color ?? row.user_baits?.color ?? null,
    size: row.user_baits?.dict_baits?.size ?? row.user_baits?.size ?? null,
  }))
}

export async function setTrainingTakenUserBaits(trainingId: string, userId: string, userBaitIds: string[]): Promise<void> {
  const del = await supabase.from('training_user_baits_taken').delete().eq('training_id', trainingId).eq('user_id', userId)
  if (del.error) throw del.error
  if (userBaitIds.length === 0) return
  const payload = userBaitIds.map((id) => ({ training_id: trainingId, user_id: userId, user_bait_id: id }))
  const ins = await supabase.from('training_user_baits_taken').insert(payload)
  if (ins.error) throw ins.error
}

export type UpdateCatchInput = Partial<{
  fish_kind_id: string | null
  bait_id: string | null
  bait_name: string | null
  weight_g: number | null
  length_cm: number | null
  lat: number | null
  lng: number | null
  caught_at: string
  released: boolean
  notes: string | null
}>

export async function updateCatch(id: string, input: UpdateCatchInput): Promise<TrainingCatch> {
  const { data, error } = await supabase
    .from('training_catches')
    .update(input)
    .eq('id', id)
    .select('id,training_id,user_id,fish_kind_id,bait_id,bait_name,weight_g,length_cm,lat,lng,caught_at,released,notes,dict_baits:bait_id(brand,name,color,size)')
    .single()
  if (error) throw error
  return data as TrainingCatch
}

export async function deleteCatch(id: string): Promise<void> {
  const { error } = await supabase.from('training_catches').delete().eq('id', id)
  if (error) throw error
}

// Plan/Segments/Tasks
export type TrainingPlan = {
  training_id: string
  goal?: string | null
  notes?: string | null
}

export async function fetchTrainingPlan(trainingId: string): Promise<TrainingPlan | null> {
  const { data, error } = await supabase
    .from('training_plans')
    .select('training_id,goal,notes')
    .eq('training_id', trainingId)
    .maybeSingle()
  if (error) return null
  return data as TrainingPlan
}

export async function upsertTrainingPlan(plan: TrainingPlan): Promise<TrainingPlan> {
  const { data, error } = await supabase
    .from('training_plans')
    .upsert(plan, { onConflict: 'training_id' })
    .select('training_id,goal,notes')
    .single()
  if (error) throw error
  return data as TrainingPlan
}

export type TrainingSegment = {
  id: string
  training_id: string
  name: string
  area_geojson: any
}

export async function listTrainingSegments(trainingId: string): Promise<TrainingSegment[]> {
  const { data, error } = await supabase
    .from('training_segments')
    .select('id,training_id,name,area_geojson')
    .eq('training_id', trainingId)
    .order('name', { ascending: true })
  if (error) return []
  return (data || []) as TrainingSegment[]
}

export async function createTrainingSegment(input: { training_id: string; name: string; area_points: [number, number][] }): Promise<TrainingSegment> {
  const coordinates = [...input.area_points, input.area_points[0]]
  const geo = { type: 'Polygon', coordinates: [coordinates.map(([lng, lat]) => [lng, lat])] }
  const { data, error } = await supabase
    .from('training_segments')
    .insert({ training_id: input.training_id, name: input.name, area_geojson: geo })
    .select('id,training_id,name,area_geojson')
    .single()
  if (error) throw error
  return data as TrainingSegment
}

export async function deleteTrainingSegment(id: string): Promise<void> {
  const { error } = await supabase.from('training_segments').delete().eq('id', id)
  if (error) throw error
}

export type TrainingTask = {
  id: string
  training_id: string
  title: string
  starts_at: string
  ends_at?: string | null
  segment_id?: string | null
  target_fish_kind_id?: string | null
  notes?: string | null
}

export async function listTrainingTasks(trainingId: string): Promise<TrainingTask[]> {
  const { data, error } = await supabase
    .from('training_tasks')
    .select('id,training_id,title,starts_at,ends_at,segment_id,target_fish_kind_id,notes')
    .eq('training_id', trainingId)
    .order('starts_at', { ascending: true })
  if (error) return []
  return (data || []) as TrainingTask[]
}

export async function createTrainingTask(input: Omit<TrainingTask, 'id'>): Promise<TrainingTask> {
  const { data, error } = await supabase
    .from('training_tasks')
    .insert(input)
    .select('id,training_id,title,starts_at,ends_at,segment_id,target_fish_kind_id,notes')
    .single()
  if (error) throw error
  return data as TrainingTask
}

export async function updateTrainingTask(id: string, input: Partial<Omit<TrainingTask, 'id' | 'training_id'>>): Promise<TrainingTask> {
  const { data, error } = await supabase
    .from('training_tasks')
    .update(input)
    .eq('id', id)
    .select('id,training_id,title,starts_at,ends_at,segment_id,target_fish_kind_id,notes')
    .single()
  if (error) throw error
  return data as TrainingTask
}

export async function deleteTrainingTask(id: string): Promise<void> {
  const { error } = await supabase.from('training_tasks').delete().eq('id', id)
  if (error) throw error
}

export async function createTraining(input: CreateTrainingInput): Promise<Training> {
  // If polygon area passed as points, convert to GeoJSON polygon
  let payload: any = { ...input }
  if (input.area_points && input.area_points.length >= 3) {
    const coordinates = [...input.area_points, input.area_points[0]]
    payload.area_geojson = {
      type: 'Polygon',
      coordinates: [coordinates.map(([lng, lat]) => [lng, lat])],
    }
    delete payload.area_points
  }
  // Explicitly remove area_points if null to avoid Postgrest validation issues
  if ('area_points' in payload) delete (payload as any).area_points
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data as Training
}

export async function updateTraining(id: string, input: UpdateTrainingInput): Promise<Training> {
  let payload: any = { ...input }
  if ((input as any).area_points && (input as any).area_points!.length >= 3) {
    const pts = (input as any).area_points as [number, number][]
    const coordinates = [...pts, pts[0]]
    payload.area_geojson = {
      type: 'Polygon',
      coordinates: [coordinates.map(([lng, lat]) => [lng, lat])],
    }
    delete payload.area_points
  }
  if ('area_points' in payload) delete (payload as any).area_points
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Training
}

export async function deleteTraining(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
  if (error) throw error
}


