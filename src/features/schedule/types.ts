export type RoundStatus = 'scheduled' | 'ongoing' | 'break' | 'completed'
export type RoundKind = 'round' | 'registration' | 'break'

export type Round = {
  id: string
  competition_id: string
  index: number
  title: string
  start_at: string // ISO datetime planned
  end_at: string // ISO datetime planned
  status: RoundStatus
  kind: RoundKind
  started_at?: string | null
  ended_at?: string | null
  created_at: string
}

export type CreateRoundInput = {
  competition_id: string
  index: number
  title: string
  start_at: string
  end_at: string
  kind?: RoundKind
}

export type UpdateRoundInput = {
  index?: number
  title?: string
  start_at?: string
  end_at?: string
  status?: RoundStatus
  kind?: RoundKind
  started_at?: string | null
  ended_at?: string | null
}


