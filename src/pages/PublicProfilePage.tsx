import { useParams } from 'react-router-dom'
import { Container, Paper, Stack, Title, Text, Badge, Group, Grid, Card, Loader, Tabs} from '@mantine/core'
import { usePublicUserProfile } from '@/features/profile/hooks/usePublicUserProfile'
import { IconUser, IconUsers, IconTrophy, IconCrown } from '@tabler/icons-react'
import { Avatar as AvatarComponent } from '@/components/Avatar'

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  
  const { data: profile, isLoading, isError } = usePublicUserProfile(userId)

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Загрузка профиля...</Text>
        </Stack>
      </Container>
    )
  }

  if (isError || !profile) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Text ta="center" c="dimmed">
            Профиль не найден
          </Text>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Paper p="xl" withBorder>
          <Stack gap="md">
            <Group gap="lg" align="flex-start">
              <AvatarComponent src={profile.avatar} size={120} />
              <Stack gap="sm" style={{ flex: 1 }}>
                <Group gap="md" align="center">
                  <Title order={2}>
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile.email?.split('@')[0] || 'Пользователь'}
                  </Title>
                  <Badge variant="light" color="blue" size="lg">
                    {profile.role || 'user'}
                  </Badge>
                </Group>
                {profile.birth_date && (
                  <Text size="sm" c="dimmed">
                    Дата рождения: {new Date(profile.birth_date).toLocaleDateString('ru-RU')}
                  </Text>
                )}
                {profile.phone && (
                  <Text size="sm" c="dimmed">
                    Телефон: {profile.phone}
                  </Text>
                )}
              </Stack>
            </Group>

            {/* Stats */}
            <Grid mt="md">
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card withBorder p="md" radius="md">
                  <Stack gap="xs" align="center">
                    <IconTrophy size={32} color="var(--mantine-color-yellow-6)" />
                    <Text size="xl" fw={700}>{profile.total_achievements || 0}</Text>
                    <Text size="sm" c="dimmed" ta="center">Достижений</Text>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card withBorder p="md" radius="md">
                  <Stack gap="xs" align="center">
                    <IconUsers size={32} color="var(--mantine-color-blue-6)" />
                    <Text size="xl" fw={700}>{profile.total_teams || 0}</Text>
                    <Text size="sm" c="dimmed" ta="center">Команд</Text>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card withBorder p="md" radius="md">
                  <Stack gap="xs" align="center">
                    <IconCrown size={32} color="var(--mantine-color-purple-6)" />
                    <Text size="xl" fw={700}>{profile.total_trainings || 0}</Text>
                    <Text size="sm" c="dimmed" ta="center">Тренировок</Text>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card withBorder p="md" radius="md">
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw={700}>{profile.total_points || 0}</Text>
                    <Text size="sm" c="dimmed" ta="center">Очков</Text>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Tabs */}
        <Paper p="xl" withBorder>
          <Tabs defaultValue="achievements">
            <Tabs.List>
              <Tabs.Tab value="achievements" leftSection={<IconTrophy size={16} />}>
                Достижения
              </Tabs.Tab>
              <Tabs.Tab value="teams" leftSection={<IconUsers size={16} />}>
                Команды
              </Tabs.Tab>
              <Tabs.Tab value="stats" leftSection={<IconUser size={16} />}>
                Статистика
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="achievements" pt="md">
              {profile.achievements && profile.achievements.length > 0 ? (
                <Stack gap="md">
                  {profile.achievements.map((achievement: any) => (
                    <Card key={achievement.id} withBorder p="md">
                      <Group gap="md">
                        <Badge size="lg" color="yellow" variant="light">
                          <IconTrophy size={20} />
                        </Badge>
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Text fw={500}>{achievement.name}</Text>
                          <Text size="sm" c="dimmed">{achievement.description}</Text>
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              {new Date(achievement.earned_at).toLocaleDateString('ru-RU')}
                            </Text>
                            {achievement.points && (
                              <Badge size="xs" variant="light">
                                {achievement.points} очков
                              </Badge>
                            )}
                          </Group>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Нет достижений
                </Text>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="teams" pt="md">
              {profile.teams && profile.teams.length > 0 ? (
                <Stack gap="md">
                  {profile.teams.map((team: any) => (
                    <Card key={team.id} withBorder p="md">
                      <Stack gap="xs">
                        <Group gap="xs" align="center">
                          <Title order={4}>{team.name}</Title>
                          {team.created_by === userId && (
                            <Badge size="xs" variant="light" color="yellow">
                              Создатель
                            </Badge>
                          )}
                        </Group>
                        {team.description && (
                          <Text size="sm" c="dimmed">
                            {team.description}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed">
                          Создана {new Date(team.created_at).toLocaleDateString('ru-RU')}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Нет команд
                </Text>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="stats" pt="md">
              <Stack gap="md">
                <Card withBorder p="md">
                  <Title order={4} mb="md">Статистика</Title>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text>Зарегистрирован:</Text>
                      <Text fw={500}>
                        {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text>Всего очков:</Text>
                      <Text fw={500}>{profile.total_points || 0}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text>Достижений:</Text>
                      <Text fw={500}>{profile.total_achievements || 0}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text>Команд:</Text>
                      <Text fw={500}>{profile.total_teams || 0}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text>Тренировок:</Text>
                      <Text fw={500}>{profile.total_trainings || 0}</Text>
                    </Group>
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  )
}
