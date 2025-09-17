export type TeamSize = {
  id: string
  name: string
  size: number
  created_at: string
}

export type CreateTeamSizeInput = {
  name: string
  size: number
}

export type UpdateTeamSizeInput = {
  name?: string
  size?: number
}


