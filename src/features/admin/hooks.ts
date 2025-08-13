import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUsers, updateUserRole } from './api'
import type { Role } from '../auth/roles'

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}


