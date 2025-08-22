import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCustomUserBait, addUserBaitFromDict, deleteUserBait, listUserBaits } from './api'

export function useUserBaits(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-baits', userId],
    queryFn: () => listUserBaits(userId as string),
    enabled: !!userId,
  })
}

export function useAddUserBaitFromDict() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addUserBaitFromDict,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['user-baits', created.user_id] })
    },
  })
}

export function useAddCustomUserBait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addCustomUserBait,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['user-baits', created.user_id] })
    },
  })
}

export function useDeleteUserBait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteUserBait(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-baits'] })
    },
  })
}


