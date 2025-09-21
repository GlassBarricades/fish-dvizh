export * from './model/hooks'

export function useCompetitionParticipants(competitionId: string) {
  return useQuery({ queryKey: ['participants', competitionId], queryFn: () => fetchCompetitionParticipants(competitionId), enabled: !!competitionId })
}

export function useResults(competitionId: string) {
  return useQuery({ queryKey: ['results', competitionId], queryFn: () => listResults(competitionId), enabled: !!competitionId })
}

export function useCreateResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, createdBy }: { input: CreateResultInput; createdBy: string }) => createResult(input, createdBy),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['results', vars.input.competition_id] })
    },
  })
}

export function useUpdateResult(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateResultInput }) => updateResult(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', competitionId] })
    },
  })
}

export function useDeleteResult(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteResult(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', competitionId] })
    },
  })
}

export function useSetParticipantCheckin(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, checked }: { userId: string; checked: boolean }) => setParticipantCheckin(competitionId, userId, checked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', competitionId] })
    },
  })
}

export function useUserZone(roundId?: string, userId?: string) {
  return useQuery({ queryKey: ['user-zone', roundId, userId], queryFn: () => getUserZoneForRound(roundId!, userId!), enabled: !!roundId && !!userId })
}

export function useResultsInRange(competitionId?: string, fromIso?: string | null, toIso?: string | null) {
  return useQuery({
    queryKey: ['results-range', competitionId, fromIso, toIso],
    queryFn: () => listResultsInRange(competitionId!, fromIso, toIso),
    enabled: !!competitionId,
  })
}

export function useAggregatedStandings(competitionId: string) {
  return useQuery({
    queryKey: ['standings', competitionId],
    queryFn: async () => {
      const all = await listResults(competitionId)
      const byUser: Record<string, { weight: number; count: number }> = {}
      for (const r of all) {
        const uid = r.participant_user_id
        if (!byUser[uid]) byUser[uid] = { weight: 0, count: 0 }
        byUser[uid].weight += r.weight_grams || 0
        byUser[uid].count += 1
      }
      const rows = Object.entries(byUser).map(([uid, agg]) => ({ userId: uid, totalWeight: agg.weight, totalCount: agg.count }))
      rows.sort((a, b) => b.totalWeight - a.totalWeight || b.totalCount - a.totalCount)
      return rows
    },
    enabled: !!competitionId,
  })
}

export function useTeamStandings(competitionId: string) {
  return useQuery({
    queryKey: ['team-standings', competitionId],
    queryFn: async () => {
      const [allResults, teamParts] = await Promise.all([listResults(competitionId), listTeamParticipants(competitionId)])
      // Aggregate per user
      const byUser: Record<string, { weight: number; count: number }> = {}
      for (const r of allResults) {
        const uid = r.participant_user_id
        if (!byUser[uid]) byUser[uid] = { weight: 0, count: 0 }
        byUser[uid].weight += r.weight_grams || 0
        byUser[uid].count += 1
      }
      // Sum per team (простое правило: сумма веса всех участников команды)
      const rows = teamParts.map((t: any) => {
        let totalWeight = 0
        let totalCount = 0
        for (const uid of t.participant_user_ids) {
          totalWeight += byUser[uid]?.weight || 0
          totalCount += byUser[uid]?.count || 0
        }
        return { teamId: t.team_id, teamName: t.team_name || t.team_id, totalWeight, totalCount }
      })
      rows.sort((a, b) => b.totalWeight - a.totalWeight || b.totalCount - a.totalCount)
      return rows
    },
    enabled: !!competitionId,
  })
}

export function useTeamStandingsByPlaces(competitionId: string) {
  return useQuery({
    queryKey: ['team-standings-places', competitionId],
    queryFn: async () => {
      const rounds = (await listRounds(competitionId)).filter((r: any) => r.kind === 'round')
      const teamParts = await listTeamParticipants(competitionId)
      if (rounds.length === 0 || teamParts.length === 0) return [] as Array<{ teamId: string; teamName: string; sumPlaces: number; totalWeight: number }>

      // Preload per-round results and assignments
      const perRoundData = await Promise.all(
        rounds.map(async (r: any) => {
          const startIso = r.started_at || r.start_at
          const endIso = r.ended_at || r.end_at
          const [resultsRange, assignments] = await Promise.all([
            listResultsInRange(competitionId, startIso, endIso),
            listRoundAssignments(r.id),
          ])
          // Aggregate weight per user inside the round timeframe
          const weightByUser: Record<string, number> = {}
          for (const res of resultsRange) {
            const uid = res.participant_user_id
            weightByUser[uid] = (weightByUser[uid] || 0) + (res.weight_grams || 0)
          }
          // Build zone-based ranking maps: user -> place, and also user -> roundWeight
          const zoneToUsers = new Map<string, string[]>()
          for (const a of assignments) {
            if (!zoneToUsers.has(a.zone_id)) zoneToUsers.set(a.zone_id, [])
            zoneToUsers.get(a.zone_id)!.push(a.participant_user_id)
          }
          const placeByUser: Record<string, number> = {}
          const roundWeightByUser: Record<string, number> = {}
          for (const [, users] of zoneToUsers) {
            const ranked = users
              .map((uid) => ({ uid, w: weightByUser[uid] || 0 }))
              .sort((a, b) => b.w - a.w)
            let place = 1
            let prevWeight: number | null = null
            let offset = 0
            for (let i = 0; i < ranked.length; i++) {
              const row = ranked[i]
              if (prevWeight === null) {
                place = 1
                prevWeight = row.w
              } else if (row.w < prevWeight) {
                place = i + 1
                prevWeight = row.w
              } else {
                // tie: keep same place
                offset++
              }
              placeByUser[row.uid] = place
              roundWeightByUser[row.uid] = row.w
            }
          }
          return { roundId: r.id, placeByUser, roundWeightByUser }
        })
      )

      // Sum places and weights per team across rounds
      const rows = teamParts.map((t) => {
        let sumPlaces = 0
        let totalWeight = 0
        for (const pr of perRoundData) {
          for (const uid of t.participant_user_ids) {
            if (pr.placeByUser[uid]) sumPlaces += pr.placeByUser[uid]
            if (pr.roundWeightByUser[uid]) totalWeight += pr.roundWeightByUser[uid]
          }
        }
        return { teamId: t.team_id, teamName: t.team_name || t.team_id, sumPlaces, totalWeight }
      })
      rows.sort((a: { sumPlaces: number; totalWeight: number }, b: { sumPlaces: number; totalWeight: number }) => a.sumPlaces - b.sumPlaces || b.totalWeight - a.totalWeight)
      return rows
    },
    enabled: !!competitionId,
  })
}


