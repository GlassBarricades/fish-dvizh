export type TrainingType = 'solo' | 'team'

export type Training = {
  id: string
  type: TrainingType
  title: string
  description?: string | null
  starts_at: string
  ends_at?: string | null
  lat?: number | null
  lng?: number | null
  area_geojson?: any | null
  target_fish_kinds?: string[] | null // ID видов целевой рыбы
  created_by: string
  user_id?: string | null
  team_id?: string | null
  created_at: string
  updated_at: string
}

export type CreateTrainingInput = {
  type: TrainingType
  title: string
  description?: string
  starts_at: string
  ends_at?: string
  lat?: number | null
  lng?: number | null
  area_points?: [number, number][] | null
  target_fish_kinds?: string[] | null // ID видов целевой рыбы
  user_id?: string | null
  team_id?: string | null
  created_by: string
}

export type UpdateTrainingInput = Partial<Omit<CreateTrainingInput, 'created_by' | 'type'>> & {
  title?: string
  target_fish_kinds?: string[] | null
}


