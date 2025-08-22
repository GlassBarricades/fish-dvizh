import { useState } from 'react'
import { Stack, Group, Select, TextInput, Paper } from '@mantine/core'
import { MapContainer, Marker, Polygon as RLPolygon, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import type { TrainingCatch, TrainingTask } from '../api'
import { MapVisibilityFix } from './MapVisibilityFix'
import { FlyToActiveSegment } from './FlyToActiveSegment'

interface MapTabProps {
  catches: TrainingCatch[]
  fishKinds: any[]
  segments: any[]
  events: any[]
  activeTask?: TrainingTask | null
  user: any
  users: { id: string; name: string }[]
  takenBaits: { user_bait_id: string; brand?: string | null; name?: string | null; color?: string | null; size?: string | null }[]
  onDeleteEvent: (id: string) => Promise<void>
  training?: any
}

export function MapTab({
  catches,
  fishKinds,
  segments,
  events,
  activeTask,
  user,
  users,
  takenBaits,
  onDeleteEvent,
  training
}: MapTabProps) {
  const [filterFish, setFilterFish] = useState<string | undefined>(undefined)
  const [filterBait, setFilterBait] = useState<string>('')

  // Локальные функции для пинов событий
  const pinIcon = () => {
    // Создаем иконку для событий
    return new L.Icon({ 
      iconUrl, 
      shadowUrl: iconShadowUrl, 
      iconSize: [25, 41], 
      iconAnchor: [12, 41]
    })
  }
  
  const pinLabel = (kind: 'strike' | 'lost' | 'snag') => {
    return kind === 'strike' ? 'Поклёвка' : kind === 'lost' ? 'Сход' : 'Зацеп'
  }



  // Фильтруем поимки для карты
  const mapCatches = catches
    .filter((c) => !filterFish || c.fish_kind_id === filterFish)
    .filter((c) => {
      const baitLabel = (c as any).dict_baits
        ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`.toLowerCase()
        : (c.bait_name || '').toLowerCase()
      return !filterBait || baitLabel.includes(filterBait.toLowerCase())
    })
    .filter((c) => c.lat && c.lng)

  const getBaitLabel = (catch_: TrainingCatch) => {
    if ((catch_ as any).dict_baits) {
      const dict = (catch_ as any).dict_baits
      return `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}`.trim()
    }
    return catch_.bait_name || ''
  }

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId)
    return foundUser?.name || 'Неизвестный пользователь'
  }

  const getEventBaitName = (event: { bait_info?: { brand?: string; name?: string; color?: string; size?: string }; bait_id?: string }) => {
    // Сначала пытаемся получить из bait_info (новые данные из API)
    if (event.bait_info) {
      const bait = event.bait_info
      const baitName = `${bait.brand ?? ''} ${bait.name ?? ''}${bait.color ? ' ' + bait.color : ''}${bait.size ? ' ' + bait.size : ''}`.trim()
      return baitName || 'Приманка не указана'
    }
    
    // Fallback на takenBaits (старый способ)
    if (event.bait_id) {
      const foundBait = takenBaits.find(tb => tb.user_bait_id === event.bait_id)
      if (foundBait) {
        const baitName = `${foundBait.brand ?? ''} ${foundBait.name ?? ''}${foundBait.color ? ' ' + foundBait.color : ''}${foundBait.size ? ' ' + foundBait.size : ''}`.trim()
        return baitName || 'Приманка не указана'
      }
    }
    
    return 'Приманка не указана'
  }

  // Вычисляем центр карты на основе тренировки
  const mapCenter = (() => {
    // Если есть активный сегмент, центрируем на нем
    if (activeTask && segments.length > 0) {
      const activeSegment = segments.find(s => s.id === activeTask.segment_id)
      if (activeSegment?.area_geojson?.coordinates?.[0]) {
        const coords = activeSegment.area_geojson.coordinates[0]
        const centerLat = coords.reduce((sum: number, coord: [number, number]) => sum + coord[1], 0) / coords.length
        const centerLng = coords.reduce((sum: number, coord: [number, number]) => sum + coord[0], 0) / coords.length
        return [centerLat, centerLng] as [number, number]
      }
    }
    
    // Если есть точка тренировки, центрируем на ней
    if (training?.lat && training?.lng) {
      return [training.lat, training.lng] as [number, number]
    }
    
    // Если есть сегменты, центрируем на их общем центре
    if (segments.length > 0) {
      const allCoords: [number, number][] = []
      segments.forEach(segment => {
        if (segment.area_geojson?.coordinates?.[0]) {
          allCoords.push(...segment.area_geojson.coordinates[0])
        }
      })
      if (allCoords.length > 0) {
        const centerLat = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length
        const centerLng = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length
        return [centerLat, centerLng] as [number, number]
      }
    }
    
    // Если есть поимки, центрируем на их центре
    if (mapCatches.length > 0) {
      const centerLat = mapCatches.reduce((sum, c) => sum + (c.lat as number), 0) / mapCatches.length
      const centerLng = mapCatches.reduce((sum, c) => sum + (c.lng as number), 0) / mapCatches.length
      return [centerLat, centerLng] as [number, number]
    }
    
    // Дефолтный центр
    return [53.9, 27.5667] as [number, number]
  })()

  return (
    <Stack gap="sm">
      <Group>
        <Select
          label="Фильтр: вид рыбы"
          placeholder="Все"
          data={fishKinds.map((f) => ({ value: f.id, label: f.name }))}
          value={filterFish}
          onChange={(v) => setFilterFish(v || undefined)}
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
      
      <Paper withBorder>
        <div style={{ height: 520 }}>
          <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapVisibilityFix />
            <FlyToActiveSegment 
              segments={segments || []} 
              activeSegmentId={activeTask?.segment_id || undefined} 
            />
            
            {/* Сегменты */}
            {segments.map((s: any) => {
              const ring = s.area_geojson?.coordinates?.[0] || []
              const latlngs = ring.map((p: [number, number]) => [p[1], p[0]])
              const isActive = activeTask && activeTask.segment_id === s.id
              return (
                <RLPolygon 
                  key={s.id} 
                  positions={latlngs as any} 
                  pathOptions={{ 
                    color: isActive ? 'red' : 'orange', 
                    weight: isActive ? 3 : 2, 
                    fillOpacity: isActive ? 0.2 : 0.1 
                  }} 
                />
              )
            })}
            
            {/* Поимки */}
            {mapCatches.map((c) => (
              <Marker 
                key={c.id} 
                position={[c.lat as number, c.lng as number]} 
                icon={new L.Icon({ 
                  iconUrl, 
                  shadowUrl: iconShadowUrl, 
                  iconSize: [25,41], 
                  iconAnchor:[12,41] 
                })}
              >
                <Popup>
                  <Stack gap={4}>
                    <div>{new Date(c.caught_at).toLocaleString('ru-RU')}</div>
                    <div>{fishKinds.find(f => f.id === c.fish_kind_id)?.name || '—'}</div>
                    {(c as any).dict_baits ? (
                      <div>{getBaitLabel(c)}</div>
                    ) : (c.bait_name && <div>{c.bait_name}</div>)}
                    {(c.weight_g || c.length_cm) && (
                      <div>
                        {c.weight_g ? `${(c.weight_g/1000).toFixed(2)} kg` : ''}
                        {c.length_cm ? ` • ${c.length_cm} cm` : ''}
                      </div>
                    )}
                  </Stack>
                </Popup>
              </Marker>
            ))}
            
            {/* События */}
            {events.map((e: any) => (
              <Marker 
                key={e.id} 
                position={[e.lat, e.lng]} 
                icon={pinIcon()}
              >
                <Popup>
                  <Stack gap={4}>
                    <div>{new Date(e.at).toLocaleString('ru-RU')}</div>
                    <div>{pinLabel(e.kind)}</div>
                    <div style={{ color: 'gray', fontSize: '12px' }}>
                      Пользователь: {getUserName(e.user_id)}
                    </div>
                    {e.bait_id && (
                      <div style={{ color: 'gray', fontSize: '12px' }}>
                        Приманка: {getEventBaitName(e)}
                      </div>
                    )}
                    {e.notes && <div style={{ color: 'gray' }}>{e.notes}</div>}
                    {user?.id === e.user_id && (
                      <button 
                        onClick={() => onDeleteEvent(e.id)}
                        style={{ 
                          background: 'red', 
                          color: 'white', 
                          border: 'none', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Удалить
                      </button>
                    )}
                  </Stack>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Paper>
    </Stack>
  )
}
