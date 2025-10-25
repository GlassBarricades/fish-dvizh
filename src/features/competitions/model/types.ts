export type Competition = {
  id: string
  title: string
  description?: string | null
  starts_at: string // ISO datetime
  lat: number
  lng: number
  format_id?: string | null
  team_size_id?: string | null
  max_slots?: number | null
  league_id?: string | null // Связь с лигой
  competition_type?: 'regular' | 'championship' | 'qualification' | null // Тип соревнования для множителя
  created_at: string
  created_by?: string | null
}

export type CreateCompetitionInput = {
  title: string
  description?: string
  starts_at: string // ISO datetime
  lat: number
  lng: number
  format_id: string
  team_size_id?: string | null
  max_slots?: number | null
  league_id?: string | null
  competition_type?: 'regular' | 'championship' | 'qualification' | null
}

export type UpdateCompetitionInput = {
  title?: string
  description?: string
  starts_at?: string // ISO datetime
  lat?: number
  lng?: number
  format_id?: string | null
  team_size_id?: string | null
  max_slots?: number | null
  league_id?: string | null
  competition_type?: 'regular' | 'championship' | 'qualification' | null
}

export type CompetitionFishKind = {
  competition_id: string
  fish_kind_id: string
}


