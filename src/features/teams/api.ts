import { supabase } from '../../lib/supabaseClient'
import type { 
  Team, 
  CreateTeamInput, 
  UpdateTeamInput, 
  TeamMember, 
  TeamInvitation, 
  CreateInvitationInput, 
  AcceptInvitationInput,
  TeamParticipation,
  CreateTeamParticipationInput,
  UpdateTeamParticipationInput,
  TeamRole,
  SoloParticipation,
  CreateSoloParticipationInput,
  UpdateSoloParticipationInput,
  SoloParticipant
} from './types'

const TEAMS_TABLE = 'teams'
const TEAM_MEMBERS_TABLE = 'team_members'
const TEAM_INVITATIONS_TABLE = 'team_invitations'

// Teams
export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Team[]
}

export async function fetchTeam(teamId: string): Promise<Team> {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .select('*')
    .eq('id', teamId)
    .single()
  if (error) throw error
  return data as Team
}

export async function fetchUserTeams(userId: string): Promise<Team[]> {
  try {
    // Получаем команды, где пользователь создатель
    const { data: createdTeams, error: createdError } = await supabase
      .from(TEAMS_TABLE)
      .select('*')
      .eq('created_by', userId)
    
    if (createdError) throw createdError
    
    // Получаем команды, где пользователь участник
    const { data: memberTeams, error: memberError } = await supabase
      .from('team_members')
      .select(`
        teams (
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
    
    if (memberError) throw memberError
    
    // Объединяем и убираем дубликаты
    const allTeams = [
      ...(createdTeams || []),
      ...(memberTeams?.map(item => item.teams).filter(Boolean) || [])
    ]
    
    // Убираем дубликаты по ID
    const uniqueTeams = allTeams.filter((team, index, self) => 
      index === self.findIndex(t => t.id === team.id)
    )
    
    return uniqueTeams.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (error) {
    throw error
  }
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .insert(input)
    .select('*')
    .single()
  if (error) throw error

  // Add creator as first member
  await addTeamMember(data.id, input.created_by, 'creator')

  return data as Team
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Team
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from(TEAMS_TABLE).delete().eq('id', id)
  if (error) throw error
}

// Team Members
export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .select(`
      *,
      users:user_id(email, raw_user_meta_data)
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })
  
  if (error) {
    throw error
  }
  
  // Transform data to include user info
  return (data || []).map(member => ({
    ...member,
    user_email: member.users?.email,
    user_nickname: member.users?.raw_user_meta_data?.nickname
  }))
}

export async function addTeamMember(teamId: string, userId: string, role: TeamRole = 'member'): Promise<TeamMember> {
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .insert({ team_id: teamId, user_id: userId, role })
    .select('*')
    .single()
  if (error) throw error
  return data as TeamMember
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMember> {
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data as TeamMember
}

// Team Invitations
export async function fetchTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  const { data, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .select(`
      *,
      users:invited_user_id(email, raw_user_meta_data)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Transform data to include user info
  return (data || []).map(invitation => ({
    ...invitation,
    invited_user_email: invitation.users?.email,
    invited_user_nickname: invitation.users?.raw_user_meta_data?.nickname
  }))
}

export async function fetchUserInvitations(userId: string): Promise<TeamInvitation[]> {
  const { data, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .select(`
      *,
      teams:team_id(name, description),
      users:invited_by(email, raw_user_meta_data)
    `)
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Transform data to include team and user info
  return (data || []).map(invitation => ({
    ...invitation,
    team_name: invitation.teams?.name,
    team_description: invitation.teams?.description,
    invited_by_email: invitation.users?.email,
    invited_by_nickname: invitation.users?.raw_user_meta_data?.nickname
  }))
}

export async function createTeamInvitation(input: CreateInvitationInput): Promise<TeamInvitation> {
  // First find user by email
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.invited_user_email)
    .single()
  
  if (userError || !userData) {
    throw new Error('Пользователь с таким email не найден')
  }

  const invitationData = {
    team_id: input.team_id,
    invited_user_id: userData.id,
    invited_by: input.invited_by,
    role: input.role, // Добавляем роль из приглашения
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  }

  const { data, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .insert(invitationData)
    .select('*')
    .single()
  if (error) throw error
  return data as TeamInvitation
}

export async function acceptTeamInvitation(input: AcceptInvitationInput): Promise<void> {
  const { data: invitation, error: invitationError } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .select('*')
    .eq('id', input.invitation_id)
    .single()
  
  if (invitationError || !invitation) {
    throw new Error('Приглашение не найдено')
  }

  if (invitation.status !== 'pending') {
    throw new Error('Приглашение уже обработано')
  }

  // Update invitation status
  const { error: updateError } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .update({ status: input.accept ? 'accepted' : 'declined' })
    .eq('id', input.invitation_id)
  
  if (updateError) throw updateError

  // If accepted, add user to team with the role from invitation
  if (input.accept) {
    // Get the role from the invitation
    const role = invitation.role || 'member'
    await addTeamMember(invitation.team_id, invitation.invited_user_id, role)
  }
}

export async function deleteTeamInvitation(id: string): Promise<void> {
  const { error } = await supabase.from(TEAM_INVITATIONS_TABLE).delete().eq('id', id)
  if (error) throw error
}

// Team Participation in Competitions
export async function fetchCompetitionTeams(competitionId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('team_participations')
    .select(`
      *,
      teams!inner(*)
    `)
    .eq('competition_id', competitionId)
    .in('status', ['confirmed', 'registered'])
    .order('registered_at', { ascending: true })
  if (error) throw error
  
  // Transform data to return teams
  return (data as any[]).map(participation => participation.teams)
}

export async function registerTeamForCompetition(input: CreateTeamParticipationInput): Promise<TeamParticipation> {
  const { data, error } = await supabase
    .from('team_participations')
    .upsert({
      ...input,
      status: 'registered',
      registered_at: new Date().toISOString(),
      confirmed_at: null
    }, { onConflict: 'team_id,competition_id' })
    .select('*')
    .single()
  if (error) throw error
  return data as TeamParticipation
}

export async function updateTeamParticipationStatus(
  teamId: string, 
  competitionId: string, 
  input: UpdateTeamParticipationInput
): Promise<TeamParticipation> {
  const { data, error } = await supabase
    .from('team_participations')
    .update({
      ...input,
      ...(input.status === 'confirmed' && { confirmed_at: new Date().toISOString() })
    })
    .eq('team_id', teamId)
    .eq('competition_id', competitionId)
    .select('*')
    .single()
  if (error) throw error
  return data as TeamParticipation
}

// User roles in specific teams
export async function fetchUserTeamRoles(
  userId: string,
  teamIds: string[]
): Promise<Record<string, TeamRole>> {
  if (!teamIds || teamIds.length === 0) return {}
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', userId)
    .in('team_id', teamIds)
  if (error) throw error
  const rolesMap: Record<string, TeamRole> = {}
  ;(data || []).forEach((row: any) => {
    rolesMap[row.team_id] = row.role as TeamRole
  })
  return rolesMap
}

// Solo participation API
export async function registerSoloForCompetition(input: CreateSoloParticipationInput): Promise<SoloParticipation> {
  const { data, error } = await supabase
    .from('solo_participations')
    .upsert({
      ...input,
      status: 'registered',
      registered_at: new Date().toISOString(),
      confirmed_at: null
    }, { onConflict: 'user_id,competition_id' })
    .select('*')
    .single()
  if (error) throw error
  return data as SoloParticipation
}

export async function updateSoloParticipationStatus(
  userId: string,
  competitionId: string,
  input: UpdateSoloParticipationInput
): Promise<SoloParticipation> {
  const { data, error } = await supabase
    .from('solo_participations')
    .update({
      ...input,
      ...(input.status === 'confirmed' && { confirmed_at: new Date().toISOString() })
    })
    .eq('user_id', userId)
    .eq('competition_id', competitionId)
    .select('*')
    .single()
  if (error) throw error
  return data as SoloParticipation
}

export async function fetchSoloParticipants(competitionId: string): Promise<SoloParticipant[]> {
  const { data, error } = await supabase
    .from('solo_participations')
    .select('user_id,status,registered_at')
    .eq('competition_id', competitionId)
    .in('status', ['confirmed','registered'])
    .order('registered_at', { ascending: true })
  if (error) throw error

  const rows = (data as { user_id: string; status: string; registered_at: string }[]) || []
  if (rows.length === 0) return []

  const userIds = Array.from(new Set(rows.map(r => r.user_id)))
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id,email,raw_user_meta_data')
    .in('id', userIds)
  if (usersError) {
    // Если нет доступа к users, вернем без дополнительной информации
    return rows.map(r => ({ user_id: r.user_id, status: r.status as any, registered_at: r.registered_at }))
  }
  const byId: Record<string, { email?: string; nickname?: string }> = {}
  const usersArr = (usersData ?? []) as any[]
  usersArr.forEach((u: any) => {
    byId[u.id] = { email: u.email, nickname: u.raw_user_meta_data?.nickname }
  })
  return rows.map(r => ({
    user_id: r.user_id,
    status: r.status as any,
    registered_at: r.registered_at,
    user_email: byId[r.user_id]?.email,
    user_nickname: byId[r.user_id]?.nickname,
  }))
}
