import { supabase } from '../../lib/supabaseClient'
import type { AdminUser } from './types'
import type { Role } from '../auth/roles'

export async function fetchUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return data as AdminUser[]
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_role', {
    target_user_id: userId,
    new_role: role,
  })
  if (error) throw error
}


