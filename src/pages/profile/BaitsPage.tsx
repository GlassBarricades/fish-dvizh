import { useState } from 'react'
import { Paper, Stack, Title, Text, Button, Group, Card, Select, TextInput } from '@mantine/core'
import { useAuth } from '@/features/auth/hooks'
import { useProfilePageVM } from '@/features/profile/model/useProfilePageVM'
import { useTeamMembers } from '@/features/teams/hooks'
import { useCatchesByUsers } from '@/features/trainings/hooks'
import { notifications } from '@mantine/notifications'

export default function BaitsPage() {
  const { user } = useAuth()
  
  const {
    dictBaits,
    userBaits,
    userTeams,
    userCatches,
    addFromDict,
    isAddingFromDict,
    addCustom,
    isAddingCustom,
    removeUserBait,
  } = useProfilePageVM(user?.id)

  const [dictId, setDictId] = useState<string | undefined>(undefined)
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Title order={2}>Мои приманки</Title>

        <Card withBorder p="md">
          <Title order={4} mb="xs">Добавить из справочника</Title>
          <Group align="flex-end" gap="sm">
            <Select
              label="Приманка из справочника"
              placeholder="Выберите"
              searchable
              data={(dictBaits || []).map((b: any) => ({ 
                value: b.id, 
                label: `${b.brand ?? ''} ${b.name ?? ''}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}`.trim() 
              }))}
              value={dictId}
              onChange={(v) => setDictId(v || undefined)}
              style={{ minWidth: 320 }}
            />
            <Button 
              onClick={async () => {
                if (!user || !dictId) return
                try { 
                  await addFromDict({ user_id: user.id, dict_bait_id: dictId })
                  setDictId(undefined)
                } catch (e: any) { 
                  // Error handled in VM
                }
              }} 
              disabled={!dictId} 
              loading={isAddingFromDict}
            >
              Добавить
            </Button>
          </Group>
        </Card>

        <Card withBorder p="md">
          <Title order={4} mb="xs">Добавить кастомную</Title>
          <Group align="flex-end" gap="sm">
            <TextInput 
              label="Производитель" 
              placeholder="Brand" 
              value={brand} 
              onChange={(e) => setBrand(e.currentTarget.value)} 
              required 
              style={{ minWidth: 180 }} 
            />
            <TextInput 
              label="Название" 
              placeholder="Model" 
              value={name} 
              onChange={(e) => setName(e.currentTarget.value)} 
              required 
              style={{ minWidth: 200 }} 
            />
            <TextInput 
              label="Цвет" 
              placeholder="Color" 
              value={color} 
              onChange={(e) => setColor(e.currentTarget.value)} 
              style={{ minWidth: 140 }} 
            />
            <TextInput 
              label="Размер" 
              placeholder="Size" 
              value={size} 
              onChange={(e) => setSize(e.currentTarget.value)} 
              style={{ minWidth: 120 }} 
            />
            <Button 
              onClick={async () => {
                if (!user) return
                try { 
                  await addCustom({ 
                    user_id: user.id, 
                    brand: brand.trim(), 
                    name: name.trim(), 
                    color: color.trim() || undefined, 
                    size: size.trim() || undefined 
                  })
                  setBrand('')
                  setName('')
                  setColor('')
                  setSize('')
                } catch (e: any) { 
                  // Error handled in VM
                }
              }} 
              disabled={!brand.trim() || !name.trim()} 
              loading={isAddingCustom}
            >
              Добавить
            </Button>
          </Group>
        </Card>

        <Card withBorder p="md">
          <Title order={4} mb="xs">Ваши приманки</Title>
          <UserBaitsList baits={userBaits || []} onDelete={async (id) => {
            try { await removeUserBait({ id }) } catch (e: any) { 
              // Error handled in VM
            }
          }} />
        </Card>

        <Card withBorder p="md">
          <Title order={4} mb="xs">Статистика поимок по приманкам</Title>
          <BaitsStats catches={userCatches || []} />
        </Card>

        <Card withBorder p="md">
          <Title order={4} mb="xs">Статистика по приманкам по членам команды</Title>
          <TeamBaitsStats userTeams={userTeams || []} />
        </Card>
      </Stack>
    </Paper>
  )
}

// Компонент списка приманок пользователя
function UserBaitsList({ baits, onDelete }: { baits: any[]; onDelete: (id: string) => void | Promise<void> }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'brand' | 'name' | 'color' | 'size'>('brand')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = (baits || []).filter((b) => {
    if (!query.trim()) return true
    const text = `${b.brand ?? ''} ${b.name ?? ''} ${b.color ?? ''} ${b.size ?? ''}`.toLowerCase().trim()
    return text.includes(query.toLowerCase().trim())
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const va = (sortBy === 'brand' ? (a.brand || '') : sortBy === 'name' ? (a.name || '') : sortBy === 'color' ? (a.color || '') : (a.size || '')).toLowerCase()
    const vb = (sortBy === 'brand' ? (b.brand || '') : sortBy === 'name' ? (b.name || '') : sortBy === 'color' ? (b.color || '') : (b.size || '')).toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })

  return (
    <Stack gap="sm">
      <Group gap="sm" wrap="wrap">
        <TextInput 
          label="Поиск" 
          placeholder="Поиск (бренд, название, цвет, размер)" 
          value={query} 
          onChange={(e) => setQuery(e.currentTarget.value)} 
          style={{ minWidth: 260 }} 
        />
        <Select 
          label="Сортировка" 
          value={sortBy} 
          onChange={(v) => setSortBy((v as any) || 'brand')} 
          data={[
            { value: 'brand', label: 'Производитель' },
            { value: 'name', label: 'Название' },
            { value: 'color', label: 'Цвет' },
            { value: 'size', label: 'Размер' },
          ]} 
          style={{ width: 220 }} 
        />
        <Select 
          label="Порядок" 
          value={sortDir} 
          onChange={(v) => setSortDir((v as any) || 'asc')} 
          data={[
            { value: 'asc', label: 'По возрастанию' },
            { value: 'desc', label: 'По убыванию' },
          ]} 
          style={{ width: 180 }} 
        />
      </Group>
      <Stack gap={6}>
        {filtered.length === 0 && <Text c="dimmed">Ничего не найдено</Text>}
        {filtered.map((b: any) => (
          <Group key={b.id} justify="space-between">
            <Text>{`${b.brand ?? ''} ${b.name ?? ''}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}`.trim()}</Text>
            <Button size="xs" color="red" variant="light" onClick={() => onDelete(b.id)}>Удалить</Button>
          </Group>
        ))}
      </Stack>
    </Stack>
  )
}

// Компонент статистики по приманкам
function BaitsStats({ catches }: { catches: any[] }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'count' | 'weight' | 'name'>('count')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  type Row = { key: string; label: string; totalCount: number; totalWeightG: number }
  const map = new Map<string, Row>()
  for (const c of catches || []) {
    const dict = (c as any).dict_baits
    const label = (dict
      ? `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}`
      : (c.bait_name || '—')).trim()
    const key = c.bait_id ? `d:${c.bait_id}` : `n:${label.toLowerCase()}`
    const prev = map.get(key) || { key, label, totalCount: 0, totalWeightG: 0 }
    prev.totalCount += 1
    prev.totalWeightG += (c.weight_g || 0)
    prev.label = label
    map.set(key, prev)
  }
  let rows = Array.from(map.values())
  if (query.trim()) {
    const q = query.toLowerCase().trim()
    rows = rows.filter(r => r.label.toLowerCase().includes(q))
  }
  rows.sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'name') {
      const va = a.label.toLowerCase(), vb = b.label.toLowerCase()
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    }
    if (sortBy === 'weight') {
      if (a.totalWeightG < b.totalWeightG) return -1 * dir
      if (a.totalWeightG > b.totalWeightG) return 1 * dir
      return 0
    }
    if (a.totalCount < b.totalCount) return -1 * dir
    if (a.totalCount > b.totalCount) return 1 * dir
    return 0
  })

  return (
    <Stack gap="sm">
      <Group gap="sm" wrap="wrap">
        <TextInput 
          label="Поиск" 
          placeholder="Название/бренд/цвет/размер" 
          value={query} 
          onChange={(e) => setQuery(e.currentTarget.value)} 
          style={{ minWidth: 260 }} 
        />
        <Select 
          label="Сортировка" 
          value={sortBy} 
          onChange={(v) => setSortBy((v as any) || 'count')} 
          data={[
            { value: 'count', label: 'Кол-во поимок' },
            { value: 'weight', label: 'Суммарный вес' },
            { value: 'name', label: 'Название' },
          ]} 
          style={{ width: 220 }} 
        />
        <Select 
          label="Порядок" 
          value={sortDir} 
          onChange={(v) => setSortDir((v as any) || 'desc')} 
          data={[
            { value: 'desc', label: 'По убыванию' },
            { value: 'asc', label: 'По возрастанию' },
          ]} 
          style={{ width: 180 }} 
        />
      </Group>
      <Stack gap={6}>
        {rows.length === 0 && <Text c="dimmed">Нет данных</Text>}
        {rows.map(r => (
          <Group key={r.key} justify="space-between">
            <Text>{r.label}</Text>
            <Text c="dimmed">{r.totalCount} • {(r.totalWeightG/1000).toFixed(2)} кг</Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  )
}

// Компонент статистики по приманкам команды
function TeamBaitsStats({ userTeams }: { userTeams: any[] }) {
  const [teamId, setTeamId] = useState<string | undefined>(userTeams[0]?.id)
  const { data: teamMembers } = useTeamMembers(teamId || '')
  const memberIds = (teamMembers || []).map((m: any) => m.user_id)
  const { data: catches } = useCatchesByUsers(memberIds)

  type Row = { userId: string; userLabel: string; baitKey: string; baitLabel: string; count: number; weightG: number }
  const rows: Row[] = []
  const byUser: Record<string, { email?: string; nickname?: string }> = {}
  ;(teamMembers || []).forEach((m: any) => {
    byUser[m.user_id] = { email: m.user_email, nickname: m.user_nickname }
  })
  for (const c of catches || []) {
    const dict = (c as any).dict_baits
    const baitLabel = (dict ? `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}` : (c.bait_name || '—')).trim()
    const baitKey = c.bait_id ? `d:${c.bait_id}` : `n:${baitLabel.toLowerCase()}`
    rows.push({
      userId: c.user_id,
      userLabel: byUser[c.user_id]?.nickname || byUser[c.user_id]?.email || c.user_id,
      baitKey,
      baitLabel,
      count: 1,
      weightG: c.weight_g || 0,
    })
  }
  
  const aggMap = new Map<string, { userId: string; userLabel: string; baitLabel: string; count: number; weightG: number }>()
  for (const r of rows) {
    const key = `${r.userId}::${r.baitKey}`
    const prev = aggMap.get(key) || { userId: r.userId, userLabel: r.userLabel, baitLabel: r.baitLabel, count: 0, weightG: 0 }
    prev.count += r.count
    prev.weightG += r.weightG
    prev.baitLabel = r.baitLabel
    aggMap.set(key, prev)
  }
  const list = Array.from(aggMap.values())

  list.sort((a, b) => {
    if (a.userLabel.toLowerCase() < b.userLabel.toLowerCase()) return -1
    if (a.userLabel.toLowerCase() > b.userLabel.toLowerCase()) return 1
    if (a.count > b.count) return -1
    if (a.count < b.count) return 1
    return 0
  })

  return (
    <Stack gap="sm">
      <Group gap="sm" wrap="wrap">
        <Select
          label="Команда"
          placeholder="Выберите команду"
          data={(userTeams || []).map((t: any) => ({ value: t.id, label: t.name }))}
          value={teamId}
          onChange={(v) => setTeamId(v || undefined)}
          searchable
          style={{ minWidth: 260 }}
        />
      </Group>
      <Stack gap={6}>
        {(!teamId || (teamMembers || []).length === 0) && <Text c="dimmed">Выберите команду</Text>}
        {teamId && list.length === 0 && <Text c="dimmed">Нет данных</Text>}
        {list.map((r, i) => (
          <Group key={`${r.userId}-${i}`} justify="space-between">
            <Text>{r.userLabel} — {r.baitLabel}</Text>
            <Text c="dimmed">{r.count} • {(r.weightG/1000).toFixed(2)} кг</Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  )
}
