import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCatch, createTraining, deleteCatch, deleteTraining, fetchTeamTrainings, fetchTrainingById, fetchUserTrainings, listTrainingCatches, listTrainingTakenBaits, setTrainingTakenBaits, updateCatch, updateTraining, fetchTrainingPlan, upsertTrainingPlan, listTrainingSegments, createTrainingSegment, deleteTrainingSegment, listTrainingTasks, createTrainingTask, updateTrainingTask, deleteTrainingTask } from './api'
import type { CreateTrainingInput, UpdateTrainingInput } from './types'

export function useUserTrainings(userId: string | undefined) {
  return useQuery({
    queryKey: ['trainings', 'user', userId],
    queryFn: () => fetchUserTrainings(userId as string),
    enabled: !!userId,
  })
}

export function useTeamTrainings(teamId: string | undefined) {
  return useQuery({
    queryKey: ['trainings', 'team', teamId],
    queryFn: () => fetchTeamTrainings(teamId as string),
    enabled: !!teamId,
  })
}

export function useTraining(trainingId: string | undefined) {
  return useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => fetchTrainingById(trainingId as string),
    enabled: !!trainingId,
  })
}

export function useTrainingCatches(trainingId: string | undefined) {
  return useQuery({
    queryKey: ['training-catches', trainingId],
    queryFn: () => listTrainingCatches(trainingId as string),
    enabled: !!trainingId,
  })
}

export function useTrainingTakenBaits(trainingId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['training-taken-baits', trainingId, userId],
    queryFn: () => listTrainingTakenBaits(trainingId as string, userId as string),
    enabled: !!trainingId && !!userId,
  })
}

export function useSetTrainingTakenBaits() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ trainingId, userId, baitIds }: { trainingId: string; userId: string; baitIds: string[] }) => setTrainingTakenBaits(trainingId, userId, baitIds),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['training-taken-baits', vars.trainingId, vars.userId] })
    },
  })
}

export function useCreateCatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCatch,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['training-catches', created.training_id] })
    },
  })
}

export function useUpdateCatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; input: any; trainingId: string }) => updateCatch(args.id, args.input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['training-catches', variables.trainingId] })
    },
  })
}

export function useDeleteCatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; trainingId: string }) => deleteCatch(args.id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['training-catches', variables.trainingId] })
    },
  })
}

export function useCreateTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTrainingInput) => createTraining(input),
    onSuccess: (created) => {
      if (created.user_id) {
        qc.invalidateQueries({ queryKey: ['trainings', 'user', created.user_id] })
      }
      if (created.team_id) {
        qc.invalidateQueries({ queryKey: ['trainings', 'team', created.team_id] })
      }
    },
    onError: (e: any) => {
      // noop here; UI already shows error via try/catch
      console.error('createTraining error', e?.message || e)
    }
  })
}

// Plan
export function useTrainingPlan(trainingId: string | undefined) {
  return useQuery({
    queryKey: ['training-plan', trainingId],
    queryFn: () => fetchTrainingPlan(trainingId as string),
    enabled: !!trainingId,
  })
}

export function useUpsertTrainingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertTrainingPlan,
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['training-plan', plan.training_id] })
    },
  })
}

// Segments
export function useTrainingSegments(trainingId: string | undefined) {
  return useQuery({
    queryKey: ['training-segments', trainingId],
    queryFn: () => listTrainingSegments(trainingId as string),
    enabled: !!trainingId,
  })
}

export function useCreateTrainingSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTrainingSegment,
    onSuccess: (seg) => qc.invalidateQueries({ queryKey: ['training-segments', seg.training_id] }),
  })
}

export function useDeleteTrainingSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; trainingId: string }) => deleteTrainingSegment(id),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['training-segments'] }),
  })
}

// Tasks
export function useTrainingTasks(trainingId: string | undefined) {
  return useQuery({
    queryKey: ['training-tasks', trainingId],
    queryFn: () => listTrainingTasks(trainingId as string),
    enabled: !!trainingId,
  })
}

export function useCreateTrainingTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTrainingTask,
    onSuccess: (task) => qc.invalidateQueries({ queryKey: ['training-tasks', task.training_id] }),
  })
}

export function useUpdateTrainingTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any; trainingId: string }) => updateTrainingTask(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-tasks'] }),
  })
}

export function useDeleteTrainingTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; trainingId: string }) => deleteTrainingTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-tasks'] }),
  })
}

export function useUpdateTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTrainingInput }) => updateTraining(id, input),
    onSuccess: () => {
      // Can't easily infer keys; better to broadly invalidate
      qc.invalidateQueries({ queryKey: ['trainings'] })
    },
  })
}

export function useDeleteTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTraining(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainings'] })
    },
  })
}


