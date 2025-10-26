import { Button, Container, Group, Paper, Stack, Text, Drawer, Title, Tabs, SegmentedControl } from '@mantine/core'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L, { type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useMemo } from 'react'
import { modals } from '@mantine/modals'
import { CreateCompetitionModal } from '@/features/competitions/CreateCompetitionModal'
import { EditCompetitionModal } from '@/features/competitions/EditCompetitionModal'
import { useCompetitions, useDeleteCompetition } from '@/features/competitions/hooks'
import { useCompetitionFormats } from '@/features/dicts/formats/hooks'
import { useTeamSizes } from '@/features/dicts/teamSizes/hooks'
import { useAuth } from '@/features/auth/hooks'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { type Competition } from '@/features/competitions/types'
import { TeamsTab } from '@/features/teams/TeamsTab'
import { useCompetitionFishKinds } from '@/features/competitions/hooks'
import { useFishKinds } from '@/features/dicts/fish/hooks'
import { ScheduleTab } from '@/features/schedule/ScheduleTab'
import { Link } from 'react-router-dom'

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

function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng)
    },
  })
  return null
}

export default function MapPage() {
  const { data: competitions } = useCompetitions()
  const { data: formats } = useCompetitionFormats()
  const { mutateAsync: deleteCompetition } = useDeleteCompetition()
  const { user, role } = useAuth()
  const { data: teamSizes } = useTeamSizes()
  
  // Проверка, может ли пользователь создавать соревнования
  const canCreateCompetition = role === 'admin' || role === 'organizer'
  
  // Фильтр по статусу соревнований
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  
  // Фильтрация соревнований
  const filteredCompetitions = useMemo(() => {
    if (!competitions) return []
    
    const now = new Date().getTime()
    
    switch (filter) {
      case 'upcoming':
        return competitions.filter(c => new Date(c.starts_at).getTime() > now)
      case 'past':
        return competitions.filter(c => new Date(c.starts_at).getTime() <= now)
      case 'all':
      default:
        return competitions
    }
  }, [competitions, filter])
  
  const [tempMarker, setTempMarker] = useState<L.LatLng | null>(null)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [editDrawerOpened, { open: openEditDrawer, close: closeEditDrawer }] = useDisclosure(false)
  const [viewingCompetition, setViewingCompetition] = useState<Competition | null>(null)
  const [viewDrawerOpened, { open: openViewDrawer, close: closeViewDrawer }] = useDisclosure(false)

  const openEditModal = (competition: Competition) => {
    setEditingCompetition(competition)
    openEditDrawer()
  }

  const openViewModal = (competition: Competition) => {
    setViewingCompetition(competition)
    openViewDrawer()
  }

  const handleCloseEditDrawer = () => {
    closeEditDrawer()
    setEditingCompetition(null)
  }

  const handleCloseViewDrawer = () => {
    closeViewDrawer()
    setViewingCompetition(null)
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
      <Stack gap="md">
        {/* Фильтр */}
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="sm" fw={500}>Фильтр соревнований:</Text>
            <SegmentedControl
              value={filter}
              onChange={(value) => setFilter(value as 'upcoming' | 'past' | 'all')}
              data={[
                { label: 'Предстоящие', value: 'upcoming' },
                { label: 'Прошедшие', value: 'past' },
                { label: 'Все', value: 'all' },
              ]}
            />
            <Text size="xs" c="dimmed">
              Найдено: {filteredCompetitions.length}
            </Text>
          </Group>
        </Paper>

        {/* Карта */}
        <Paper withBorder radius="md" p="sm" style={{ position: 'relative' }}>
          {!canCreateCompetition && (
            <Text size="sm" c="dimmed" mb="sm" ta="center">
              Для создания соревнований требуется роль организатора или администратора
            </Text>
          )}
          <MapContainer center={MINSK} zoom={12} style={{ height: 700, width: '100%', zIndex: 1 }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredCompetitions?.map((c) => (
            <Marker 
              key={c.id} 
              position={[c.lat, c.lng]}
              eventHandlers={{
                click: () => openViewModal(c)
              }}
            />
          ))}
          {tempMarker && (
            <Marker position={tempMarker as unknown as LatLngExpression} />
          )}
          {canCreateCompetition && (
            <MapClickHandler onClick={(latlng) => { setTempMarker(latlng); openDrawer() }} />
          )}
        </MapContainer>
      </Paper>
      <Drawer
        opened={drawerOpened}
        onClose={() => { closeDrawer(); setTempMarker(null) }}
        position="right"
        size={420}
        title="Новое соревнование"
        withinPortal
      >
        {tempMarker && (
          <CreateCompetitionModal
            lat={tempMarker.lat}
            lng={tempMarker.lng}
            onClose={() => { closeDrawer(); setTempMarker(null) }}
          />
        )}
      </Drawer>
      <Drawer
        opened={editDrawerOpened}
        onClose={handleCloseEditDrawer}
        title="Редактировать соревнование"
        position="right"
        size={420}
        padding="md"
        withinPortal
      >
        {editingCompetition && (
          <EditCompetitionModal
            id={editingCompetition.id}
            title={editingCompetition.title}
            description={editingCompetition.description || ''}
            starts_at={editingCompetition.starts_at}
            lat={editingCompetition.lat}
            lng={editingCompetition.lng}
            format_id={editingCompetition.format_id}
            team_size_id={editingCompetition.team_size_id}
            max_slots={editingCompetition.max_slots}
            onClose={handleCloseEditDrawer}
          />
        )}
      </Drawer>
      <Drawer
            opened={viewDrawerOpened}
            onClose={handleCloseViewDrawer}
            title="Информация о соревновании"
            position="right"
            size={420}
            padding="md"
            withinPortal
          >
            {viewingCompetition && (
              <Tabs defaultValue="info">
                <Tabs.List>
                  <Tabs.Tab value="info">Информация</Tabs.Tab>
                  <Tabs.Tab value="teams">{(teamSizes?.find(s => s.id === viewingCompetition.team_size_id)?.size === 1) ? 'Участники' : 'Команды'}</Tabs.Tab>
                  <Tabs.Tab value="schedule">Расписание</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="info" pt="md">
                  <Stack gap="md">
                    <Title order={3}>{viewingCompetition.title}</Title>
                    <Text size="sm">
                      <strong>Дата:</strong> {new Date(viewingCompetition.starts_at).toLocaleString('ru-RU')}
                    </Text>
                    {viewingCompetition.description && (
                      <Text size="sm">
                        <strong>Описание:</strong> {viewingCompetition.description}
                      </Text>
                    )}
                    {viewingCompetition.format_id && (
                      <Text size="sm">
                        <strong>Формат:</strong> {formats?.find(f => f.id === viewingCompetition.format_id)?.name || viewingCompetition.format_id}
                      </Text>
                    )}
                    {viewingCompetition.team_size_id && (
                      <Text size="sm">
                        <strong>Размер команды:</strong> {teamSizes?.find(s => s.id === viewingCompetition.team_size_id)?.name || viewingCompetition.team_size_id}
                      </Text>
                    )}
                    {/* Целевые виды рыбы */}
                    <CompetitionFishKindsInfo competitionId={viewingCompetition.id} />
                    <Text size="sm">
                      <strong>Координаты:</strong> {viewingCompetition.lat.toFixed(6)}, {viewingCompetition.lng.toFixed(6)}
                    </Text>
                    <Group gap="xs" mt="md">
                      <Button size="sm" variant="filled" component={Link} to={`/competition/${viewingCompetition.id}`}>
                        Открыть страницу соревнования
                      </Button>
                      {canCreateCompetition && (
                        <>
                          <Button size="sm" variant="light" onClick={() => {
                            handleCloseViewDrawer()
                            openEditModal(viewingCompetition)
                          }}>
                            Редактировать
                          </Button>
                          <Button size="sm" variant="light" color="red" onClick={() => {
                            handleCloseViewDrawer()
                            openDeleteConfirm(viewingCompetition)
                          }}>
                            Удалить
                          </Button>
                        </>
                      )}
                    </Group>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="teams" pt="md">
                  <TeamsTab competitionId={viewingCompetition.id} userId={user?.id} />
                </Tabs.Panel>
                <Tabs.Panel value="schedule" pt="md">
                  <ScheduleTab competitionId={viewingCompetition.id} />
                </Tabs.Panel>
              </Tabs>
            )}
          </Drawer>
      </Stack>
    </Container>
  )
}

function CompetitionFishKindsInfo({ competitionId }: { competitionId: string }) {
  const { data: fishKindIds } = useCompetitionFishKinds(competitionId)
  const { data: fishKinds } = useFishKinds()
  if (!fishKindIds || fishKindIds.length === 0) return null
  const names = fishKindIds
    .map((id) => fishKinds?.find((f) => f.id === id)?.name || '')
    .filter((n) => n)
  if (names.length === 0) return null
  return (
    <Text size="sm">
      <strong>Целевая рыба:</strong> {names.join(', ')}
    </Text>
  )
}


