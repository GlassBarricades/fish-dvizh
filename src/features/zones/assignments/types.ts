export type ZoneJudge = {
  zone_id: string
  user_id: string
}

export type AssignJudgeInput = {
  zone_id: string
  user_id: string
}

export type RoundZoneAssignment = {
  round_id: string
  participant_user_id: string
  zone_id: string
}

export type DrawAssignmentsInput = {
  competition_id: string
  round_id: string
}


