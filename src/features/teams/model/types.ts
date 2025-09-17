export type Team = {
  id: string
  name: string
  description?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type TeamRole = 'member' | 'captain' | 'coach' | 'creator'

export type TeamMember = {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  joined_at: string
  user_email?: string
  user_nickname?: string
}

export type TeamInvitation = {
  id: string
  team_id: string
  invited_user_id: string
  invited_by: string
  role: TeamRole
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  expires_at: string
  invited_user_email?: string
  invited_user_nickname?: string
  team_name?: string
  team_description?: string
  invited_by_email?: string
  invited_by_nickname?: string
}

export type CreateTeamInput = {
  name: string
  description?: string
  created_by: string
}

export type UpdateTeamInput = {
  name?: string
  description?: string
}

export type CreateInvitationInput = {
  team_id: string
  invited_user_email: string
  invited_by: string
  role: TeamRole
}

export type AcceptInvitationInput = {
  invitation_id: string
  accept: boolean
}

export type TeamParticipation = {
  id: string
  team_id: string
  competition_id: string
  status: 'registered' | 'confirmed' | 'rejected'
  registered_at: string
  confirmed_at?: string | null
}

export type CreateTeamParticipationInput = {
  team_id: string
  competition_id: string
  participant_user_ids?: string[]
}

export type UpdateTeamParticipationInput = {
  status?: 'registered' | 'confirmed' | 'rejected'
  participant_user_ids?: string[]
}

export type SoloParticipation = {
  id: string
  user_id: string
  competition_id: string
  status: 'registered' | 'confirmed' | 'rejected'
  registered_at: string
  confirmed_at?: string | null
}

export type CreateSoloParticipationInput = {
  user_id: string
  competition_id: string
}

export type UpdateSoloParticipationInput = {
  status?: 'registered' | 'confirmed' | 'rejected'
}

export type SoloParticipant = {
  user_id: string
  status: 'registered' | 'confirmed' | 'rejected'
  registered_at: string
  user_email?: string
  user_nickname?: string
}


