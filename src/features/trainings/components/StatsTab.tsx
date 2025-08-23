import { Stack, Group, Card, Title, Text } from '@mantine/core'
import type { TrainingCatch, TrainingEvent } from '../api'
import type { FishKind } from '../../dicts/fish/api'

interface StatsTabProps {
  catches: TrainingCatch[]
  events: TrainingEvent[]
  fishKinds: FishKind[]
  takenBaits: { user_bait_id: string; brand?: string | null; name?: string | null; color?: string | null; size?: string | null }[]
  filterFish?: string
  filterUser?: string
  filterBait: string
  targetFishKinds?: string[] | null
}

export function StatsTab({
  catches,
  events,
  fishKinds,
  takenBaits,
  filterFish,
  filterUser,
  filterBait,
  targetFishKinds
}: StatsTabProps) {
  
  // Отладочная информация
  console.log('StatsTab data:', {
    eventsCount: events.length,
    takenBaitsCount: takenBaits.length,
    sampleEvent: events[0],
    sampleTakenBait: takenBaits[0]
  })
  // Фильтруем данные для статистики
  const filtered = catches
    .filter((c) => !filterFish || c.fish_kind_id === filterFish)
    .filter((c) => !filterUser || c.user_id === filterUser)
    .filter((c) => {
      const label = ((c as any).dict_baits
        ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`
        : (c.bait_name || '')).toLowerCase()
      return !filterBait || label.includes(filterBait.toLowerCase())
    })

  const total = filtered.length
  const totalWeightG = filtered.reduce((s, c) => s + (c.weight_g || 0), 0)

  // По видам рыбы
  const species: Record<string, { name: string; count: number; weightG: number }> = {}
  for (const c of filtered) {
    const id = c.fish_kind_id || '—'
    const name = fishKinds.find(f => f.id === c.fish_kind_id)?.name || '—'
    if (!species[id]) species[id] = { name, count: 0, weightG: 0 }
    species[id].count += 1
    species[id].weightG += (c.weight_g || 0)
  }

  // По участникам
  const byUser: Record<string, { label: string; count: number; weightG: number }> = {}
  for (const c of filtered) {
    const label = (c as any).users?.raw_user_meta_data?.nickname || (c as any).users?.email || c.user_id
    if (!byUser[c.user_id]) byUser[c.user_id] = { label, count: 0, weightG: 0 }
    byUser[c.user_id].count += 1
    byUser[c.user_id].weightG += (c.weight_g || 0)
  }

  // По приманкам
  type BaitAgg = { label: string; count: number; weightG: number }
  const byBait = new Map<string, BaitAgg>()
  for (const c of filtered) {
    const dict = (c as any).dict_baits
    const baitLabel = (dict ? `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}` : (c.bait_name || '—')).trim()
    const key = c.bait_id ? `d:${c.bait_id}` : `n:${baitLabel.toLowerCase()}`
    const prev = byBait.get(key) || { label: baitLabel, count: 0, weightG: 0 }
    prev.count += 1
    prev.weightG += (c.weight_g || 0)
    prev.label = baitLabel
    byBait.set(key, prev)
  }

  // По участникам × приманки
  type UB = { userLabel: string; baitLabel: string; count: number; weightG: number }
  const userBaitMap = new Map<string, UB>()
  for (const c of filtered) {
    const uLabel = (c as any).users?.raw_user_meta_data?.nickname || (c as any).users?.email || c.user_id
    const dict = (c as any).dict_baits
    const baitLabel = (dict ? `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}` : (c.bait_name || '—')).trim()
    const uKey = c.user_id
    const bKey = c.bait_id ? `d:${c.bait_id}` : `n:${baitLabel.toLowerCase()}`
    const key = `${uKey}::${bKey}`
    const prev = userBaitMap.get(key) || { userLabel: uLabel, baitLabel, count: 0, weightG: 0 }
    prev.count += 1
    prev.weightG += (c.weight_g || 0)
    prev.baitLabel = baitLabel
    prev.userLabel = uLabel
    userBaitMap.set(key, prev)
  }

  // По участникам × виды рыбы
  type UF = { userLabel: string; fishLabel: string; count: number; weightG: number }
  const userFishMap = new Map<string, UF>()
  for (const c of filtered) {
    const uLabel = (c as any).users?.raw_user_meta_data?.nickname || (c as any).users?.email || c.user_id
    const fishLabel = fishKinds.find(f => f.id === c.fish_kind_id)?.name || '—'
    const key = `${c.user_id}::${c.fish_kind_id || '—'}`
    const prev = userFishMap.get(key) || { userLabel: uLabel, fishLabel, count: 0, weightG: 0 }
    prev.count += 1
    prev.weightG += (c.weight_g || 0)
    prev.fishLabel = fishLabel
    prev.userLabel = uLabel
    userFishMap.set(key, prev)
  }

  const byUserArr = Object.entries(byUser).map(([uid, v]) => ({ uid, ...v })).sort((a,b) => b.count - a.count)
  const byFishArr = Object.values(species).sort((a,b) => b.count - a.count)
  const byBaitArr = Array.from(byBait.values()).sort((a,b) => b.count - a.count)
  const userBaitArr = Array.from(userBaitMap.values()).sort((a,b) => a.userLabel.localeCompare(b.userLabel) || b.count - a.count)
  const userFishArr = Array.from(userFishMap.values()).sort((a,b) => a.userLabel.localeCompare(b.userLabel) || b.count - a.count)

  // Статистика по событиям
  const totalEvents = events.length
  const totalActivity = total + totalEvents
  
  // По типам событий
  const eventTypes: Record<string, { label: string; count: number }> = {}
  for (const event of events) {
    const label = event.kind === 'strike' ? 'Поклёвки' : event.kind === 'lost' ? 'Сходы' : 'Зацепы'
    if (!eventTypes[event.kind]) eventTypes[event.kind] = { label, count: 0 }
    eventTypes[event.kind].count += 1
  }

  // Эффективность (поклёвки vs сходы)
  const strikes = eventTypes['strike']?.count || 0
  const lost = eventTypes['lost']?.count || 0
  const effectiveness = strikes > 0 ? ((strikes / (strikes + lost)) * 100).toFixed(1) : '0.0'

  // Анализ по целевой рыбе
  const targetFishAnalysis = targetFishKinds ? (() => {
    const targetFishIds = new Set(targetFishKinds)
    const targetCatches = filtered.filter(c => c.fish_kind_id && targetFishIds.has(c.fish_kind_id))
    const targetEvents = events.filter(() => {
      // Для событий анализируем по приманке, так как рыба не указана
      return true // Пока анализируем все события
    })
    
    return {
      targetCatchesCount: targetCatches.length,
      targetCatchesWeight: targetCatches.reduce((s, c) => s + (c.weight_g || 0), 0),
      targetEventsCount: targetEvents.length,
      totalActivity: targetCatches.length + targetEvents.length,
      targetFishPercentage: filtered.length > 0 ? ((targetCatches.length / filtered.length) * 100).toFixed(1) : '0.0'
    }
  })() : null

  // По участникам для событий
  const eventsByUser: Record<string, { label: string; count: number }> = {}
  for (const event of events) {
    const label = (event as any).users?.raw_user_meta_data?.nickname || (event as any).users?.email || event.user_id
    if (!eventsByUser[event.user_id]) eventsByUser[event.user_id] = { label, count: 0 }
    eventsByUser[event.user_id].count += 1
  }

  // По приманкам для событий
  const eventsByBait: Record<string, { label: string; count: number }> = {}
  for (const event of events) {
    if (event.bait_id) {
      // Сначала пытаемся получить из bait_info (новые данные из API)
      let baitLabel = 'Приманка не указана'
      if ((event as any).bait_info) {
        const bait = (event as any).bait_info
        baitLabel = `${bait.brand ?? ''} ${bait.name ?? ''}${bait.color ? ' ' + bait.color : ''}${bait.size ? ' ' + bait.size : ''}`.trim()
        
        // Если bait_info не содержит полезной информации, используем fallback
        if (!baitLabel) {
          baitLabel = 'Приманка не указана'
        }
      }
      
      // Fallback на takenBaits
      if (baitLabel === 'Приманка не указана') {
        const foundBait = takenBaits.find(tb => tb.user_bait_id === event.bait_id)
        if (foundBait) {
          baitLabel = `${foundBait.brand ?? ''} ${foundBait.name ?? ''}${foundBait.color ? ' ' + foundBait.color : ''}${foundBait.size ? ' ' + foundBait.size : ''}`.trim()
        }
      }
      
      // Отладочная информация
      console.log('Event bait processing:', {
        eventId: event.id,
        baitId: event.bait_id,
        baitInfo: (event as any).bait_info,
        foundBait: takenBaits.find(tb => tb.user_bait_id === event.bait_id),
        finalLabel: baitLabel
      })
      
      if (!eventsByBait[event.bait_id]) eventsByBait[event.bait_id] = { label: baitLabel, count: 0 }
      eventsByBait[event.bait_id].count += 1
    } else {
      if (!eventsByBait['no-bait']) eventsByBait['no-bait'] = { label: 'Приманка не указана', count: 0 }
      eventsByBait['no-bait'].count += 1
    }
  }

  const eventTypesArr = Object.values(eventTypes).sort((a,b) => b.count - a.count)
  const eventsByUserArr = Object.entries(eventsByUser).map(([uid, v]) => ({ uid, ...v })).sort((a,b) => b.count - a.count)
  const eventsByBaitArr = Object.values(eventsByBait).sort((a,b) => b.count - a.count)

  return (
    <Stack gap="sm">
             <Group wrap="wrap">
        <Card withBorder p="md">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">Всего поимок</Text>
            <Title order={3}>{total}</Title>
          </Stack>
        </Card>
        <Card withBorder p="md">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">Суммарный вес</Text>
            <Title order={3}>{(totalWeightG/1000).toFixed(2)} кг</Title>
          </Stack>
        </Card>
        <Card withBorder p="md">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">Видов</Text>
            <Title order={3}>{byFishArr.filter(x => x.name !== '—').length}</Title>
          </Stack>
        </Card>
        <Card withBorder p="md">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">Всего событий</Text>
            <Title order={3}>{totalEvents}</Title>
          </Stack>
        </Card>
        <Card withBorder p="md">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">Общая активность</Text>
            <Title order={3}>{totalActivity}</Title>
          </Stack>
        </Card>
        <Card withBorder p="md">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">Эффективность</Text>
            <Title order={3}>{effectiveness}%</Title>
            <Text size="xs" c="dimmed">Поклёвки/Сходы</Text>
          </Stack>
        </Card>
        
        {/* Статистика по целевой рыбе */}
        {targetFishAnalysis && (
          <Card withBorder p="md" bg="blue.0">
            <Stack gap={4}>
              <Text size="sm" c="blue">🎯 Целевая рыба</Text>
              <Title order={3} c="blue">{targetFishAnalysis.targetCatchesCount}</Title>
                              <Text size="xs" c="blue">
                {targetFishAnalysis.targetCatchesWeight > 0 
                  ? `${(targetFishAnalysis.targetCatchesWeight/1000).toFixed(2)} кг • ${targetFishAnalysis.targetFishPercentage}% от всех поимок`
                  : `${targetFishAnalysis.targetFishPercentage}% от всех поимок`
                }
              </Text>
            </Stack>
          </Card>
        )}
      </Group>

      <Card withBorder p="md">
        <Title order={5} mb="xs">По участникам</Title>
        <Stack gap={6}>
          {byUserArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {byUserArr.map((r) => (
            <Group key={r.uid} justify="space-between">
              <Text>{r.label}</Text>
              <Text c="dimmed">{r.count} • {(r.weightG/1000).toFixed(2)} кг</Text>
            </Group>
          ))}
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">По видам рыбы</Title>
        <Stack gap={6}>
          {byFishArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {byFishArr.map((r, i) => (
            <Group key={`${r.name}-${i}`} justify="space-between">
              <Text>{r.name}</Text>
              <Text c="dimmed">{r.count} • {(r.weightG/1000).toFixed(2)} кг</Text>
            </Group>
          ))}
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">По приманкам</Title>
        <Stack gap={6}>
          {byBaitArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {byBaitArr.map((r, i) => (
            <Group key={`${r.label}-${i}`} justify="space-between">
              <Text>{r.label}</Text>
              <Text c="dimmed">{r.count} • {(r.weightG/1000).toFixed(2)} кг</Text>
            </Group>
          ))}
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">По участникам × приманки</Title>
        <Stack gap={6}>
          {userBaitArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {userBaitArr.map((r, i) => (
            <Group key={`${r.userLabel}-${r.baitLabel}-${i}`} justify="space-between">
              <Text>{r.userLabel} — {r.baitLabel}</Text>
              <Text c="dimmed">{r.count} • {(r.weightG/1000).toFixed(2)} кг</Text>
            </Group>
          ))}
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">По участникам × виды рыбы</Title>
        <Stack gap={6}>
          {userFishArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {userFishArr.map((r, i) => (
            <Group key={`${r.userLabel}-${r.fishLabel}-${i}`} justify="space-between">
              <Text>{r.userLabel} — {r.fishLabel}</Text>
              <Text c="dimmed">{r.count} • {(r.weightG/1000).toFixed(2)} кг</Text>
            </Group>
          ))}
        </Stack>
      </Card>

      {/* Статистика по событиям */}
      <Card withBorder p="md">
        <Title order={5} mb="xs">По типам событий</Title>
        <Stack gap={6}>
          {eventTypesArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {eventTypesArr.map((r, i) => (
            <Group key={`${r.label}-${i}`} justify="space-between">
              <Text>{r.label}</Text>
              <Text c="dimmed">{r.count}</Text>
            </Group>
          ))}
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">События по участникам</Title>
        <Stack gap={6}>
          {eventsByUserArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {eventsByUserArr.map((r, i) => (
            <Group key={`${r.label}-${i}`} justify="space-between">
              <Text>{r.label}</Text>
              <Text c="dimmed">{r.count}</Text>
            </Group>
          ))}
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Title order={5} mb="xs">События по приманкам</Title>
        <Stack gap={6}>
          {eventsByBaitArr.length === 0 && <Text c="dimmed">Нет данных</Text>}
          {eventsByBaitArr.map((r, i) => (
            <Group key={`${r.label}-${i}`} justify="space-between">
              <Text>{r.label}</Text>
              <Text c="dimmed">{r.count}</Text>
            </Group>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}
