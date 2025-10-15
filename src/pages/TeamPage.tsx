import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  Stack,
  Tabs,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Alert,
  Paper,
  Box,
  MultiSelect,
} from "@mantine/core";
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
import {
  IconEdit,
  IconTrash,
  IconUser,
  IconMail,
  IconArrowLeft,
  IconUserPlus,
} from "@tabler/icons-react";

// Импортируем настоящие типы и хуки
import type {
  Team,
  TeamMember,
  TeamInvitation,
  TeamRole,
} from "@/features/teams/types";
// import { useTeamMembers } from "@/features/teams/hooks";
import { useAuth } from "@/features/auth/hooks";
import { notifications } from "@mantine/notifications";
import { useTeamTrainings } from '@/features/trainings/hooks'
import { useTeamPageVM } from '@/features/teams/model/useTeamPageVM'
import { useFishKinds } from '@/features/dicts/fish/hooks'

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const vm = useTeamPageVM(teamId, user?.id)
  const { teamQuery, membersQuery, invitationsQuery, /*trainingsQuery,*/ onEditTeam, onDeleteTeam, onRemoveMember, onUpdateMemberRole, onDeleteInvitation, onCreateInvitation, createTraining, updateTraining, deleteTraining, isCreatingTraining, isUpdatingTraining, isDeletingTraining } = vm
  const { data: team, isLoading: teamLoading, error: teamError } = teamQuery
  const { data: members, isLoading: membersLoading } = membersQuery
  const { data: invitations, isLoading: invitationsLoading } = invitationsQuery

  const { data: teamTrainings } = useTeamTrainings(teamId)

  

  const [editModalOpened, editModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);
  const [inviteModalOpened, inviteModalHandlers] = useDisclosure(false);
     const [createTrainingOpened, createTrainingHandlers] = useDisclosure(false);
   const [editTrainingOpened, editTrainingHandlers] = useDisclosure(false);
   const [editingTraining, setEditingTraining] = useState<any>(null);
   const [mapCenter, setMapCenter] = useState<[number, number]>([53.9, 27.5667]);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as TeamRole,
  });

  // Справочник ролей в команде
  const teamRoles: { value: TeamRole; label: string; description: string }[] = [
    {
      value: "member",
      label: "Участник",
      description: "Обычный участник команды",
    },
    {
      value: "captain",
      label: "Капитан",
      description: "Может управлять командой и участниками",
    },
    {
      value: "coach",
      label: "Тренер",
      description: "Отвечает за тренировки и развитие команды",
    },
    {
      value: "creator",
      label: "Создатель",
      description: "Полный доступ к управлению командой",
    },
  ];

     useEffect(() => {
     if (team) {
       setEditForm({
         name: team.name,
         description: team.description || "",
       });
     }
   }, [team]);

   // Автоматически центрируем карту на точке тренировки при открытии редактирования
   useEffect(() => {
     if (editingTraining?.lat && editingTraining?.lng) {
       setMapCenter([editingTraining.lat, editingTraining.lng])
     }
   }, [editingTraining])

  if (!teamId) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" title="Ошибка">
          ID команды не указан
        </Alert>
      </Container>
    );
  }

  if (teamLoading) {
    return (
      <Container size="lg" py="xl">
        <Text>Загрузка команды...</Text>
      </Container>
    );
  }

  if (teamError || !team) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" title="Ошибка">
          Не удалось загрузить команду
        </Alert>
      </Container>
    );
  }

  // После проверки team не null, приводим к типу Team
  const teamData = team as Team;

  const isCaptain = members?.some(
    (member: TeamMember) =>
      member.user_id === user?.id &&
      (member.role === "captain" || member.role === "creator")
  );
  const isCoach = members?.some(
    (member: TeamMember) => member.user_id === user?.id && (member.role === 'coach' || member.role === 'captain' || member.role === 'creator')
  )

  const handleEditTeam = async () => {
    if (!teamId) return;

    try {
      await onEditTeam({ id: teamId, input: editForm });
      editModalHandlers.close();
    } catch (error) {
      console.error("Ошибка при обновлении команды:", error);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;

    try {
      await onDeleteTeam(teamId);
      navigate("/profile");
    } catch (error) {
      console.error("Ошибка при удалении команды:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const member = members?.find((m: TeamMember) => m.id === memberId);
      if (member) {
        await onRemoveMember({ teamId: teamId!, userId: member.user_id });
      }
    } catch (error) {
      console.error("Ошибка при удалении участника:", error);
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: TeamRole
  ) => {
    try {
      const member = members?.find((m: TeamMember) => m.id === memberId);
      if (member) {
        await onUpdateMemberRole({ teamId: teamId!, userId: member.user_id, role: newRole });
      }
    } catch (error) {
      console.error("Ошибка при обновлении роли:", error);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await onDeleteInvitation(invitationId);
    } catch (error) {
      console.error("Ошибка при удалении приглашения:", error);
    }
  };

  const handleInviteMember = async () => {
    if (!teamId || !user) return;

    try {
      await onCreateInvitation({ team_id: teamId, invited_user_email: inviteForm.email.trim(), invited_by: user.id, role: inviteForm.role });

      setInviteForm({ email: "", role: "member" });
      inviteModalHandlers.close();
    } catch (error: any) {
      notifications.show({
        color: "red",
        message: error?.message || "Ошибка при отправке приглашения",
      });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate("/profile")}
        >
          Назад к профилю
        </Button>

        <Paper p="xl" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={1}>{teamData.name}</Title>
                {teamData.description && (
                  <Text c="dimmed" mt="xs">
                    {teamData.description}
                  </Text>
                )}
                <Group gap="xs" mt="xs">
                  <Text size="sm" c="dimmed">
                    Создана:{" "}
                    {new Date(teamData.created_at).toLocaleDateString("ru-RU")}
                  </Text>
                  {members && members.length > 0 && (
                    <Text size="sm" c="dimmed">
                      • Создатель:{" "}
                      {members.find((m) => m.user_id === teamData.created_by)
                        ?.user_nickname ||
                        members.find((m) => m.user_id === teamData.created_by)
                          ?.user_email ||
                        `ID: ${teamData.created_by}`}
                    </Text>
                  )}
                </Group>
              </div>

              {isCaptain && (
                <Group>
                  <Button
                    variant="outline"
                    leftSection={<IconUserPlus size={16} />}
                    onClick={inviteModalHandlers.open}
                  >
                    Пригласить участника
                  </Button>
                  <Button
                    variant="outline"
                    leftSection={<IconEdit size={16} />}
                    onClick={editModalHandlers.open}
                  >
                    Редактировать
                  </Button>
                  <Button
                    color="red"
                    variant="outline"
                    leftSection={<IconTrash size={16} />}
                    onClick={deleteModalHandlers.open}
                  >
                    Удалить команду
                  </Button>
                </Group>
              )}
            </Group>
          </Stack>
        </Paper>

        <Tabs defaultValue="members">
          <Tabs.List>
            <Tabs.Tab value="members" leftSection={<IconUser size={16} />}>
              Участники ({members?.length || 0})
            </Tabs.Tab>
            <Tabs.Tab value="invitations" leftSection={<IconMail size={16} />}>
              Приглашения ({invitations?.length || 0})
            </Tabs.Tab>
            <Tabs.Tab value="trainings">Тренировки</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="members" pt="md">
            <Stack gap="md">
              {membersLoading ? (
                <Text>Загрузка участников...</Text>
              ) : members && members.length > 0 ? (
                members.map((member: TeamMember) => (
                  <Card key={member.id} withBorder>
                    <Group justify="space-between">
                      <div>
                        <Box>
                          <Text fw={500}>
                            {member.user_nickname ||
                              member.user_email ||
                              `Участник (ID: ${member.user_id})`}
                          </Text>
                          <Group gap="xs" mt="xs">
                            {member.role === "captain" && (
                              <Badge color="blue" size="sm">
                                Капитан
                              </Badge>
                            )}
                            {member.role === "coach" && (
                              <Badge color="teal" size="sm">
                                Тренер
                              </Badge>
                            )}
                            {member.role === "creator" && (
                              <Badge color="purple" size="sm">
                                Создатель
                              </Badge>
                            )}
                            {member.user_id === teamData.created_by &&
                              member.role !== "creator" && (
                                <Badge color="green" size="sm">
                                  Создатель
                                </Badge>
                              )}
                          </Group>
                        </Box>
                        <Text size="sm" c="dimmed">
                          {member.user_email && `Email: ${member.user_email}`}
                          {member.user_nickname && member.user_email && " • "}
                          {member.user_nickname &&
                            `Никнейм: ${member.user_nickname}`}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Присоединился:{" "}
                          {new Date(member.joined_at).toLocaleDateString(
                            "ru-RU"
                          )}
                        </Text>
                      </div>

                      {isCaptain && member.user_id !== user?.id && (
                        <Group>
                          <Select
                            size="sm"
                            value={member.role}
                            onChange={(value) =>
                              value &&
                              handleUpdateMemberRole(
                                member.id,
                                value as TeamRole
                              )
                            }
                            data={teamRoles}
                          />
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Group>
                  </Card>
                ))
              ) : (
                <Text c="dimmed">Участники не найдены</Text>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="invitations" pt="md">
            <Stack gap="md">
              {invitationsLoading ? (
                <Text>Загрузка приглашений...</Text>
              ) : invitations && invitations.length > 0 ? (
                invitations.map((invitation: TeamInvitation) => (
                  <Card key={invitation.id} withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>
                          {invitation.invited_user_nickname ||
                            invitation.invited_user_email}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Приглашен:{" "}
                          {new Date(invitation.created_at).toLocaleDateString(
                            "ru-RU"
                          )}
                        </Text>
                        <Badge
                          color={
                            invitation.status === "pending"
                              ? "yellow"
                              : invitation.status === "accepted"
                              ? "green"
                              : "red"
                          }
                          size="sm"
                        >
                          {invitation.status === "pending"
                            ? "Ожидает"
                            : invitation.status === "accepted"
                            ? "Принято"
                            : "Отклонено"}
                        </Badge>
                      </div>

                      {isCaptain && invitation.status === "pending" && (
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleDeleteInvitation(invitation.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Card>
                ))
              ) : (
                <Text c="dimmed">Приглашения не найдены</Text>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="trainings" pt="md">
            <Stack gap="md">
              {(isCoach) && (
                <Group justify="flex-end">
                  <Button onClick={createTrainingHandlers.open}>Добавить тренировку</Button>
                </Group>
              )}

              {(teamTrainings ?? []).length === 0 && (
                <Text c="dimmed">Тренировок пока нет</Text>
              )}

              {(teamTrainings ?? []).map((t) => (
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
                       {isCoach && (
                         <>
                           <Button size="xs" variant="light" onClick={() => {
                             setEditingTraining(t)
                             // Устанавливаем центр карты на точку тренировки, если она есть
                             if (t.lat && t.lng) {
                               setMapCenter([t.lat, t.lng])
                             } else {
                               setMapCenter([53.9, 27.5667]) // Дефолтный центр
                             }
                             editTrainingHandlers.open()
                           }}>Редактировать</Button>
                           <Button color="red" variant="light" size="xs" onClick={async () => {
                             await deleteTraining(t.id)
                             notifications.show({ color: 'gray', message: 'Тренировка удалена' })
                           }} loading={isDeletingTraining}>Удалить</Button>
                         </>
                       )}
                     </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Модальное окно редактирования команды */}
      <Modal
        opened={editModalOpened}
        onClose={editModalHandlers.close}
        title="Редактировать команду"
      >
        <Stack gap="md">
          <TextInput
            label="Название команды"
            value={editForm.name}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          <Textarea
            label="Описание"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={editModalHandlers.close}>
              Отмена
            </Button>
            <Button onClick={handleEditTeam}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        title="Удалить команду"
      >
        <Stack gap="md">
          <Alert color="red" title="Внимание!">
            Это действие нельзя отменить. Команда будет удалена навсегда.
          </Alert>
          <Group justify="flex-end">
            <Button variant="outline" onClick={deleteModalHandlers.close}>
              Отмена
            </Button>
            <Button
              color="red"
              onClick={handleDeleteTeam}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно приглашения участника */}
      <Modal
        opened={inviteModalOpened}
        onClose={inviteModalHandlers.close}
        title="Пригласить участника"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Отправьте приглашение пользователю по email. После принятия
            приглашения пользователь станет участником команды.
          </Text>

          <TextInput
            label="Email пользователя"
            placeholder="user@example.com"
            value={inviteForm.email}
            onChange={(e) =>
              setInviteForm((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />

          <Select
            label="Роль в команде"
            description="Выберите роль для приглашаемого участника"
            value={inviteForm.role}
            onChange={(value) =>
              value &&
              setInviteForm((prev) => ({ ...prev, role: value as TeamRole }))
            }
            data={teamRoles}
          />

          <Group justify="flex-end">
            <Button variant="outline" onClick={inviteModalHandlers.close}>
              Отмена
            </Button>
            <Button
              onClick={handleInviteMember}
              
              disabled={!inviteForm.email.trim()}
            >
              Отправить приглашение
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно создания тренировки */}
      <Modal
        opened={createTrainingOpened}
        onClose={createTrainingHandlers.close}
        title="Новая тренировка"
        size="lg"
      >
        <CreateTeamTrainingForm
          onCreate={async (values) => {
            if (!teamId || !user) return
            try {
              await createTraining({
                type: 'team',
                title: values.title,
                description: values.description || undefined,
                starts_at: values.starts_at,
                ends_at: values.ends_at || undefined,
                lat: values.lat ?? null,
                lng: values.lng ?? null,
                target_fish_kinds: values.target_fish_kinds || null,
                team_id: teamId,
                created_by: user.id,
              })
              notifications.show({ color: 'green', message: 'Тренировка создана' })
              createTrainingHandlers.close()
            } catch (e: any) {
              notifications.show({ color: 'red', message: e?.message ?? 'Не удалось создать тренировку' })
            }
          }}
          isSubmitting={isCreatingTraining}
        />
       </Modal>

       {/* Модальное окно редактирования тренировки */}
       <Modal
         opened={editTrainingOpened}
         onClose={editTrainingHandlers.close}
         title="Редактировать тренировку"
         size="lg"
       >
         <EditTeamTrainingForm
           training={editingTraining}
           mapCenter={mapCenter}
                     onEdit={async (values: { title: string; description?: string; starts_at: string; ends_at?: string; lat?: number | null; lng?: number | null; area_points?: [number, number][] | null; target_fish_kinds?: string[] | null }) => {
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
               editTrainingHandlers.close()
               setEditingTraining(null)
             } catch (e: any) {
               notifications.show({ color: 'red', message: e?.message ?? 'Не удалось обновить тренировку' })
             }
           }}
           isSubmitting={isUpdatingTraining}
         />
       </Modal>
     </Container>
   );
 }

function CreateTeamTrainingForm({ onCreate, isSubmitting }: { onCreate: (values: { title: string; description?: string; starts_at: string; ends_at?: string; lat?: number | null; lng?: number | null; area_points?: [number, number][] | null; target_fish_kinds?: string[] | null }) => Promise<void> | void; isSubmitting: boolean }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState<Date>(new Date())
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
        // Right click to add polygon vertex
        setPolygon((prev) => [...prev, e.latlng])
      },
      dblclick() {
        // Double click to clear polygon
        setPolygon([])
      },
    })
    return null
  }

  return (
    <Stack gap="sm">
      <Title order={5}>Новая тренировка команды</Title>
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
            <MapVisibilityFix />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickHandler />
            {point && <Marker position={point} />}
            {polygon.length >= 2 && <Polygon positions={polygon} pathOptions={{ color: 'teal' }} />}
          </MapContainer>
        </div>
      </Stack>
      <Group justify="flex-end">
                 <Button disabled={!title.trim() || !startsAt} loading={isSubmitting} onClick={async () => {
          await onCreate({
            title: title.trim(),
            description: description.trim() || undefined,
            starts_at: startsAt instanceof Date ? startsAt.toISOString() : new Date().toISOString(),
            ends_at: endsAt instanceof Date ? endsAt.toISOString() : undefined,
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
 
 function EditTeamTrainingForm({ training, mapCenter, onEdit, isSubmitting }: { 
 training: any; 
 mapCenter: [number, number];
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
         // Right click to add polygon vertex
         setPolygon((prev) => [...prev, e.latlng])
       },
       dblclick() {
         // Double click to clear polygon
         setPolygon([])
       },
     })
     return null
   }
 
     return (
    <Stack gap="sm">
      <Title order={5}>Редактировать тренировку команды</Title>
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
           <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
             <MapVisibilityFix />
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
             starts_at: startsAt instanceof Date ? startsAt.toISOString() : new Date().toISOString(),
             ends_at: endsAt instanceof Date ? endsAt.toISOString() : undefined,
             lat: point ? point.lat : null,
             lng: point ? point.lng : null,
                         area_points: polygon.length >= 3 ? polygon.map(p => [p.lng, p.lat]) as [number, number][] : null,
            target_fish_kinds: targetFishKinds.length > 0 ? targetFishKinds : null,
          })
        }}>Сохранить</Button>
       </Group>
     </Stack>
   )
 }
 
 function MapVisibilityFix() {
  const map = useMap()
  // Invalidate on intersection and resize
  useEffect(() => {
    if (!map) return
    
    const container = map.getContainer()
    if (!container) return
    
    const onShow = () => {
      try {
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.invalidateSize()
          }
        }, 0)
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.invalidateSize()
          }
        }, 200)
      } catch (error) {
        // Ignore errors during map invalidation
      }
    }
    
    const io = new IntersectionObserver((entries) => {
      const e = entries[0]
      if (e.isIntersecting) onShow()
    }, { threshold: [0, 0.1, 0.5, 1] })
    
    const ro = new ResizeObserver(() => {
      try {
        if (map && map.getContainer()) {
          map.invalidateSize()
        }
      } catch (error) {
        // Ignore errors during map invalidation
      }
    })
    
    io.observe(container)
    ro.observe(container)
    onShow()
    
    return () => { 
      io.disconnect()
      ro.disconnect() 
    }
  }, [map])
  return null
}
