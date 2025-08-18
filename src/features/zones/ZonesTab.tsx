import { Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core'
import { MapContainer, TileLayer, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { useCreateZone, useZones, useUpdateZone, useDeleteZone } from './hooks'
import { notifications } from '@mantine/notifications'

function DrawPolygon({ onComplete }: { onComplete: (latlngs: L.LatLngLiteral[]) => void }) {
  const [points, setPoints] = useState<L.LatLngLiteral[]>([])
  useMapEvents({
    click(e) {
      setPoints((prev) => [...prev, e.latlng])
    },
    dblclick() {
      if (points.length >= 3) onComplete(points)
      setPoints([])
    },
    contextmenu() {
      setPoints([])
    }
  })
  return points.length > 0 ? <Polygon positions={points as any} pathOptions={{ color: 'teal' }} /> : null
}

function InvalidateSizeOnLoad() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => {
      try { map.invalidateSize() } catch {}
    }, 100)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function FitBoundsOnZones({ zones, draft }: { zones?: any[]; draft: L.LatLngLiteral[] | null }) {
  const map = useMap()
  useEffect(() => {
    const points: L.LatLngExpression[] = []
    for (const z of zones ?? []) {
      const ring: [number, number][] = z?.polygon_geojson?.coordinates?.[0] || []
      for (const c of ring) {
        points.push([c[1], c[0]])
      }
    }
    if (draft && draft.length > 0) {
      for (const p of draft) points.push([p.lat, p.lng])
    }
    if (points.length > 0) {
      try {
        const b = L.latLngBounds(points as any)
        // небольшая задержка чтобы карта успела измериться
        setTimeout(() => map.fitBounds(b, { padding: [16, 16] }), 0)
      } catch {}
    }
  }, [map, zones, draft])
  return null
}

export function ZonesTab({ competitionId, canEdit, active }: { competitionId: string; canEdit: boolean; active?: boolean }) {
  const { data: zones } = useZones(competitionId)
  const { mutateAsync: createZone, isPending } = useCreateZone()
  const { mutateAsync: updateZone } = useUpdateZone()
  const { mutateAsync: deleteZone } = useDeleteZone()
  const [name, setName] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [draft, setDraft] = useState<L.LatLngLiteral[] | null>(null)
  const [invalidateTick, setInvalidateTick] = useState(0)
  const [editingName, setEditingName] = useState<Record<string, string>>({})
  const [repaintingZoneId, setRepaintingZoneId] = useState<string | null>(null)

  async function handleComplete(points: L.LatLngLiteral[]) {
    if (repaintingZoneId) {
      try {
        const polygonGeoJSON = { type: 'Polygon', coordinates: [points.map((p) => [p.lng, p.lat])] }
        await updateZone({ id: repaintingZoneId, input: { polygon_geojson: polygonGeoJSON }, competitionId })
        notifications.show({ color: 'green', message: 'Зона обновлена' })
      } catch (e: any) {
        notifications.show({ color: 'red', message: e?.message ?? 'Ошибка обновления зоны' })
      } finally {
        setRepaintingZoneId(null)
        setDrawing(false)
        setDraft(null)
      }
    } else {
      setDraft(points)
    }
  }

  async function handleSave() {
    if (!draft || name.trim() === '') return
    const polygonGeoJSON = {
      type: 'Polygon',
      coordinates: [draft.map((p) => [p.lng, p.lat])],
    }
    await createZone({ competition_id: competitionId, name: name.trim(), polygon_geojson: polygonGeoJSON })
    setDraft(null)
    setName('')
    setDrawing(false)
  }

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setInvalidateTick((x) => x + 1), 0)
      return () => clearTimeout(t)
    }
  }, [active])

  return (
    <Stack>
      <Paper p="md" withBorder>
        <Group align="end" justify="space-between">
          <Text fw={600}>Зоны</Text>
          {canEdit && (
            <Group align="end">
              <TextInput label="Название зоны" value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Зона A" />
              {!drawing ? (
                <Button onClick={() => setDrawing(true)}>Отметить на карте</Button>
              ) : (
                <Button variant="light" color="red" onClick={() => { setDrawing(false); setDraft(null) }}>Отмена</Button>
              )}
              <Button disabled={!draft || !name.trim()} loading={isPending} onClick={handleSave}>Сохранить зону</Button>
            </Group>
          )}
        </Group>
      </Paper>

      <Paper p="xs" withBorder>
        <MapContainer key={invalidateTick} center={[53.9, 27.5667]} zoom={12} style={{ height: 600, width: '100%' }} doubleClickZoom={false}>
          <InvalidateSizeOnLoad />
          <FitBoundsOnZones zones={zones as any} draft={draft} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {drawing && canEdit && <DrawPolygon onComplete={handleComplete} />}
          {draft && <Polygon positions={draft as any} pathOptions={{ color: 'orange', dashArray: '4 4' }} />}
          {(zones ?? []).map((z, idx) => {
            const palette = ['#2f9e44', '#1971c2', '#d9480f', '#a61e4d', '#0b7285', '#5f3dc4']
            const color = palette[idx % palette.length]
            const ring: [number, number][] = (z as any).polygon_geojson?.coordinates?.[0] || []
            const latlngs = ring.map((c) => [c[1], c[0]]) as any
            return (
              <Polygon key={z.id} positions={latlngs} pathOptions={{ color, fillColor: color, fillOpacity: 0.2 }}>
                <Tooltip permanent direction="center" opacity={0.9}>{(z as any).name}</Tooltip>
              </Polygon>
            )
          })}
        </MapContainer>
      </Paper>

      {(zones && zones.length > 0) && (
        <Stack>
          <Text fw={600}>Сохранённые зоны</Text>
          {zones.map((z, idx) => (
            <ZoneCard
              key={z.id}
              zone={z as any}
              name={editingName[z.id] ?? (z as any).name}
              onNameChange={(v) => setEditingName((s) => ({ ...s, [z.id]: v }))}
              onSaveName={async () => {
                const newName = (editingName[z.id] ?? z.name).trim()
                if (!newName || newName === z.name) return
                try {
                  await updateZone({ id: z.id, input: { name: newName }, competitionId })
                  notifications.show({ color: 'green', message: 'Название обновлено' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка обновления' })
                }
              }}
              onRepaint={() => { setRepaintingZoneId(z.id); setDrawing(true); setDraft(null) }}
              onDelete={async () => {
                try {
                  await deleteZone({ id: z.id, competitionId })
                  notifications.show({ color: 'green', message: 'Зона удалена' })
                } catch (e: any) {
                  notifications.show({ color: 'red', message: e?.message ?? 'Ошибка удаления' })
                }
              }}
              color={['#2f9e44', '#1971c2', '#d9480f', '#a61e4d', '#0b7285', '#5f3dc4'][idx % 6]}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function ZoneCard({ zone, name, onNameChange, onSaveName, onRepaint, onDelete, color }: {
  zone: any
  name: string
  onNameChange: (v: string) => void
  onSaveName: () => Promise<void> | void
  onRepaint: () => void
  onDelete: () => Promise<void> | void
  color: string
}) {
  const coords: [number, number][] = (zone.polygon_geojson?.coordinates?.[0] || [])
  const latlngs = coords.map((c) => [c[1], c[0]]) as any
  const center = getPolygonCenter(coords)
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between" align="end">
          <TextInput label="Название" value={name} onChange={(e) => onNameChange(e.currentTarget.value)} style={{ maxWidth: 320 }} />
          <Group>
            <Button variant="light" onClick={onSaveName}>Сохранить имя</Button>
            <Button variant="light" onClick={onRepaint}>Перерисовать</Button>
            <Button color="red" variant="outline" onClick={onDelete}>Удалить</Button>
          </Group>
        </Group>
        <div style={{ borderRadius: 8, overflow: 'hidden' }}>
          <MapContainer key={zone.id} center={[center[1], center[0]]} zoom={13} style={{ height: 220, width: '100%' }} scrollWheelZoom={false} doubleClickZoom={false} dragging={false} zoomControl={false} attributionControl={false}>
            <InvalidateSizeOnLoad />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {latlngs.length > 0 && <Polygon positions={latlngs} pathOptions={{ color, fillColor: color, fillOpacity: 0.2 }} />}
          </MapContainer>
        </div>
      </Stack>
    </Paper>
  )
}

function getPolygonCenter(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [27.5667, 53.9]
  let sumLng = 0
  let sumLat = 0
  for (const [lng, lat] of coords) { sumLng += lng; sumLat += lat }
  const n = coords.length
  return [sumLng / n, sumLat / n]
}


