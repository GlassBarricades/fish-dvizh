import { Badge, Button, Container, Group, Paper, Stack, Text } from '@mantine/core'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L, { type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { modals } from '@mantine/modals'
import { CreateCompetitionModal } from '../features/competitions/CreateCompetitionModal'
import { EditCompetitionModal } from '../features/competitions/EditCompetitionModal'
import { useCompetitions, useDeleteCompetition } from '../features/competitions/hooks'
import { notifications } from '@mantine/notifications'

// Fix default marker icons path in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = new L.Icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = defaultIcon

const MINSK: LatLngExpression = [53.9, 27.5667]

function MapClickHandler() {
  const [tempMarker, setTempMarker] = useState<L.LatLng | null>(null)
  useMapEvents({
    click(e) {
      setTempMarker(e.latlng)
      modals.open({
        title: 'Новое соревнование',
        children: (
          <CreateCompetitionModal
            lat={e.latlng.lat}
            lng={e.latlng.lng}
            onClose={() => modals.closeAll()}
          />
        ),
        onClose: () => setTempMarker(null),
      })
    },
  })
  return tempMarker ? (
    <Marker position={tempMarker as unknown as LatLngExpression} />
  ) : null
}

export default function MapPage() {
  const { data: competitions } = useCompetitions()
  const { mutateAsync: deleteCompetition } = useDeleteCompetition()

  function openEditModal(c: any) {
    modals.open({
      title: 'Редактировать соревнование',
      children: (
        <EditCompetitionModal
          id={c.id}
          title={c.title}
          description={c.description}
          starts_at={c.starts_at}
          lat={c.lat}
          lng={c.lng}
          onClose={() => modals.closeAll()}
        />
      ),
    })
  }

  function openDeleteConfirm(c: any) {
    modals.openConfirmModal({
      title: 'Удалить соревнование?',
      children: (
        <Text size="sm">Действие необратимо. Соревнование «{c.title}» будет удалено.</Text>
      ),
      labels: { confirm: 'Удалить', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteCompetition(c.id)
          notifications.show({ color: 'green', message: 'Соревнование удалено' })
        } catch (e: any) {
          notifications.show({ color: 'red', message: e?.message ?? 'Ошибка удаления' })
        }
      },
    })
  }
  return (
    <Container fluid py="md">
      <Paper withBorder radius="md" p="sm" style={{ position: 'relative' }}>
        <MapContainer center={MINSK} zoom={12} style={{ height: 700, width: '100%', zIndex: 1 }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {competitions?.map((c) => (
            <Marker key={c.id} position={[c.lat, c.lng]}>
              <Popup>
                <Stack gap={6} style={{ minWidth: 240 }}>
                  <Text fw={600}>{c.title}</Text>
                  <Badge variant="light" w="fit-content">
                    {new Date(c.starts_at).toLocaleString()}
                  </Badge>
                  {c.description && (
                    <Text size="sm" c="dimmed" lineClamp={3}>
                      {c.description}
                    </Text>
                  )}
                  <Group gap="xs" mt="xs">
                    <Button size="xs" variant="light" onClick={() => openEditModal(c)}>
                      Редактировать
                    </Button>
                    <Button size="xs" color="red" variant="light" onClick={() => openDeleteConfirm(c)}>
                      Удалить
                    </Button>
                  </Group>
                </Stack>
              </Popup>
            </Marker>
          ))}
          <MapClickHandler />
        </MapContainer>
      </Paper>
    </Container>
  )
}


