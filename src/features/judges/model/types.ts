export type JudgeInvitationStatus = 'pending' | 'accepted' | 'declined'

export type JudgeInvitation = {
  id: string
  competition_id: string
  invited_user_id?: string | null
  invited_user_email: string
  invited_by: string
  status: JudgeInvitationStatus
  created_at: string
  competition_title?: string
}

export type CreateJudgeInvitationInput = {
  competition_id: string
  invited_user_email: string
  invited_by: string
}

export type RespondJudgeInvitationInput = {
  invitation_id: string
  accept: boolean
}

export type CompetitionJudge = {
  competition_id: string
  user_id: string
  user_email?: string | null
  user_nickname?: string | null
  created_at: string
}


