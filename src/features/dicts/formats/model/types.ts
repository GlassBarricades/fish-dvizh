export type CompetitionFormat = {
  id: string
  name: string
  description?: string | null
  rules?: string | null
  created_at: string
  created_by?: string | null
}

export type CreateCompetitionFormatInput = {
  name: string
  description?: string
  rules?: string
}

export type UpdateCompetitionFormatInput = {
  name?: string
  description?: string
  rules?: string
}


