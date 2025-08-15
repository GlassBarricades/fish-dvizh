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
} from "@mantine/core";
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
} from "../features/teams/types";
import {
  useTeam,
  useTeamMembers,
  useTeamInvitations,
  useUpdateTeam,
  useDeleteTeam,
  useRemoveTeamMember,
  useUpdateTeamMemberRole,
  useDeleteTeamInvitation,
  useCreateTeamInvitation,
} from "../features/teams/hooks";
import { useAuth } from "../features/auth/hooks";
import { notifications } from "@mantine/notifications";

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: team,
    isLoading: teamLoading,
    error: teamError,
  } = useTeam(teamId!);
  const { data: members, isLoading: membersLoading } = useTeamMembers(teamId!);
  const { data: invitations, isLoading: invitationsLoading } =
    useTeamInvitations(teamId!);

  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const removeMember = useRemoveTeamMember();
  const updateMemberRole = useUpdateTeamMemberRole();
  const deleteInvitation = useDeleteTeamInvitation();
  const createInvitation = useCreateTeamInvitation();

  const [editModalOpened, editModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);
  const [inviteModalOpened, inviteModalHandlers] = useDisclosure(false);
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

  const handleEditTeam = async () => {
    if (!teamId) return;

    try {
      await updateTeam.mutateAsync({
        id: teamId,
        input: editForm,
      });
      editModalHandlers.close();
    } catch (error) {
      console.error("Ошибка при обновлении команды:", error);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;

    try {
      await deleteTeam.mutateAsync(teamId);
      navigate("/profile");
    } catch (error) {
      console.error("Ошибка при удалении команды:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const member = members?.find((m: TeamMember) => m.id === memberId);
      if (member) {
        await removeMember.mutateAsync({
          teamId: teamId!,
          userId: member.user_id,
        });
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
        await updateMemberRole.mutateAsync({
          teamId: teamId!,
          userId: member.user_id,
          role: newRole,
        });
      }
    } catch (error) {
      console.error("Ошибка при обновлении роли:", error);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await deleteInvitation.mutateAsync(invitationId);
    } catch (error) {
      console.error("Ошибка при удалении приглашения:", error);
    }
  };

  const handleInviteMember = async () => {
    if (!teamId || !user) return;

    try {
      await createInvitation.mutateAsync({
        team_id: teamId,
        invited_user_email: inviteForm.email.trim(),
        invited_by: user.id,
        role: inviteForm.role,
      });

      notifications.show({
        color: "green",
        message: "Приглашение отправлено успешно",
      });

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
            <Button onClick={handleEditTeam} loading={updateTeam.isPending}>
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
              loading={deleteTeam.isPending}
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
              loading={createInvitation.isPending}
              disabled={!inviteForm.email.trim()}
            >
              Отправить приглашение
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
