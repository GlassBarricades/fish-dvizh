export type CompetitionResult = {
  id: string
  competition_id: string
  participant_user_id: string
  fish_kind_id: string
  weight_grams?: number | null
  length_cm?: number | null
  created_by: string
  created_at: string
  user_email?: string | null
  user_nickname?: string | null
  fish_name?: string | null
}

export type CreateResultInput = {
  competition_id: string
  participant_user_id: string
  fish_kind_id: string
  weight_grams?: number | null
  length_cm?: number | null
}

export type UpdateResultInput = {
  participant_user_id?: string
  fish_kind_id?: string
  weight_grams?: number | null
  length_cm?: number | null
}

export type CompetitionParticipant = {
  user_id: string
  user_email?: string | null
  user_nickname?: string | null
  checked_in?: boolean
}


