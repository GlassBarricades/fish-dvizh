import { useState, useMemo, useEffect } from 'react'
import { Stack, Group, Card, Title, Text, Button, Select, NumberInput, Switch, Textarea, Badge, Modal, ActionIcon } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { MapClickHandler } from './MapClickHandler'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import type { TrainingTakenUserBait } from '../api'
import type { FishKind } from '../../dicts/fish/api'
import styles from './OnWaterPage.module.css'

interface OnWaterPageProps {
  takenBaits: TrainingTakenUserBait[]
  fishKinds: FishKind[]
  onQuickCatch: (data: QuickCatchData & { currentBait: TrainingTakenUserBait }) => Promise<void>
  onQuickEvent: (data: QuickEventData & { currentBait: TrainingTakenUserBait }) => Promise<void>
  training?: any
  onUpdateCurrentRig: (rig: { bait: TrainingTakenUserBait | null; weight: number }) => void
}

interface QuickCatchData {
  fish_kind_id?: string
  weight_g?: number
  length_cm?: number
  point?: { lat: number; lng: number } | null
  notes?: string
  released: boolean
}

interface QuickEventData {
  kind: 'strike' | 'lost' | 'snag'
  point?: { lat: number; lng: number } | null
  notes?: string
}

interface CurrentRig {
  bait: TrainingTakenUserBait | null
  weight: number
  notes: string
}

export function OnWaterPage({
  takenBaits,
  fishKinds,
  onQuickCatch,
  onQuickEvent,
  training,
  onUpdateCurrentRig
}: OnWaterPageProps) {
  const [currentRig, setCurrentRig] = useState<CurrentRig>(() => {
    // Загружаем сохраненную оснастку из localStorage (только вес и заметки)
    try {
      const saved = localStorage.getItem('current-rig')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          bait: null, // Будет установлено после загрузки takenBaits
          weight: parsed.weight || 0,
          notes: parsed.notes || ''
        }
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    return { bait: null, weight: 0, notes: '' }
  })
  
  // Восстанавливаем приманку из localStorage после загрузки takenBaits
  useEffect(() => {
    if (takenBaits && takenBaits.length > 0 && !currentRig.bait) {
      try {
        const saved = localStorage.getItem('current-rig')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.baitId) {
            const savedBait = takenBaits.find(tb => tb.user_bait_id === parsed.baitId)
            if (savedBait) {
              setCurrentRig(prev => ({ 
                ...prev, 
                bait: savedBait 
              }))
              // Уведомляем родительский компонент об изменении оснастки
              onUpdateCurrentRig({ bait: savedBait, weight: currentRig.weight })
            }
          }
        }
      } catch {
        // Игнорируем ошибки
      }
    }
  }, [takenBaits, currentRig.bait, currentRig.weight, onUpdateCurrentRig])

  const [quickCatchModalOpened, quickCatchHandlers] = useDisclosure(false)
  const [quickEventModalOpened, quickEventHandlers] = useDisclosure(false)
  const [eventKind, setEventKind] = useState<'strike' | 'lost' | 'snag' | null>(null)
  const [rigSettingsOpened, rigSettingsHandlers] = useDisclosure(false)
  
  // Состояние для быстрого добавления
  const [fishKindId, setFishKindId] = useState<string | undefined>(undefined)
  const [weightG, setWeightG] = useState<number | undefined>(undefined)
  const [lengthCm, setLengthCm] = useState<number | undefined>(undefined)
  const [released, setReleased] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [point, setPoint] = useState<L.LatLng | null>(null)
  
  const mapCenter = useMemo(() => {
    if (training?.lat && training?.lng) {
      return [training.lat, training.lng] as [number, number]
    }
    return [53.9, 27.5667] as [number, number]
  }, [training])

  const baitOptions = takenBaits.map(tb => ({
    value: tb.user_bait_id,
    label: `${tb.brand ?? ''} ${tb.name ?? ''}${tb.color ? ' ' + tb.color : ''}${tb.size ? ' ' + tb.size : ''}`.trim()
  }))

  const handleSetRig = (baitId: string | null, weight: number) => {
    const bait = baitId ? takenBaits.find(tb => tb.user_bait_id === baitId) || null : null
    const newRig = { bait, weight, notes: currentRig.notes }
    setCurrentRig(newRig)
    
    // Уведомляем родительский компонент об изменении оснастки
    onUpdateCurrentRig({ bait, weight })
    
    // Сохраняем в localStorage
    try {
      localStorage.setItem('current-rig', JSON.stringify({
        baitId: baitId,
        weight,
        notes: currentRig.notes
      }))
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  const handleQuickCatch = () => {
    if (!currentRig.bait) {
      notifications.show({ color: 'red', message: 'Сначала выберите приманку для оснастки' })
      return
    }
    quickCatchHandlers.open()
  }

  const handleQuickEvent = (kind: 'strike' | 'lost' | 'snag') => {
    if (!currentRig.bait) {
      notifications.show({ color: 'red', message: 'Сначала выберите приманку для оснастки' })
      return
    }
    setEventKind(kind)
    quickEventHandlers.open()
  }

  const handleSubmitCatch = async () => {
    if (!currentRig.bait) return
    
    try {
      await onQuickCatch({
        fish_kind_id: fishKindId,
        weight_g: weightG,
        length_cm: lengthCm,
        point: point ? { lat: point.lat, lng: point.lng } : null,
        notes: notes.trim() || undefined,
        released,
        currentBait: currentRig.bait
      })
      
      // Сброс формы
      setFishKindId(undefined)
      setWeightG(undefined)
      setLengthCm(undefined)
      setReleased(false)
      setNotes('')
      setPoint(null)
      quickCatchHandlers.close()
    } catch (error) {
      // Ошибка будет обработана в родительском компоненте
    }
  }

  const handleSubmitEvent = async () => {
    if (!currentRig.bait || !eventKind) return
    
    try {
      await onQuickEvent({
        kind: eventKind,
        point: point ? { lat: point.lat, lng: point.lng } : null,
        notes: notes.trim() || undefined,
        currentBait: currentRig.bait
      })
      
      // Сброс формы
      setEventKind(null)
      setNotes('')
      setPoint(null)
      quickEventHandlers.close()
    } catch (error) {
      // Ошибка будет обработана в родительском компоненте
    }
  }

  const getEventLabel = (kind: string) => {
    switch (kind) {
      case 'strike': return 'Поклёвка'
      case 'lost': return 'Сход'
      case 'snag': return 'Зацеп'
      default: return kind
    }
  }



  return (
    <Stack gap="md" className={styles.onWaterContainer}>
      {/* Текущая оснастка - компактно */}
      <Card withBorder p="md" className={styles.rigCard}>
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={5}>Текущая оснастка</Title>
            {currentRig.bait ? (
              <Group gap="xs">
                <Badge color="blue" variant="filled" size="sm">
                  {currentRig.bait.brand || 'Без бренда'}
                </Badge>
                <Badge color="green" variant="filled" size="sm">
                  {currentRig.bait.name || 'Без названия'}
                </Badge>
                {currentRig.bait.color && (
                  <Badge color="orange" variant="filled" size="sm">
                    {currentRig.bait.color}
                  </Badge>
                )}
                {currentRig.bait.size && (
                  <Badge color="purple" variant="filled" size="sm">
                    {currentRig.bait.size}
                  </Badge>
                )}
                {currentRig.weight > 0 && (
                  <Badge color="red" variant="filled" size="sm">
                    Груз: {currentRig.weight}г
                  </Badge>
                )}
              </Group>
            ) : (
              <Text size="sm" c="dimmed">Приманка не выбрана</Text>
            )}
          </Stack>
          <ActionIcon 
            variant="light" 
            size="lg" 
            onClick={rigSettingsHandlers.open}
            color="blue"
          >
            <IconSettings size={20} />
          </ActionIcon>
        </Group>
      </Card>

      {/* Быстрые действия - большие кнопки для телефона */}
      <Card withBorder p="md" className={styles.actionCard}>
        <Title order={5} mb="md">Быстрые действия</Title>
        <Stack gap="md">
          {/* Основная кнопка поимки */}
          <Button
            color="green"
            size="xl"
            onClick={handleQuickCatch}
            disabled={!currentRig.bait}
            className={styles.mainCatchButton}
          >
            🎣 ПОИМКА
          </Button>
          
          {/* Кнопки событий */}
          <Group grow>
            <Button
              color="blue"
              variant="filled"
              size="lg"
              onClick={() => handleQuickEvent('strike')}
              disabled={!currentRig.bait}
              className={styles.eventButton}
            >
              ⚡ Поклёвка
            </Button>
            <Button
              color="red"
              variant="filled"
              size="lg"
              onClick={() => handleQuickEvent('lost')}
              disabled={!currentRig.bait}
              className={styles.eventButton}
            >
              💨 Сход
            </Button>
          </Group>
          
          <Button
            color="orange"
            variant="filled"
            size="lg"
            onClick={() => handleQuickEvent('snag')}
            disabled={!currentRig.bait}
            className={styles.eventButton}
          >
            🌿 Зацеп
          </Button>
        </Stack>
      </Card>

      {/* Быстрая смена оснастки */}
      <Card withBorder p="md" className={styles.actionCard}>
        <Title order={5} mb="md">Быстрая смена</Title>
        <Group grow>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (!currentRig.bait) return
              const currentIndex = takenBaits.findIndex(tb => tb.user_bait_id === currentRig.bait?.user_bait_id)
              const nextIndex = (currentIndex + 1) % takenBaits.length
              const nextBait = takenBaits[nextIndex]
              handleSetRig(nextBait.user_bait_id, currentRig.weight)
              notifications.show({ 
                color: 'blue', 
                message: `Переключились на: ${nextBait.brand || ''} ${nextBait.name || ''}`.trim() 
              })
            }}
            disabled={!currentRig.bait || takenBaits.length <= 1}
            className={styles.switchButton}
          >
            🔄 Следующая
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (!currentRig.bait) return
              const currentIndex = takenBaits.findIndex(tb => tb.user_bait_id === currentRig.bait?.user_bait_id)
              const prevIndex = currentIndex === 0 ? takenBaits.length - 1 : currentIndex - 1
              const prevBait = takenBaits[prevIndex]
              handleSetRig(prevBait.user_bait_id, currentRig.weight)
              notifications.show({ 
                color: 'blue', 
                message: `Переключились на: ${prevBait.brand || ''} ${prevBait.name || ''}`.trim() 
              })
            }}
            disabled={!currentRig.bait || takenBaits.length <= 1}
            className={styles.switchButton}
          >
            ⬅️ Предыдущая
          </Button>
        </Group>
      </Card>

      {/* Модальное окно настроек оснастки */}
      <Modal
        opened={rigSettingsOpened}
        onClose={rigSettingsHandlers.close}
        title="Настройка оснастки"
        size="lg"
      >
        <Stack gap="md">
          <Group grow>
            <Select
              label="Приманка"
              placeholder="Выберите приманку"
              data={baitOptions}
              value={currentRig.bait?.user_bait_id || null}
              onChange={(value) => handleSetRig(value, currentRig.weight)}
              searchable
              clearable
            />
            <NumberInput
              label="Вес груза (г)"
              placeholder="0"
              value={currentRig.weight}
                             onChange={(value) => handleSetRig(currentRig.bait?.user_bait_id || null, typeof value === 'number' ? value : 0)}
              min={0}
            />
          </Group>
          
          <Textarea 
            label="Заметки по оснастке" 
            value={currentRig.notes} 
            onChange={(e) => {
              const newNotes = e.currentTarget.value
              setCurrentRig(prev => ({ ...prev, notes: newNotes }))
              onUpdateCurrentRig({ bait: currentRig.bait, weight: currentRig.weight })
              try {
                localStorage.setItem('current-rig', JSON.stringify({
                  baitId: currentRig.bait?.user_bait_id || null,
                  weight: currentRig.weight,
                  notes: newNotes
                }))
              } catch {}
            }}
            minRows={2} 
            placeholder="Заметки по настройке оснастки, техники ловли и т.д."
          />
          
          <Group justify="space-between">
            <Button variant="outline" onClick={rigSettingsHandlers.close}>
              Закрыть
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно быстрой поимки */}
      <Modal
        opened={quickCatchModalOpened}
        onClose={quickCatchHandlers.close}
        title="Быстрая поимка"
        size="lg"
      >
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
            <NumberInput
              label="Вес (граммы)"
              placeholder="0"
              value={weightG}
                             onChange={(v) => setWeightG(typeof v === 'number' ? v : undefined)}
              min={0}
            />
          </Group>
          
          <Group grow>
            <NumberInput
              label="Длина (см)"
              placeholder="0"
              value={lengthCm}
                             onChange={(v) => setLengthCm(typeof v === 'number' ? v : undefined)}
              min={0}
            />
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
            <Button variant="outline" onClick={quickCatchHandlers.close}>
              Отмена
            </Button>
            <Button onClick={handleSubmitCatch}>
              Добавить поимку
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно быстрого события */}
      <Modal
        opened={quickEventModalOpened}
        onClose={quickEventHandlers.close}
        title={`Быстрое событие: ${eventKind ? getEventLabel(eventKind) : ''}`}
        size="md"
      >
        <Stack gap="md">
          <Textarea 
            label="Заметка" 
            value={notes} 
            onChange={(e) => setNotes(e.currentTarget.value)} 
            minRows={2} 
            placeholder="Опишите событие"
          />
          
          <Stack>
            <div style={{ fontSize: '14px', color: 'gray' }}>
              Клик — поставить точку события. Двойной клик — очистить.
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
            <Button variant="outline" onClick={quickEventHandlers.close}>
              Отмена
            </Button>
            <Button onClick={handleSubmitEvent}>
              Добавить событие
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
