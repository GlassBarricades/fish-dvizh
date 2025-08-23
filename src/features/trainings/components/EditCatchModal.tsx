import { useState, useEffect } from 'react'
import { Modal, Stack, Group, Select, NumberInput, Switch, Textarea, Button } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { MapClickHandler } from './MapClickHandler'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useParams } from 'react-router-dom'
import { useTrainingTakenUserBaits } from '../hooks'
import { useAuth } from '../../auth/hooks'
// import { useTrainingContext } from '../context/TrainingContext' // Пока не используется
import type { TrainingCatch } from '../api'

interface EditCatchForm {
  fish_kind_id?: string
  bait_name?: string
  bait_id?: string
  weight_g?: number
  length_cm?: number
  caught_at: string
  released: boolean
  notes?: string
  point?: { lat: number; lng: number } | null
}

interface EditCatchModalProps {
  opened: boolean
  onClose: () => void
  onSubmit: (data: EditCatchForm) => Promise<void>
  catch_: TrainingCatch
  training?: any
  fishKinds: any[]
}

export function EditCatchModal({
  opened,
  onClose,
  onSubmit,
  catch_,
  training,
  fishKinds
}: EditCatchModalProps) {
  const { user } = useAuth()
  const { trainingId } = useParams<{ trainingId: string }>()
  const { data: takenBaitsInner } = useTrainingTakenUserBaits(trainingId, user?.id)
  // const { state } = useTrainingContext() // Пока не используется
  
  const [fishKindId, setFishKindId] = useState<string | undefined>(undefined)
  const [baitId, setBaitId] = useState<string | undefined>(undefined)
  const [weightG, setWeightG] = useState<number | undefined>(undefined)
  const [lengthCm, setLengthCm] = useState<number | undefined>(undefined)
  const [caughtAt, setCaughtAt] = useState<Date | null>(null)
  const [released, setReleased] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [point, setPoint] = useState<L.LatLng | null>(null)

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
    
    // Дефолтный центр
    return [53.9, 27.5667] as [number, number]
  })()

  // Инициализируем состояние при открытии модального окна
  useEffect(() => {
    if (opened && catch_) {
      setFishKindId(catch_.fish_kind_id || undefined)
      
      // Находим user_bait_id по dict_bait_id из поимки
      if (catch_.bait_id) {
        const foundBait = (takenBaitsInner || []).find(tb => tb.dict_bait_id === catch_.bait_id)
        setBaitId(foundBait?.user_bait_id || undefined)
      } else {
        setBaitId(undefined)
      }
      
      setWeightG(catch_.weight_g || undefined)
      setLengthCm(catch_.length_cm || undefined)
      setCaughtAt(new Date(catch_.caught_at))
      setReleased(catch_.released || false)
      setNotes(catch_.notes || '')
      setPoint(catch_.lat && catch_.lng ? L.latLng(catch_.lat, catch_.lng) : null)
    }
  }, [opened, catch_, takenBaitsInner])

  const handleSubmit = () => {
    const submitData = {
      fish_kind_id: fishKindId,
      bait_name: baitId ? undefined : undefined, // Будет заполнено в handleEditCatch
      bait_id: baitId,
      weight_g: weightG,
      length_cm: lengthCm,
      caught_at: caughtAt ? caughtAt.toISOString() : new Date().toISOString(),
      released,
      notes: notes.trim() || undefined,
      point: point ? { lat: point.lat, lng: point.lng } : null,
    }
    
    onSubmit(submitData)
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Редактировать поимку" size="lg">
      <Stack gap="md">
        <Group grow>
          <Select
            label="Вид рыбы"
            placeholder="Выберите вид рыбы"
            data={fishKinds.map((f) => ({ value: f.id, label: f.name }))}
            value={fishKindId}
            onChange={(v) => setFishKindId(v || undefined)}
            searchable
            clearable
          />
          <DateTimePicker 
            label="Время поимки" 
            value={caughtAt as any} 
            onChange={(v) => setCaughtAt(v as unknown as Date | null)} 
            required 
            popoverProps={{ withinPortal: true }} 
          />
        </Group>
        
        <Group grow>
          <NumberInput
            label="Вес (граммы)"
            placeholder="0"
            value={weightG}
                         onChange={(v) => setWeightG(typeof v === 'number' ? v : undefined)}
            min={0}
          />
          <NumberInput
            label="Длина (см)"
            placeholder="0"
            value={lengthCm}
                         onChange={(v) => setLengthCm(typeof v === 'number' ? v : undefined)}
            min={0}
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
        
        <Group>
          <Switch
            label="Рыба отпущена"
            checked={released}
            onChange={(e) => setReleased(e.currentTarget.checked)}
          />
        </Group>
        
        <Textarea 
          label="Заметка" 
          value={notes} 
          onChange={(e) => setNotes(e.currentTarget.value)} 
          minRows={2} 
          placeholder="Опишите детали поимки"
        />
        
        <Stack>
          <div style={{ fontSize: '14px', color: 'gray' }}>
            Клик — поставить точку поимки. Двойной клик — очистить.
          </div>
          <div style={{ height: 260 }}>
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
