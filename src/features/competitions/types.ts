export type Competition = {
  id: string
  title: string
  description?: string | null
  starts_at: string // ISO datetime
  lat: number
  lng: number
  created_at: string
  created_by?: string | null
}

export type CreateCompetitionInput = {
  title: string
  description?: string
  starts_at: string // ISO datetime
  lat: number
  lng: number
}

export type UpdateCompetitionInput = {
  title?: string
  description?: string
  starts_at?: string // ISO datetime
  lat?: number
  lng?: number
}

export type CompetitionFishKind = {
  competition_id: string
  fish_kind_id: string
}


