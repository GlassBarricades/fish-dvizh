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

export async function listTrainingCatches(trainingId: string): Promise<TrainingCatch[]> {
  const { data, error } = await supabase
    .from('training_catches')
    .select('id,training_id,user_id,fish_kind_id,bait_id,bait_name,weight_g,length_cm,lat,lng,caught_at,released,notes,dict_baits:bait_id(brand,name,color,size)')
    .eq('training_id', trainingId)
    .order('caught_at', { ascending: false })
  if (error) {
    // relation not found or no permission – return empty until migrations are applied
    return []
  }
  return (data || []) as TrainingCatch[]
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

// User's taken baits for a training
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


