import { supabase } from '@/lib/supabaseClient'
import type { Zone, CreateZoneInput, UpdateZoneInput } from '../model/types'

const TABLE = 'competition_zones'

export async function listZones(competitionId: string): Promise<Zone[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, competition_id, name, polygon_geojson, created_by, created_at')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as any[]) as Zone[]
}

export async function createZone(input: CreateZoneInput): Promise<Zone> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      competition_id: input.competition_id,
      name: input.name,
      polygon_geojson: input.polygon_geojson,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Zone
}

export async function updateZone(id: string, input: UpdateZoneInput): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
  if (error) throw error
}

export async function deleteZone(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
  if (error) throw error
}


