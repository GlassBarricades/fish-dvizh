import { useState, useEffect } from 'react'
import { Modal, Stack, Group, Select, NumberInput, Switch, Textarea, Button } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useParams } from 'react-router-dom'
import { useFishKinds } from '../../dicts/fish/hooks'
import { useTrainingTakenUserBaits } from '../hooks'
import { useAuth } from '../../auth/hooks'
import { CatchClick } from './CatchClick'

interface AddCatchForm {
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

interface AddCatchModalProps {
  opened: boolean
  onClose: () => void
  onSubmit: (data: AddCatchForm) => Promise<void>
  initialBait?: string
  onOpenManageBaits: () => void
  training?: any
}

export function AddCatchModal({
  opened,
  onClose,
  onSubmit,
  initialBait,
  onOpenManageBaits,
  training
}: AddCatchModalProps) {
  const { data: fishKinds } = useFishKinds()
  const { user } = useAuth()
  const { trainingId } = useParams<{ trainingId: string }>()
  const { data: takenBaitsInner } = useTrainingTakenUserBaits(trainingId, user?.id)
  
  const [fishKind, setFishKind] = useState<string | undefined>(undefined)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [length, setLength] = useState<number | undefined>(undefined)
  const [baitId, setBaitId] = useState<string | undefined>(undefined)
  const [caughtAt, setCaughtAt] = useState<Date | null>(new Date())
  const [released, setReleased] = useState<boolean>(true)
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

  useEffect(() => {
    if (opened && initialBait && !baitId) {
      const found = takenOptions.find((o: any) => o.label.toLowerCase() === initialBait.toLowerCase())
      if (found) setBaitId(found.id)
    }
  }, [opened, initialBait, baitId, takenOptions])

  const handleSubmit = () => {
    onSubmit({
      fish_kind_id: fishKind,
      bait_id: baitId,
      bait_name: undefined,
      weight_g: weight,
      length_cm: length,
      caught_at: caughtAt ? caughtAt.toISOString() : new Date().toISOString(),
      released,
      notes: notes.trim() || undefined,
      point: point ? { lat: point.lat, lng: point.lng } : null,
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Добавить поимку" size="lg">
      <Stack gap="md">
        <Group grow>
          <Select 
            label="Вид рыбы" 
            placeholder="Выберите" 
            data={(fishKinds ?? []).map(f => ({ value: f.id, label: f.name }))} 
            value={fishKind} 
            onChange={(v) => setFishKind(v || undefined)} 
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
            label="Вес (г)" 
            value={weight} 
            onChange={(v) => setWeight(v as number | undefined)} 
            min={0} 
            step={10} 
          />
          <NumberInput 
            label="Длина (см)" 
            value={length} 
            onChange={(v) => setLength(v as number | undefined)} 
            min={0} 
            step={1} 
          />
        </Group>
        
        <Select
          label="Приманка"
          placeholder={takenBaitsInner && takenBaitsInner.length > 0 ? 'Выберите приманку' : 'Сначала добавьте свои приманки'}
          data={takenOptions.map((o: any) => ({ value: o.id, label: o.label }))}
          value={baitId}
          onChange={(v) => setBaitId(v || undefined)}
          searchable
          clearable={false}
          disabled={!takenBaitsInner || takenBaitsInner.length === 0}
          comboboxProps={{ withinPortal: true }}
        />
        
        <Switch 
          label="Отпущена" 
          checked={released} 
          onChange={(e) => setReleased(e.currentTarget.checked)} 
        />
        
        <Textarea 
          label="Заметка" 
          value={notes} 
          onChange={(e) => setNotes(e.currentTarget.value)} 
          minRows={2} 
        />
        
        <Stack>
          <div style={{ fontSize: '14px', color: 'gray' }}>
            Клик — поставить точку поимки. Двойной клик — очистить.
          </div>
          <div style={{ height: 260 }}>
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CatchClick setPoint={setPoint} />
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
          <Button variant="light" onClick={onOpenManageBaits}>
            Управлять моими приманками
          </Button>
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
