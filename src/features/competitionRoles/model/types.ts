export type CompetitionRoleType = 'organizer' | 'chief_judge' | 'secretary' | 'zone_judge'

export type CompetitionRole = {
  competition_id: string
  user_id: string
  role: CompetitionRoleType
  created_at: string
  user_email?: string | null
  user_nickname?: string | null
}

export type AssignRoleInput = {
  competition_id: string
  user_id?: string
  email?: string
  role: CompetitionRoleType
}


