import { useState, useEffect } from 'react'
import { Modal, Stack, Group, Select, Textarea, Button } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { MapClickHandler } from './MapClickHandler'
import { FlyToPosition } from './FlyToPosition'
import { useGeolocation } from '../hooks/useGeolocation'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useParams } from 'react-router-dom'
import { useTrainingTakenUserBaits } from '../hooks'
import { useAuth } from '../../auth/hooks'

interface AddEventForm {
  kind: 'strike' | 'lost' | 'snag'
  bait_id?: string
  notes?: string
  at: string
  point?: { lat: number; lng: number } | null
}

interface AddEventModalProps {
  opened: boolean
  onClose: () => void
  onSubmit: (data: AddEventForm) => Promise<void>
  eventKind: 'strike' | 'lost' | 'snag'
  training?: any
}

export function AddEventModal({
  opened,
  onClose,
  onSubmit,
  eventKind,
  training
}: AddEventModalProps) {
  const { user } = useAuth()
  const { trainingId } = useParams<{ trainingId: string }>()
  const { data: takenBaitsInner } = useTrainingTakenUserBaits(trainingId, user?.id)
  
  const [baitId, setBaitId] = useState<string | undefined>(undefined)
  const [eventAt, setEventAt] = useState<Date | null>(new Date())
  const [notes, setNotes] = useState<string>('')
  const [point, setPoint] = useState<L.LatLng | null>(null)
  const { coords: userCoords } = useGeolocation()

  const takenOptions = (takenBaitsInner ?? []).map((tb: any) => ({ 
    id: tb.user_bait_id, 
    label: `${tb.brand ?? ''} ${tb.name ?? ''}${tb.color ? ' ' + tb.color : ''}${tb.size ? ' ' + tb.size : ''}`.trim(), 
    dict_bait_id: tb.dict_bait_id 
  }))

  // Вычисляем центр карты на основе тренировки
  const mapCenter = (() => {
    // Если есть точка тренировки, центрируем на ней
    if (training?.lat && training?.lng) {
      return [training.lat, training.lng] as [number, number]
    }
    if (userCoords) {
      return [userCoords.lat, userCoords.lng] as [number, number]
    }
    
    // Дефолтный центр
    return [53.9, 27.5667] as [number, number]
  })()

  // Сбрасываем состояние при открытии модального окна
  useEffect(() => {
    if (opened) {
      setBaitId(undefined)
      setEventAt(new Date())
      setNotes('')
      if (userCoords) setPoint(new L.LatLng(userCoords.lat, userCoords.lng))
      else setPoint(null)
    }
  }, [opened, userCoords])

  const handleSubmit = () => {
    const submitData = {
      kind: eventKind,
      bait_id: baitId,
      notes: notes.trim() || undefined,
      at: eventAt ? eventAt.toISOString() : new Date().toISOString(),
      point: point ? { lat: point.lat, lng: point.lng } : null,
    }
    
    onSubmit(submitData)
  }

  const getEventTitle = () => {
    switch (eventKind) {
      case 'strike': return 'Добавить поклёвку'
      case 'lost': return 'Добавить сход'
      case 'snag': return 'Добавить зацеп'
      default: return 'Добавить событие'
    }
  }

  const getEventLabel = () => {
    switch (eventKind) {
      case 'strike': return 'Поклёвка'
      case 'lost': return 'Сход'
      case 'snag': return 'Зацеп'
      default: return 'Событие'
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={getEventTitle()} size="lg">
      <Stack gap="md">
        <Group grow>
          <DateTimePicker 
            label="Время события" 
            value={eventAt as any} 
            onChange={(v) => setEventAt(v as unknown as Date | null)} 
            required 
            popoverProps={{ withinPortal: true }} 
          />
        </Group>
        
        <Select
          label="Приманка"
          placeholder={takenBaitsInner && takenBaitsInner.length > 0 ? 'Выберите приманку' : 'Сначала добавьте свои приманки'}
          data={takenOptions.map((o: any) => ({ value: o.id, label: o.label }))}
          value={baitId || ''}
          onChange={(v) => setBaitId(v || undefined)}
          searchable
          clearable
          disabled={!takenBaitsInner || takenBaitsInner.length === 0}
          comboboxProps={{ withinPortal: true }}
        />
        
        <Textarea 
          label="Заметка" 
          value={notes} 
          onChange={(e) => setNotes(e.currentTarget.value)} 
          minRows={2} 
          placeholder={`Опишите детали ${getEventLabel().toLowerCase()}`}
        />
        
        <Stack>
          <div style={{ fontSize: '14px', color: 'gray' }}>
            Клик — поставить точку события. Двойной клик — очистить.
          </div>
          <div style={{ height: 260 }}>
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {userCoords && <FlyToPosition lat={userCoords.lat} lng={userCoords.lng} zoom={17} />}
              <MapClickHandler setPoint={setPoint} />
              {point && (
                <Marker 
                  position={point} 
                  icon={new L.Icon({ 
                    iconUrl, 
                    shadowUrl: iconShadowUrl, 
                    iconSize: [25,41], 
                    iconAnchor:[12,41] 
                  })} 
                />
              )}
            </MapContainer>
          </div>
        </Stack>
        
        <Group justify="space-between">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
