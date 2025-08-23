import { useState, useEffect } from 'react'
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  Badge, 
  Group, 
  Stack, 
  Button, 
  Tabs, 
  Modal,
  TextInput,
  Textarea,
  Card,
  Select,
  MultiSelect
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
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
import { IconPlus, IconUserPlus, IconCrown, IconUsers } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useAuth } from '../features/auth/hooks'
import { useUserTeams, useCreateTeam, useDeleteTeam, useCreateTeamInvitation, useUserInvitations, useAcceptTeamInvitation, useTeamMembers } from '../features/teams/hooks'
import type { Team } from '../features/teams/types'
import { useNavigate } from 'react-router-dom'
import { useUserJudgeInvitations, useRespondJudgeInvitation } from '../features/judges/hooks'
import { useUserTrainings, useCreateTraining, useDeleteTraining, useUpdateTraining, useUserCatches, useCatchesByUsers } from '../features/trainings/hooks'
import { useBaits } from '../features/dicts/baits/hooks'
import { useUserBaits, useAddUserBaitFromDict, useAddCustomUserBait, useDeleteUserBait } from '../features/userBaits/hooks'
import { useFishKinds } from '../features/dicts/fish/hooks'

export default function ProfilePage() {
  const { user } = useAuth()
  const { data: trainings } = useUserTrainings(user?.id)
  const { data: userCatches } = useUserCatches(user?.id)
  const { mutateAsync: createTraining, isPending: isCreatingTraining } = useCreateTraining()
  const { mutateAsync: deleteTraining, isPending: isDeletingTraining } = useDeleteTraining()
  const { mutateAsync: updateTraining, isPending: isUpdatingTraining } = useUpdateTraining()
  const { data: userTeams, isLoading: teamsLoading } = useUserTeams(user?.id || '')
  const { data: userInvitations, isLoading: invitationsLoading } = useUserInvitations(user?.id || '')
  const { mutateAsync: deleteTeam } = useDeleteTeam()
  const { mutateAsync: createTeam, isPending: isCreating } = useCreateTeam()
  const { mutateAsync: createInvitation, isPending: isInviting } = useCreateTeamInvitation()
  const { mutateAsync: acceptInvitation } = useAcceptTeamInvitation()
  const { data: judgeInvites } = useUserJudgeInvitations(user?.id)
  const { mutateAsync: respondJudgeInvite } = useRespondJudgeInvitation()
  // User baits
  const { data: dictBaits } = useBaits()
  const { data: userBaits } = useUserBaits(user?.id)
  const { mutateAsync: addFromDict, isPending: isAddingFromDict } = useAddUserBaitFromDict()
  const { mutateAsync: addCustom, isPending: isAddingCustom } = useAddCustomUserBait()
  const { mutateAsync: removeUserBait } = useDeleteUserBait()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditTrainingModalOpen, setIsEditTrainingModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [editingTraining, setEditingTraining] = useState<any>(null)

  const navigate = useNavigate()

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Text ta="center" c="dimmed">
          Необходимо авторизоваться для просмотра профиля
        </Text>
      </Container>
    )
  }

  const handleCreateTeam = async (values: { name: string; description: string }) => {
    try {
      await createTeam({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        created_by: user.id,
      })
      notifications.show({ color: 'green', message: 'Команда создана' })
      setIsCreateModalOpen(false)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка создания команды' })
    }
  }

  const handleDeleteTeam = (team: Team) => {
    deleteTeam(team.id)
  }

  const handleInviteUser = async (values: { email: string }) => {
    if (!selectedTeam) return
    try {
      await createInvitation({
        team_id: selectedTeam.id,
        invited_user_email: values.email.trim(),
        invited_by: user.id,
        role: 'member',
      })
      notifications.show({ color: 'green', message: 'Приглашение отправлено' })
      setIsInviteModalOpen(false)
      setSelectedTeam(null)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка отправки приглашения' })
    }
  }

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    try {
      await acceptInvitation({ invitation_id: invitationId, accept })
      notifications.show({ 
        color: 'green', 
        message: accept ? 'Приглашение принято' : 'Приглашение отклонено' 
      })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка обработки приглашения' })
    }
  }

  const handleEditTraining = async (values: { title: string; description?: string; starts_at: string; ends_at?: string; lat?: number | null; lng?: number | null; area_points?: [number, number][] | null; target_fish_kinds?: string[] | null }) => {
    if (!editingTraining) return
    try {
      await updateTraining({
        id: editingTraining.id,
        input: {
          title: values.title,
          description: values.description || undefined,
          starts_at: values.starts_at,
          ends_at: values.ends_at || undefined,
          lat: values.lat ?? null,
          lng: values.lng ?? null,
          area_points: values.area_points ?? null,
          target_fish_kinds: values.target_fish_kinds ?? null,
        }
      })
      notifications.show({ color: 'green', message: 'Тренировка обновлена' })
      setIsEditTrainingModalOpen(false)
      setEditingTraining(null)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Не удалось обновить тренировку' })
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* User Info */}
        <Paper p="xl" withBorder>
          <Stack gap="md">
            <Title order={2}>Профиль пользователя</Title>
            <Group gap="md">
              <Badge variant="light" color="blue" size="lg">
                {user.user_metadata?.role || 'user'}
              </Badge>
              <Text size="lg">
                <strong>Email:</strong> {user.email}
              </Text>
              {user.user_metadata?.nickname && (
                <Text size="lg">
                  <strong>Никнейм:</strong> {user.user_metadata.nickname}
                </Text>
              )}
              {user.user_metadata?.phone && (
                <Text size="lg">
                  <strong>Телефон:</strong> {user.user_metadata.phone}
                </Text>
              )}
            </Group>
          </Stack>
        </Paper>

        {/* Teams Management */}
        <Paper p="xl" withBorder>
          <Tabs defaultValue="my-teams">
            <Tabs.List>
              <Tabs.Tab value="my-teams" leftSection={<IconUsers size={16} />}>
                Мои команды
              </Tabs.Tab>
              <Tabs.Tab value="invitations" leftSection={<IconUserPlus size={16} />}>
                Приглашения
              </Tabs.Tab>
              <Tabs.Tab value="trainings">Личные тренировки</Tabs.Tab>
              <Tabs.Tab value="baits">Мои приманки</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="my-teams" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>Мои команды</Title>
                  <Button 
                    leftSection={<IconPlus size={16} />} 
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Создать команду
                  </Button>
                </Group>

                {teamsLoading ? (
                  <Text>Загрузка команд...</Text>
                ) : userTeams && userTeams.length > 0 ? (
                  <Stack gap="md">
                    {userTeams.map((team) => (
                      <Paper key={team.id} p="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="xs" align="center">
                              <Title order={4}>{team.name}</Title>
                              <Badge variant="light" color="yellow" leftSection={<IconCrown size={12} />}>
                                {team.created_by === user.id ? 'Создатель' : 'Участник'}
                              </Badge>
                            </Group>
                            {team.description && (
                              <Text c="dimmed" size="sm">
                                {team.description}
                              </Text>
                            )}
                            <Text size="xs" c="dimmed">
                              Создана {new Date(team.created_at).toLocaleDateString('ru-RU')}
                            </Text>
                          </Stack>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconUserPlus size={14} />}
                              onClick={() => {
                                setSelectedTeam(team)
                                setIsInviteModalOpen(true)
                              }}
                            >
                              Пригласить
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              onClick={() => {
                                setSelectedTeam(team)
                                setIsDeleteModalOpen(true)
                              }}
                            >
                              Удалить
                            </Button>
                          </Group>
                        </Group>
                        <Button
                          variant="subtle"
                          size="xs"
                          mt="xs"
                          onClick={() => navigate(`/team/${team.id}`)}
                        >
                          Подробнее о команде
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    У вас пока нет команд. Создайте первую!
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="invitations" pt="md">
              <Stack gap="md">
                <Title order={3}>Приглашения в команды</Title>
                
                {invitationsLoading ? (
                  <Text>Загрузка приглашений...</Text>
                ) : userInvitations && userInvitations.length > 0 ? (
                  <Stack gap="md">
                    {userInvitations.map((invitation) => (
                      <Paper key={invitation.id} p="md" withBorder>
                        <Group justify="space-between" mb="xs">
                          <Stack gap="xs">
                            <Text fw={500}>
                              Приглашение в команду "{invitation.team_name || 'Неизвестная команда'}"
                            </Text>
                            {invitation.team_description && (
                              <Text size="sm" c="dimmed">
                                {invitation.team_description}
                              </Text>
                            )}
                            <Text size="sm" c="dimmed">
                              От: {invitation.invited_by_nickname || invitation.invited_by_email || 'Неизвестный пользователь'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Приглашение отправлено {new Date(invitation.created_at).toLocaleDateString('ru-RU')}
                            </Text>
                          </Stack>
                          <Group gap="xs">
                            <Button 
                              size="sm" 
                              variant="light" 
                              color="green"
                              onClick={() => handleInvitationResponse(invitation.id, true)}
                            >
                              Принять
                            </Button>
                            <Button 
                              size="sm" 
                              variant="light" 
                              color="red"
                              onClick={() => handleInvitationResponse(invitation.id, false)}
                            >
                              Отклонить
                            </Button>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    У вас нет активных приглашений
                  </Text>
                )}
                <Title order={3}>Приглашения судьи</Title>
                <Stack gap="md">
                  {(judgeInvites ?? []).length === 0 && (
                    <Text c="dimmed">Приглашений нет</Text>
                  )}
                  {(judgeInvites ?? []).map((inv) => (
                    <Paper key={inv.id} p="md" withBorder>
                      <Group justify="space-between">
                        <Stack gap={4}>
                          <Text>Турнир: {inv.competition_title || inv.competition_id}</Text>
                          <Text size="sm" c="dimmed">Статус: {inv.status}</Text>
                        </Stack>
                        {inv.status === 'pending' && (
                          <Group gap="xs">
                            <Button size="sm" color="green" variant="light" onClick={async () => {
                              await respondJudgeInvite({ invitation_id: inv.id, accept: true, userId: user.id })
                              notifications.show({ color: 'green', message: 'Вы приняли приглашение судьи' })
                            }}>Принять</Button>
                            <Button size="sm" color="red" variant="light" onClick={async () => {
                              await respondJudgeInvite({ invitation_id: inv.id, accept: false, userId: user.id })
                              notifications.show({ color: 'gray', message: 'Вы отклонили приглашение' })
                            }}>Отклонить</Button>
                          </Group>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="trainings" pt="md">
              <Stack gap="md">
                <Card withBorder>
                  <CreateSoloTrainingForm
                    onCreate={async (values) => {
                      if (!user) return
                      try {
                        await createTraining({
                          type: 'solo',
                          title: values.title,
                          description: values.description || undefined,
                          starts_at: values.starts_at,
                          ends_at: values.ends_at || undefined,
                          lat: values.lat ?? null,
                          lng: values.lng ?? null,
                          target_fish_kinds: values.target_fish_kinds || null,
                          user_id: user.id,
                          created_by: user.id,
                        })
                        notifications.show({ color: 'green', message: 'Тренировка создана' })
                      } catch (e: any) {
                        notifications.show({ color: 'red', message: e?.message ?? 'Не удалось создать тренировку' })
                      }
                    }}
                    isSubmitting={isCreatingTraining}
                  />
                </Card>

                {(trainings ?? []).length === 0 && (
                  <Text c="dimmed">Личных тренировок пока нет</Text>
                )}
                {(trainings ?? []).map((t) => (
                  <Card key={t.id} withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4}>
                        <Title order={5}>{t.title}</Title>
                        {t.description && <Text size="sm" c="dimmed">{t.description}</Text>}
                        <Text size="sm" c="dimmed">Начало: {new Date(t.starts_at).toLocaleString('ru-RU')}</Text>
                        {t.ends_at && <Text size="sm" c="dimmed">Окончание: {new Date(t.ends_at).toLocaleString('ru-RU')}</Text>}
                        {(t.lat && t.lng) && (
                          <Text size="sm" c="dimmed">Координаты: {t.lat?.toFixed(5)}, {t.lng?.toFixed(5)}</Text>
                        )}
                      </Stack>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => navigate(`/training/${t.id}`)}>Открыть</Button>
                        <Button size="xs" variant="light" color="blue" onClick={() => {
                          setEditingTraining(t)
                          setIsEditTrainingModalOpen(true)
                        }}>Редактировать</Button>
                        <Button color="red" variant="light" size="xs" onClick={async () => {
                          await deleteTraining(t.id)
                          notifications.show({ color: 'gray', message: 'Тренировка удалена' })
                        }} loading={isDeletingTraining}>Удалить</Button>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="baits" pt="md">
              <Stack gap="lg">
                <Card withBorder p="md">
                  <Title order={4} mb="xs">Добавить из справочника</Title>
                  <DictBaitSelect dictBaits={dictBaits || []} onAdd={async (dictId) => {
                    if (!user || !dictId) return
                    try { await addFromDict({ user_id: user.id, dict_bait_id: dictId }); notifications.show({ color: 'green', message: 'Добавлено' }) }
                    catch (e: any) { notifications.show({ color: 'red', message: e?.message ?? 'Ошибка добавления' }) }
                  }} loading={isAddingFromDict} />
                </Card>

                <Card withBorder p="md">
                  <Title order={4} mb="xs">Добавить кастомную</Title>
                  <CustomBaitForm onAdd={async (vals) => {
                    if (!user) return
                    try { await addCustom({ user_id: user.id, brand: vals.brand, name: vals.name, color: vals.color || null, size: vals.size || null }); notifications.show({ color: 'green', message: 'Добавлено' }) }
                    catch (e: any) { notifications.show({ color: 'red', message: e?.message ?? 'Ошибка добавления' }) }
                  }} loading={isAddingCustom} />
                </Card>

                <Card withBorder p="md">
                  <Title order={4} mb="xs">Ваши приманки</Title>
                  <UserBaitsSearchableList
                    baits={userBaits || []}
                    onDelete={async (id) => {
                      try { await removeUserBait({ id }); notifications.show({ color: 'gray', message: 'Удалено' }) }
                      catch (e: any) { notifications.show({ color: 'red', message: e?.message ?? 'Ошибка удаления' }) }
                    }}
                  />
                </Card>

                <Card withBorder p="md">
                  <Title order={4} mb="xs">Статистика поимок по приманкам</Title>
                  <BaitsStatsList catches={userCatches || []} />
                </Card>

                <Card withBorder p="md">
                  <Title order={4} mb="xs">Статистика по приманкам по членам команды</Title>
                  <TeamBaitsStats userTeams={userTeams || []} />
                </Card>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>

      {/* Create Team Modal */}
      <Modal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Новая команда">
        <CreateTeamForm onSubmit={handleCreateTeam} isSubmitting={isCreating} />
      </Modal>

      {/* Invite User Modal */}
      <Modal opened={isInviteModalOpen} onClose={() => {
        setIsInviteModalOpen(false)
        setSelectedTeam(null)
      }} title="Пригласить участника">
        {selectedTeam && (
          <InviteUserForm onSubmit={handleInviteUser} isSubmitting={isInviting} teamName={selectedTeam.name} />
        )}
      </Modal>

      {/* Delete Team Modal */}
      <Modal opened={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Удаление команды">
        {selectedTeam && (
          <Text>Вы уверены, что хотите удалить команду "{selectedTeam.name}"? Это действие необратимо.</Text>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Отмена</Button>
          <Button color="red" onClick={() => {
            if (selectedTeam) {
              handleDeleteTeam(selectedTeam)
              setIsDeleteModalOpen(false)
            }
          }}>Удалить</Button>
        </Group>
      </Modal>

      {/* Edit Training Modal */}
      <Modal 
        opened={isEditTrainingModalOpen} 
        onClose={() => {
          setIsEditTrainingModalOpen(false)
          setEditingTraining(null)
        }} 
        title="Редактировать тренировку"
        size="lg"
      >
        {editingTraining && (
          <EditSoloTrainingForm
            training={editingTraining}
            onEdit={handleEditTraining}
            isSubmitting={isUpdatingTraining}
          />
        )}
      </Modal>
    </Container>
  )
}

function DictBaitSelect({ dictBaits, onAdd, loading }: { dictBaits: any[]; onAdd: (dictId: string) => void | Promise<void>; loading?: boolean }) {
  const [dictId, setDictId] = useState<string | undefined>(undefined)
  return (
    <Group align="flex-end" gap="sm">
      <TextInput
        placeholder="Поиск по справочнику"
        value={''}
        onChange={() => {}}
        style={{ display: 'none' }}
      />
      <Select
        label="Приманка из справочника"
        placeholder="Выберите"
        searchable
        data={(dictBaits || []).map((b: any) => ({ value: b.id, label: `${b.brand ?? ''} ${b.name ?? ''}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}`.trim() }))}
        value={dictId}
        onChange={(v) => setDictId(v || undefined)}
        style={{ minWidth: 320 }}
      />
      <Button onClick={() => dictId && onAdd(dictId)} disabled={!dictId} loading={loading}>Добавить</Button>
    </Group>
  )
}

function CustomBaitForm({ onAdd, loading }: { onAdd: (vals: { brand: string; name: string; color?: string; size?: string }) => void | Promise<void>; loading?: boolean }) {
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  return (
    <Group align="flex-end" gap="sm">
      <TextInput label="Производитель" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.currentTarget.value)} required style={{ minWidth: 180 }} />
      <TextInput label="Название" placeholder="Model" value={name} onChange={(e) => setName(e.currentTarget.value)} required style={{ minWidth: 200 }} />
      <TextInput label="Цвет" placeholder="Color" value={color} onChange={(e) => setColor(e.currentTarget.value)} style={{ minWidth: 140 }} />
      <TextInput label="Размер" placeholder="Size" value={size} onChange={(e) => setSize(e.currentTarget.value)} style={{ minWidth: 120 }} />
      <Button onClick={() => onAdd({ brand: brand.trim(), name: name.trim(), color: color.trim() || undefined, size: size.trim() || undefined })} disabled={!brand.trim() || !name.trim()} loading={loading}>Добавить</Button>
    </Group>
  )
}

function UserBaitsSearchableList({ baits, onDelete }: { baits: any[]; onDelete: (id: string) => void | Promise<void> }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'brand' | 'name' | 'color' | 'size'>('brand')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = (baits || []).filter((b) => {
    if (!query.trim()) return true
    const text = `${b.brand ?? ''} ${b.name ?? ''} ${b.color ?? ''} ${b.size ?? ''}`.toLowerCase().trim()
    return text.includes(query.toLowerCase().trim())
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const va = (sortBy === 'brand' ? (a.brand || '') : sortBy === 'name' ? (a.name || '') : sortBy === 'color' ? (a.color || '') : (a.size || '')).toLowerCase()
    const vb = (sortBy === 'brand' ? (b.brand || '') : sortBy === 'name' ? (b.name || '') : sortBy === 'color' ? (b.color || '') : (b.size || '')).toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })

  return (
    <Stack gap="sm">
      <Group gap="sm" wrap="wrap">
        <TextInput label="Поиск" placeholder="Поиск (бренд, название, цвет, размер)" value={query} onChange={(e) => setQuery(e.currentTarget.value)} style={{ minWidth: 260 }} />
        <Select label="Сортировка" value={sortBy} onChange={(v) => setSortBy((v as any) || 'brand')} data={[
          { value: 'brand', label: 'Производитель' },
          { value: 'name', label: 'Название' },
          { value: 'color', label: 'Цвет' },
          { value: 'size', label: 'Размер' },
        ]} style={{ width: 220 }} />
        <Select label="Порядок" value={sortDir} onChange={(v) => setSortDir((v as any) || 'asc')} data={[
          { value: 'asc', label: 'По возрастанию' },
          { value: 'desc', label: 'По убыванию' },
        ]} style={{ width: 180 }} />
      </Group>
      <Stack gap={6}>
        {filtered.length === 0 && <Text c="dimmed">Ничего не найдено</Text>}
        {filtered.map((b: any) => (
          <Group key={b.id} justify="space-between">
            <Text>{`${b.brand ?? ''} ${b.name ?? ''}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}`.trim()}</Text>
            <Button size="xs" color="red" variant="light" onClick={() => onDelete(b.id)}>Удалить</Button>
          </Group>
        ))}
      </Stack>
    </Stack>
  )
}

function BaitsStatsList({ catches }: { catches: any[] }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'count' | 'weight' | 'name'>('count')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // группируем по bait_id (словарные) и по нормализованной строке (кастомные)
  type Row = { key: string; label: string; totalCount: number; totalWeightG: number }
  const map = new Map<string, Row>()
  for (const c of catches || []) {
    const dict = (c as any).dict_baits
    const label = (dict
      ? `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}`
      : (c.bait_name || '—')).trim()
    const key = c.bait_id ? `d:${c.bait_id}` : `n:${label.toLowerCase()}`
    const prev = map.get(key) || { key, label, totalCount: 0, totalWeightG: 0 }
    prev.totalCount += 1
    prev.totalWeightG += (c.weight_g || 0)
    prev.label = label
    map.set(key, prev)
  }
  let rows = Array.from(map.values())
  if (query.trim()) {
    const q = query.toLowerCase().trim()
    rows = rows.filter(r => r.label.toLowerCase().includes(q))
  }
  rows.sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'name') {
      const va = a.label.toLowerCase(), vb = b.label.toLowerCase()
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    }
    if (sortBy === 'weight') {
      if (a.totalWeightG < b.totalWeightG) return -1 * dir
      if (a.totalWeightG > b.totalWeightG) return 1 * dir
      return 0
    }
    // count
    if (a.totalCount < b.totalCount) return -1 * dir
    if (a.totalCount > b.totalCount) return 1 * dir
    return 0
  })

  return (
    <Stack gap="sm">
      <Group gap="sm" wrap="wrap">
        <TextInput label="Поиск" placeholder="Название/бренд/цвет/размер" value={query} onChange={(e) => setQuery(e.currentTarget.value)} style={{ minWidth: 260 }} />
        <Select label="Сортировка" value={sortBy} onChange={(v) => setSortBy((v as any) || 'count')} data={[
          { value: 'count', label: 'Кол-во поимок' },
          { value: 'weight', label: 'Суммарный вес' },
          { value: 'name', label: 'Название' },
        ]} style={{ width: 220 }} />
        <Select label="Порядок" value={sortDir} onChange={(v) => setSortDir((v as any) || 'desc')} data={[
          { value: 'desc', label: 'По убыванию' },
          { value: 'asc', label: 'По возрастанию' },
        ]} style={{ width: 180 }} />
      </Group>
      <Stack gap={6}>
        {rows.length === 0 && <Text c="dimmed">Нет данных</Text>}
        {rows.map(r => (
          <Group key={r.key} justify="space-between">
            <Text>{r.label}</Text>
            <Text c="dimmed">{r.totalCount} • {(r.totalWeightG/1000).toFixed(2)} кг</Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  )
}

function TeamBaitsStats({ userTeams }: { userTeams: any[] }) {
  const [teamId, setTeamId] = useState<string | undefined>(userTeams[0]?.id)
  const { data: teamMembers } = useTeamMembers(teamId || '')
  const memberIds = (teamMembers || []).map((m: any) => m.user_id)
  const { data: catches } = useCatchesByUsers(memberIds)

  // агрегируем по пользователю и приманке (как в BaitsStatsList)
  type Row = { userId: string; userLabel: string; baitKey: string; baitLabel: string; count: number; weightG: number }
  const rows: Row[] = []
  const byUser: Record<string, { email?: string; nickname?: string }> = {}
  ;(teamMembers || []).forEach((m: any) => {
    byUser[m.user_id] = { email: m.user_email, nickname: m.user_nickname }
  })
  for (const c of catches || []) {
    const dict = (c as any).dict_baits
    const baitLabel = (dict ? `${dict.brand ?? ''} ${dict.name ?? ''} ${dict.color ?? ''} ${dict.size ?? ''}` : (c.bait_name || '—')).trim()
    const baitKey = c.bait_id ? `d:${c.bait_id}` : `n:${baitLabel.toLowerCase()}`
    rows.push({
      userId: c.user_id,
      userLabel: byUser[c.user_id]?.nickname || byUser[c.user_id]?.email || c.user_id,
      baitKey,
      baitLabel,
      count: 1,
      weightG: c.weight_g || 0,
    })
  }
  // сводим
  const aggMap = new Map<string, { userId: string; userLabel: string; baitLabel: string; count: number; weightG: number }>()
  for (const r of rows) {
    const key = `${r.userId}::${r.baitKey}`
    const prev = aggMap.get(key) || { userId: r.userId, userLabel: r.userLabel, baitLabel: r.baitLabel, count: 0, weightG: 0 }
    prev.count += r.count
    prev.weightG += r.weightG
    prev.baitLabel = r.baitLabel
    aggMap.set(key, prev)
  }
  const list = Array.from(aggMap.values())

  // сортировка: по пользователю, потом по количеству
  list.sort((a, b) => {
    if (a.userLabel.toLowerCase() < b.userLabel.toLowerCase()) return -1
    if (a.userLabel.toLowerCase() > b.userLabel.toLowerCase()) return 1
    if (a.count > b.count) return -1
    if (a.count < b.count) return 1
    return 0
  })

  return (
    <Stack gap="sm">
      <Group gap="sm" wrap="wrap">
        <Select
          label="Команда"
          placeholder="Выберите команду"
          data={(userTeams || []).map((t: any) => ({ value: t.id, label: t.name }))}
          value={teamId}
          onChange={(v) => setTeamId(v || undefined)}
          searchable
          style={{ minWidth: 260 }}
        />
      </Group>
      <Stack gap={6}>
        {(!teamId || (teamMembers || []).length === 0) && <Text c="dimmed">Выберите команду</Text>}
        {teamId && list.length === 0 && <Text c="dimmed">Нет данных</Text>}
        {list.map((r, i) => (
          <Group key={`${r.userId}-${i}`} justify="space-between">
            <Text>{r.userLabel} — {r.baitLabel}</Text>
            <Text c="dimmed">{r.count} • {(r.weightG/1000).toFixed(2)} кг</Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  )
}

function CreateTeamForm({ onSubmit, isSubmitting }: { 
  onSubmit: (values: { name: string; description: string }) => void
  isSubmitting: boolean 
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notifications.show({ color: 'red', message: 'Введите название команды' })
      return
    }
    onSubmit({ name, description })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Название команды"
          placeholder="Введите название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Описание"
          placeholder="Описание команды (опционально)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Создать
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

function CreateSoloTrainingForm({ onCreate, isSubmitting }: { onCreate: (values: { title: string; description?: string; starts_at: string; ends_at?: string; lat?: number | null; lng?: number | null; area_points?: [number, number][] | null; target_fish_kinds?: string[] | null }) => Promise<void> | void; isSubmitting: boolean }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState<Date | null>(new Date())
  const [endsAt, setEndsAt] = useState<Date | null>(null)
  const [point, setPoint] = useState<L.LatLng | null>(null)
  const [polygon, setPolygon] = useState<L.LatLng[]>([])
  const [targetFishKinds, setTargetFishKinds] = useState<string[]>([])
  
  // Получаем список видов рыбы
  const { data: fishKinds } = useFishKinds()

  function ClickHandler() {
    useMapEvents({
      click(e) {
        setPoint(e.latlng)
      },
      contextmenu(e) {
        setPolygon((prev) => [...prev, e.latlng])
      },
      dblclick() {
        setPolygon([])
      },
    })
    return null
  }

  return (
    <Stack gap="sm">
      <Title order={5}>Новая личная тренировка</Title>
      <TextInput label="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Textarea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      
      {/* Выбор целевой рыбы */}
      <MultiSelect
        label="Целевая рыба"
        placeholder="Выберите виды рыбы для тренировки"
        data={fishKinds?.map(fish => ({ value: fish.id, label: fish.name })) || []}
        value={targetFishKinds}
        onChange={setTargetFishKinds}
        searchable
        clearable
        description="Можно выбрать несколько видов рыбы. Участники смогут выбирать из этого списка при создании поимок."
      />
      
      <Group grow>
        <DateTimePicker 
          label="Начало" 
          value={startsAt} 
          onChange={(value) => {
            if (value) {
              setStartsAt(new Date(value))
            } else {
              setStartsAt(null)
            }
          }} 
          required 
          popoverProps={{ withinPortal: true, zIndex: 10000 }}
        />
        <DateTimePicker 
          label="Окончание" 
          value={endsAt} 
          onChange={(value) => {
            if (value) {
              setEndsAt(new Date(value))
            } else {
              setEndsAt(null)
            }
          }} 
          popoverProps={{ withinPortal: true, zIndex: 10000 }}
        />
      </Group>
      <Stack>
        <Text size="sm" c="dimmed">Клик — поставить точку тренировки. Правый клик — добавить вершину полигона зоны. Двойной клик — очистить полигон.</Text>
        <div style={{ height: 280, width: '100%' }}>
          <MapContainer center={[53.9, 27.5667]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <MapVisibilityFixProfile />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickHandler />
            {point && <Marker position={point} />}
            {polygon.length >= 2 && <Polygon positions={polygon} pathOptions={{ color: 'teal' }} />}
          </MapContainer>
        </div>
      </Stack>
      <Group justify="flex-end">
        <Button disabled={!title.trim() || !startsAt} loading={isSubmitting} onClick={async () => {
          // Убеждаемся, что startsAt является объектом Date
          const startDate = startsAt instanceof Date ? startsAt : new Date(startsAt || Date.now())
          const endDate = endsAt instanceof Date ? endsAt : (endsAt ? new Date(endsAt) : null)
          
          await onCreate({
            title: title.trim(),
            description: description.trim() || undefined,
            starts_at: startDate.toISOString(),
            ends_at: endDate ? endDate.toISOString() : undefined,
            lat: point ? point.lat : null,
            lng: point ? point.lng : null,
            area_points: polygon.length >= 3 ? polygon.map(p => [p.lng, p.lat]) as [number, number][] : null,
            target_fish_kinds: targetFishKinds.length > 0 ? targetFishKinds : null,
          })
          setTitle('')
          setDescription('')
          setEndsAt(null)
          setPoint(null)
          setPolygon([])
          setTargetFishKinds([])
        }}>Создать</Button>
      </Group>
    </Stack>
  )
}

function EditSoloTrainingForm({ training, onEdit, isSubmitting }: { 
  training: any; 
  onEdit: (values: { title: string; description?: string; starts_at: string; ends_at?: string; lat?: number | null; lng?: number | null; area_points?: [number, number][] | null; target_fish_kinds?: string[] | null }) => Promise<void> | void; 
  isSubmitting: boolean 
}) {
  const [title, setTitle] = useState(training?.title || '')
  const [description, setDescription] = useState(training?.description || '')
  const [startsAt, setStartsAt] = useState<Date>(training?.starts_at ? new Date(training.starts_at) : new Date())
  const [endsAt, setEndsAt] = useState<Date | null>(training?.ends_at ? new Date(training.ends_at) : null)
  const [point, setPoint] = useState<L.LatLng | null>(training?.lat && training?.lng ? L.latLng(training.lat, training.lng) : null)
  const [polygon, setPolygon] = useState<L.LatLng[]>(training?.area_geojson?.coordinates?.[0]?.map((coord: [number, number]) => L.latLng(coord[1], coord[0])) || [])
  const [targetFishKinds, setTargetFishKinds] = useState<string[]>(training?.target_fish_kinds || [])
  
  // Получаем список видов рыбы
  const { data: fishKinds } = useFishKinds()

  // Обновляем состояние при изменении тренировки
  useEffect(() => {
    if (training) {
      setTitle(training.title || '')
      setDescription(training.description || '')
      setStartsAt(training.starts_at ? new Date(training.starts_at) : new Date())
      setEndsAt(training.ends_at ? new Date(training.ends_at) : null)
      setPoint(training.lat && training.lng ? L.latLng(training.lat, training.lng) : null)
      setPolygon(training.area_geojson?.coordinates?.[0]?.map((coord: [number, number]) => L.latLng(coord[1], coord[0])) || [])
      setTargetFishKinds(training.target_fish_kinds || [])
    }
  }, [training])

  function ClickHandler() {
    useMapEvents({
      click(e) {
        setPoint(e.latlng)
      },
      contextmenu(e) {
        setPolygon((prev) => [...prev, e.latlng])
      },
      dblclick() {
        setPolygon([])
      },
    })
    return null
  }

  return (
    <Stack gap="sm">
      <Title order={5}>Редактировать личную тренировку</Title>
      <TextInput label="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Textarea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      
      {/* Выбор целевой рыбы */}
      <MultiSelect
        label="Целевая рыба"
        placeholder="Выберите виды рыбы для тренировки"
        data={fishKinds?.map(fish => ({ value: fish.id, label: fish.name })) || []}
        value={targetFishKinds}
        onChange={setTargetFishKinds}
        searchable
        clearable
        description="Можно выбрать несколько видов рыбы. Участники смогут выбирать из этого списка при создании поимок."
      />
      
      <Group grow>
        <DateTimePicker 
          label="Начало" 
          value={startsAt} 
          onChange={(v: Date | string | null) => {
            if (v instanceof Date) {
              setStartsAt(v)
            } else if (typeof v === 'string') {
              setStartsAt(new Date(v))
            }
          }} 
          required 
          popoverProps={{ withinPortal: true, zIndex: 10000 }}
        />
        <DateTimePicker 
          label="Окончание" 
          value={endsAt} 
          onChange={(v: Date | string | null) => {
            if (v instanceof Date) {
              setEndsAt(v)
            } else if (typeof v === 'string') {
              setEndsAt(new Date(v))
            } else {
              setEndsAt(null)
            }
          }} 
          popoverProps={{ withinPortal: true, zIndex: 10000 }}
        />
      </Group>
      <Stack>
        <Text size="sm" c="dimmed">Клик — поставить точку тренировки. Правый клик — добавить вершину полигона зоны. Двойной клик — очистить полигон.</Text>
        <div style={{ height: 280, width: '100%' }}>
          <MapContainer center={[53.9, 27.5667]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <MapVisibilityFixProfile />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickHandler />
            {point && <Marker position={point} />}
            {polygon.length >= 2 && <Polygon positions={polygon} pathOptions={{ color: 'teal' }} />}
          </MapContainer>
        </div>
      </Stack>
      <Group justify="flex-end">
        <Button disabled={!title.trim() || !startsAt} loading={isSubmitting} onClick={async () => {
          await onEdit({
            title: title.trim(),
            description: description.trim() || undefined,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt ? endsAt.toISOString() : undefined,
            lat: point ? point.lat : null,
            lng: point ? point.lng : null,
            area_points: polygon.length >= 3 ? polygon.map(p => [p.lng, p.lat]) as [number, number][] : null,
            target_fish_kinds: targetFishKinds.length > 0 ? targetFishKinds : null,
          })
        }}>Сохранить изменения</Button>
      </Group>
    </Stack>
  )
}

function MapVisibilityFixProfile() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const onShow = () => {
      setTimeout(() => map.invalidateSize(), 0)
      setTimeout(() => map.invalidateSize(), 200)
    }
    const io = new IntersectionObserver((entries) => {
      const e = entries[0]
      if (e.isIntersecting) onShow()
    }, { threshold: [0, 0.1, 0.5, 1] })
    io.observe(container)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(container)
    onShow()
    return () => { io.disconnect(); ro.disconnect() }
  }, [map])
  return null
}

function InviteUserForm({ onSubmit, isSubmitting, teamName }: { 
  onSubmit: (values: { email: string }) => void
  isSubmitting: boolean
  teamName: string
}) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      notifications.show({ color: 'red', message: 'Введите email пользователя' })
      return
    }
    onSubmit({ email })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Пригласить пользователя в команду "{teamName}"
        </Text>
        <TextInput
          label="Email пользователя"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Отправить приглашение
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
