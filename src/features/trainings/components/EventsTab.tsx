import { useState } from 'react'
import { Stack, Group, Select, TextInput, Paper, Text, Badge, ActionIcon, Button } from '@mantine/core'
import { IconTrash, IconPlus, IconEdit } from '@tabler/icons-react'
import type { TrainingEvent } from '../api'

interface EventsTabProps {
  events: TrainingEvent[]
  user: { id: string } | null
  users: { id: string; name: string }[]
  takenBaits: { user_bait_id: string; brand?: string | null; name?: string | null; color?: string | null; size?: string | null }[]
  onAddEvent: (kind: 'strike' | 'lost' | 'snag') => void
  onEditEvent: (event: TrainingEvent) => void
  onDeleteEvent: (id: string) => Promise<void>
}

export function EventsTab({
  events,
  user,
  users,
  takenBaits,
  onAddEvent,
  onEditEvent,
  onDeleteEvent
}: EventsTabProps) {
  const [filterKind, setFilterKind] = useState<string | undefined>(undefined)
  const [filterBait, setFilterBait] = useState<string>('')
  


  // Фильтруем события
  const filteredEvents = events
    .filter((e) => !filterKind || e.kind === filterKind)
    .filter(() => {
      if (!filterBait) return true
      // Здесь можно добавить фильтрацию по приманке, если она будет в событиях
      return true
    })

  const getEventLabel = (kind: string) => {
    switch (kind) {
      case 'strike': return 'Поклёвка'
      case 'lost': return 'Сход'
      case 'snag': return 'Зацеп'
      default: return kind
    }
  }

  const getEventColor = (kind: string) => {
    switch (kind) {
      case 'strike': return 'green'
      case 'lost': return 'red'
      case 'snag': return 'orange'
      default: return 'gray'
    }
  }

  const getEventIcon = (kind: string) => {
    switch (kind) {
      case 'strike': return '🎣'
      case 'lost': return '💨'
      case 'snag': return '🌿'
      default: return '📍'
    }
  }

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId)
    return foundUser?.name || 'Неизвестный пользователь'
  }

  const getBaitName = (event: TrainingEvent) => {
    // Сначала пытаемся получить из bait_info (новые данные из API)
    if ((event as any).bait_info) {
      const bait = (event as any).bait_info
      const baitName = `${bait.brand ?? ''} ${bait.name ?? ''}${bait.color ? ' ' + bait.color : ''}${bait.size ? ' ' + bait.size : ''}`.trim()
      
      // Если bait_info не содержит полезной информации, используем fallback
      if (baitName) {
        return baitName
      }
    }
    
    // Fallback на takenBaits
    if (event.bait_id) {
      const foundBait = takenBaits.find(tb => tb.user_bait_id === event.bait_id)
      
      if (foundBait) {
        const baitName = `${foundBait.brand ?? ''} ${foundBait.name ?? ''}${foundBait.color ? ' ' + foundBait.color : ''}${foundBait.size ? ' ' + foundBait.size : ''}`.trim()
        return baitName || 'Приманка не указана'
      }
    }
    
    return 'Приманка не указана'
  }

  const eventKinds = [
    { value: 'strike', label: 'Поклёвки' },
    { value: 'lost', label: 'Сходы' },
    { value: 'snag', label: 'Зацепы' }
  ]

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Select
            label="Фильтр: тип события"
            placeholder="Все"
            data={eventKinds}
            value={filterKind}
            onChange={(v) => setFilterKind(v || undefined)}
            clearable
            searchable
          />
          <TextInput
            label="Фильтр: приманка"
            placeholder="строка поиска"
            value={filterBait}
            onChange={(e) => setFilterBait(e.currentTarget.value)}
          />
        </Group>
        
        <Group>
          <Button 
            variant="light" 
            color="green" 
            leftSection={<IconPlus size={16} />}
            onClick={() => onAddEvent('strike')}
          >
            Добавить поклёвку
          </Button>
          <Button 
            variant="light" 
            color="red" 
            leftSection={<IconPlus size={16} />}
            onClick={() => onAddEvent('lost')}
          >
            Добавить сход
          </Button>
          <Button 
            variant="light" 
            color="orange" 
            leftSection={<IconPlus size={16} />}
            onClick={() => onAddEvent('snag')}
          >
            Добавить зацеп
          </Button>
        </Group>
      </Group>

      {filteredEvents.length === 0 ? (
        <Paper withBorder p="lg">
          <Text c="dimmed" ta="center">
            {events.length === 0 ? 'Событий пока нет' : 'По вашему фильтру ничего не найдено'}
          </Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {filteredEvents.map((event) => (
            <Paper key={event.id} withBorder p="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group gap="xs">
                    <Badge 
                      color={getEventColor(event.kind)} 
                      variant="light"
                      leftSection={getEventIcon(event.kind)}
                    >
                      {getEventLabel(event.kind)}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      {new Date(event.at).toLocaleString('ru-RU')}
                    </Text>
                  </Group>
                  
                                     <Text size="sm" c="dimmed">
                     Пользователь: {getUserName(event.user_id)}
                   </Text>
                   
                                       {event.bait_id && (
                      <Text size="sm" c="dimmed">
                        Приманка: {getBaitName(event)}
                      </Text>
                    )}
                   
                   {event.notes && (
                     <Text size="sm">{event.notes}</Text>
                   )}
                   
                   {event.lat && event.lng && (
                     <Text size="xs" c="dimmed">
                       Координаты: {event.lat.toFixed(6)}, {event.lng.toFixed(6)}
                     </Text>
                   )}
                </Stack>
                
                {user?.id === event.user_id && (
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => onEditEvent(event)}
                      title="Редактировать событие"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => onDeleteEvent(event.id)}
                      title="Удалить событие"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
