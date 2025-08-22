import { useState, useMemo, useCallback, memo } from 'react'
import { Stack, Group, Select, TextInput, Switch, Button, Card, Text } from '@mantine/core'
import { FixedSizeList as List } from 'react-window'
import type { TrainingCatch, TrainingTask } from '../api'

interface CatchesTabProps {
  catches: TrainingCatch[]
  fishKinds: any[]
  user: any
  onOpenManageBaits: () => void
  onAddCatch: () => void
  onEditCatch: (catch_: TrainingCatch) => void
  onDeleteCatch: (id: string) => Promise<void>
  activeTask?: TrainingTask | null
}

// Мемоизированный компонент для отображения одной поимки
const CatchCard = memo(({ 
  catch_, 
  fishKinds, 
  user, 
  onEditCatch, 
  onDeleteCatch,
  style 
}: { 
  catch_: TrainingCatch
  fishKinds: any[]
  user: any
  onEditCatch: (catch_: TrainingCatch) => void
  onDeleteCatch: (id: string) => Promise<void>
  style: React.CSSProperties
}) => {
  const getBaitLabel = useCallback((catch_: TrainingCatch) => {
    if ((catch_ as any).dict_baits) {
      const dict = (catch_ as any).dict_baits
      return `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}`.trim()
    }
    return catch_.bait_name || ''
  }, [])

  const getUserLabel = useCallback((catch_: TrainingCatch) => {
    return (catch_ as any).users?.raw_user_meta_data?.nickname || 
           (catch_ as any).users?.email || 
           catch_.user_id
  }, [])

  const handleEdit = useCallback(() => {
    onEditCatch(catch_)
  }, [catch_, onEditCatch])

  const handleDelete = useCallback(() => {
    onDeleteCatch(catch_.id)
  }, [catch_, onDeleteCatch])

  const fishName = useMemo(() => 
    fishKinds.find(f => f.id === catch_.fish_kind_id)?.name || '—', 
    [fishKinds, catch_.fish_kind_id]
  )

  const catchDate = useMemo(() => 
    new Date(catch_.caught_at).toLocaleString('ru-RU'), 
    [catch_.caught_at]
  )

  const coordinates = useMemo(() => 
    catch_.lat && catch_.lng ? `${catch_.lat.toFixed(5)}, ${catch_.lng.toFixed(5)}` : '', 
    [catch_.lat, catch_.lng]
  )

  const canEdit = useMemo(() => 
    catch_.user_id === user?.id, 
    [catch_.user_id, user?.id]
  )

  return (
    <div style={style}>
      <Card withBorder mb="xs">
        <Group justify="space-between">
          <Stack gap={2}>
            <Text fw={500}>
              Вид: {fishName}
            </Text>
            <Text size="sm" c="dimmed">
              {catchDate}
              {catch_.weight_g ? ` • Вес: ${(catch_.weight_g/1000).toFixed(2)} кг` : ''}
              {catch_.length_cm ? ` • Длина: ${catch_.length_cm} см` : ''}
            </Text>
            <Text size="sm" c="dimmed">
              Автор: {getUserLabel(catch_)}
            </Text>
            <Text size="sm" c="dimmed">
              Приманка: {getBaitLabel(catch_) || '—'}
            </Text>
          </Stack>
          
          <Group gap="xs">
            {coordinates && (
              <Text size="sm" c="dimmed">
                {coordinates}
              </Text>
            )}
            {canEdit && (
              <>
                <Button 
                  size="xs" 
                  variant="light" 
                  onClick={handleEdit}
                >
                  Редактировать
                </Button>
                <Button 
                  size="xs" 
                  color="red" 
                  variant="light" 
                  onClick={handleDelete}
                >
                  Удалить
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Card>
    </div>
  )
})

CatchCard.displayName = 'CatchCard'

// Виртуализированный список поимок
const VirtualizedCatchesList = memo(({ 
  catches, 
  fishKinds, 
  user, 
  onEditCatch, 
  onDeleteCatch 
}: { 
  catches: TrainingCatch[]
  fishKinds: any[]
  user: any
  onEditCatch: (catch_: TrainingCatch) => void
  onDeleteCatch: (id: string) => Promise<void>
}) => {
  const itemSize = 120 // Примерная высота одной карточки
  
  const renderRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const catch_ = catches[index]
    return (
      <CatchCard
        catch_={catch_}
        fishKinds={fishKinds}
        user={user}
        onEditCatch={onEditCatch}
        onDeleteCatch={onDeleteCatch}
        style={style}
      />
    )
  }, [catches, fishKinds, user, onEditCatch, onDeleteCatch])

  if (catches.length === 0) {
    return <Text c="dimmed">Поимок пока нет</Text>
  }

  return (
    <List
      height={Math.min(catches.length * itemSize, 600)} // Максимальная высота 600px
      itemCount={catches.length}
      itemSize={itemSize}
      width="100%"
    >
      {renderRow}
    </List>
  )
})

VirtualizedCatchesList.displayName = 'VirtualizedCatchesList'

export function CatchesTab({
  catches,
  fishKinds,
  user,
  onOpenManageBaits,
  onAddCatch,
  onEditCatch,
  onDeleteCatch,
  activeTask
}: CatchesTabProps) {
  const [filterFish, setFilterFish] = useState<string | undefined>(undefined)
  const [filterBait, setFilterBait] = useState<string>('')
  const [filterUser, setFilterUser] = useState<string | undefined>(undefined)
  const [onlyActiveSegment, setOnlyActiveSegment] = useState<boolean>(false)

  // Мемоизируем уникальный список пользователей для фильтра
  const uniqueUsers = useMemo(() => Array.from(
    new Map(
      catches.map((c) => [
        c.user_id, 
        (c as any).users?.raw_user_meta_data?.nickname || 
        (c as any).users?.email || 
        c.user_id
      ])
    ).entries()
  ).map(([id, label]) => ({ value: id, label })), [catches])

  // Мемоизируем фильтрацию поимок
  const filteredCatches = useMemo(() => catches
    .filter((c) => !filterFish || c.fish_kind_id === filterFish)
    .filter((c) => !filterUser || c.user_id === filterUser)
    .filter((c) => {
      const label = ((c as any).dict_baits
        ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`
        : (c.bait_name || '')).toLowerCase()
      return !filterBait || label.includes(filterBait.toLowerCase())
    }), [catches, filterFish, filterUser, filterBait])

  // Мемоизируем обработчики фильтров
  const handleFilterFishChange = useCallback((value: string | null) => {
    setFilterFish(value || undefined)
  }, [])

  const handleFilterUserChange = useCallback((value: string | null) => {
    setFilterUser(value || undefined)
  }, [])

  const handleFilterBaitChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterBait(event.currentTarget.value)
  }, [])

  const handleOnlyActiveSegmentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOnlyActiveSegment(event.currentTarget.checked)
  }, [])

  // Мемоизируем данные для Select компонентов
  const fishKindsData = useMemo(() => 
    fishKinds.map((f) => ({ value: f.id, label: f.name })), 
    [fishKinds]
  )

  return (
    <Stack gap="sm">
      <Group>
        <Select
          label="Фильтр: вид рыбы"
          placeholder="Все"
          data={fishKindsData}
          value={filterFish}
          onChange={handleFilterFishChange}
          clearable
          searchable
        />
        <Select
          label="Фильтр: участник"
          placeholder="Все"
          data={uniqueUsers}
          value={filterUser}
          onChange={handleFilterUserChange}
          clearable
          searchable
        />
        <TextInput
          label="Фильтр: приманка"
          placeholder="строка поиска"
          value={filterBait}
          onChange={handleFilterBaitChange}
        />
        <Switch
          label="Только активный сегмент"
          checked={onlyActiveSegment}
          onChange={handleOnlyActiveSegmentChange}
          disabled={!activeTask?.segment_id}
        />
      </Group>
      
      <Group justify="space-between" align="center">
        <Group>
          <Button variant="light" onClick={onOpenManageBaits}>
            Мои приманки
          </Button>
        </Group>
        <Button onClick={onAddCatch}>Добавить поимку</Button>
      </Group>
      
      {/* Используем виртуализацию для больших списков */}
      {filteredCatches.length > 50 ? (
        <VirtualizedCatchesList
          catches={filteredCatches}
          fishKinds={fishKinds}
          user={user}
          onEditCatch={onEditCatch}
          onDeleteCatch={onDeleteCatch}
        />
      ) : (
        filteredCatches.map((c) => (
          <CatchCard
            key={c.id}
            catch_={c}
            fishKinds={fishKinds}
            user={user}
            onEditCatch={onEditCatch}
            onDeleteCatch={onDeleteCatch}
            style={{}}
          />
        ))
      )}
    </Stack>
  )
}
